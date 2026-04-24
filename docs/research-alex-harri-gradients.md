# Alex Harri — "A flowing WebGL gradient, deconstructed"

## Overview

Blog post: [alexharri.com/blog/webgl-gradients](https://alexharri.com/blog/webgl-gradients)
Source: [github.com/alexharri/website](https://github.com/alexharri/website/blob/eb9551dd73126857045035b378b194dbf923c675/src/components/WebGLShader/shaders/fragment/final.ts)

A single-pass WebGL fragment shader that renders animated, flowing gradient waves. The effect is used as the hero background on Alex Harri's personal website.

## Architecture

Everything runs in **one fragment shader** — no multi-pass compositing. The shader is invoked per pixel, per frame.

### Uniforms

```glsl
uniform float u_time;       // Elapsed seconds
uniform float u_h;          // Canvas height
uniform float u_w;          // Canvas width
uniform sampler2D u_gradient; // 1x256 gradient texture
```

### Core Functions

#### `get_x()` — Centered X coordinate
```glsl
float get_x() {
  return 900.0 + gl_FragCoord.x - u_w / 2.0;
}
```
Centers the coordinate system so the effect looks consistent regardless of canvas width. The `900.0` offset ensures the noise field is always sampled from a pleasant region.

#### `wave_y_noise(offset)` — Wave boundary shape
Stacked 2D simplex noise at 4 different frequencies, creating the organic wave boundary:
```glsl
float wave_y_noise(float offset) {
  float x = get_x() * 0.000845;  // Very small scale = smooth curves
  float y = time * 0.075;         // Slow temporal evolution
  float x_shift = time * 0.026;   // Horizontal flow

  float sum = 0.0;
  sum += simplex_noise(vec2(x * 1.30 + x_shift, y * 0.54)) * 0.85;
  sum += simplex_noise(vec2(x * 1.00 + x_shift, y * 0.68)) * 1.15;
  sum += simplex_noise(vec2(x * 0.70 + x_shift, y * 0.59)) * 0.60;
  sum += simplex_noise(vec2(x * 0.40 + x_shift, y * 0.48)) * 0.40;
  return sum;
}
```
Key insight: The x coordinate is scaled by `0.000845` — extremely small, meaning the noise varies very slowly across the screen width, producing smooth, gentle wave shapes.

#### `background_noise(offset)` — Color variation across the canvas
3 octaves of 3D simplex noise creating smooth color variation:
```glsl
float background_noise(float offset) {
  float x = get_x() * 0.00085;
  float y = gl_FragCoord.y * 0.00085 * (1.0 / 0.27);  // Y_SCALE stretches vertically
  // ... 3 octaves at different scales and speeds
  return sum;  // ~0.2 to 0.8
}
```
The `Y_SCALE = 1/0.27 ≈ 3.7` stretches the noise vertically, so color bands run more horizontally than vertically.

#### `calc_blur(offset)` and `calc_blur_bias()` — Dynamic blur
The blur amount at the wave edge varies spatially and over time:
- `calc_blur_bias()` oscillates slowly with `sin(u_time * 0.261)`, creating a global "breathing" effect
- `calc_blur()` adds 2 layers of 2D simplex noise to the bias, so different parts of the wave edge have different blur amounts

#### `wave_alpha(Y, wave_height, offset)` — Wave boundary with blur
Computes how "inside" a pixel is relative to the wave boundary:
1. Calculates the wave Y position from base + noise
2. Computes signed distance from the wave curve
3. Applies multi-sample blur: **7 samples** at different exponents for high-quality soft edges

The `wave_alpha_part` function uses a sophisticated approach:
```glsl
float wave_alpha_part(float dist, float blur_fac, float t) {
  float exp = mix(0.90, 1.20, t);
  float v = pow(blur_fac, exp);
  v = ease_in(v);       // 1.0 - cos((x * PI) * 0.5)
  v = smoothstep(v);    // quintic Hermite: t³(6t²-15t+10)
  v = clamp(v, 0.008, 1.0);
  v *= 345.0;           // blur pixel radius
  float alpha = clamp(0.5 + dist / v, 0.0, 1.0);
  alpha = smoothstep(alpha);
  return alpha;
}
```

### Wave Configuration

Two wave layers with fixed positions:
```glsl
float WAVE1_Y = 0.45 * u_h;    // Main wave at 45% from bottom
float WAVE2_Y = 0.9 * u_h;     // Secondary wave at 90% from bottom
float WAVE1_HEIGHT = 0.195 * u_h;
float WAVE2_HEIGHT = 0.144 * u_h;
```

### Composition (main function)

```glsl
void main() {
  // Each region gets its own lightness noise
  float bg_lightness = background_noise(-192.4);
  float w1_lightness = background_noise(273.3);
  float w2_lightness = background_noise(623.1);

  // Wave alphas (different time offsets decorrelate motion)
  float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, 112.5 * 48.75);
  float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 225.0 * 36.00);

  // Layer composition: background → wave2 → wave1 (front-to-back)
  float lightness = bg_lightness;
  lightness = lerp(lightness, w2_lightness, w2_alpha);
  lightness = lerp(lightness, w1_lightness, w1_alpha);

  // Map lightness → gradient texture → final color
  gl_FragColor = vec4(calc_color(lightness), 1.0);
}
```

The composition uses `lerp` (not additive) — each wave replaces the background lightness in its region. The lightness value (0-1) maps into a gradient texture.

### Gradient Texture

Colors are pre-rendered to a **1×256 pixel canvas** using the 2D Canvas API:
```typescript
const gradient = ctx.createLinearGradient(0, 0, 256, 0);
colors.forEach((color, i) => {
  gradient.addColorStop(i / (colors.length - 1), color);
});
```
Uploaded as a WebGL texture. The fragment shader samples it with:
```glsl
texture2D(u_gradient, vec2(lightness, 0.5))
```

This decouples color design from shader math — changing colors only requires re-uploading the texture, no shader recompilation.

## Simplex Noise

Uses the Ashima Arts / Stefan Gustavson (stegu) simplex noise implementation:
- Source: [github.com/stegu/webgl-noise](https://github.com/stegu/webgl-noise) (MIT License)
- Both 2D (`simplex_noise(vec2)`) and 3D (`simplex_noise(vec3)`) variants
- GLSL function overloading (not suffixed names)
- Textureless, self-contained implementation

Helper functions: `mod289(vec2/vec3/vec4)`, `permute(vec3/vec4)`, `taylorInvSqrt(vec4)`

## Key Design Decisions

1. **Single-pass rendering** — no multi-pass blur or compositing. All softness comes from the alpha transition math.

2. **Gradient texture** — separates color from math. Artists can tweak colors without touching shaders.

3. **Time offset decorrelation** — each wave and background region uses a different time offset (`-192.4`, `273.3`, `623.1`, etc.) to the noise function. This means the same noise function produces different patterns for each layer, avoiding visual correlation.

4. **Configurable blur quality** — the `blurQuality` parameter (default 7) controls how many samples are taken across the blur transition. Higher = smoother edges, more GPU cost.

5. **Screen-space centering** — `get_x()` centers the noise field so the effect looks good regardless of canvas width, without the edges looking different from the center.

## Comparison with wave-maker Implementation

Our wave-maker library adapts Alex Harri's approach with these extensions:
- Configurable wave count (1-3 layers vs fixed 2)
- Valley geometry mode for Stitch-like content overlays
- Preset system with curated color palettes
- Runtime parameter updates (speed, amplitude, colors) without shader recompilation
- WebGL 1/2 compatibility layer
