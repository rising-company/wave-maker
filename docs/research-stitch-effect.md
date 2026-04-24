# Google Stitch Wave Effect — Reverse Engineering Notes

## Overview

The animated wave effect on [stitch.withgoogle.com](https://stitch.withgoogle.com/) is built with **[Unicorn Studio](https://www.unicorn.studio/)** — a WebGL compositing tool that generates multi-layer shader pipelines. The effect is loaded as a React component (`AuroraEffectCore-BkiyV4hL.js`) from the Stitch frontend hosted at `app-companion-430619.appspot.com`.

The alt text describes it as: _"Swirly grainy gradient of pink, blues, purples, and black"_

## Architecture

The effect is a **9-layer composited WebGL pipeline**, where each layer has its own fragment shader. Layers are rendered sequentially, with each layer reading the previous layer's output as a texture (`uTexture`).

### Layer 1: Black Background
A solid black background gradient layer. Simple fragment shader that outputs `vec3(0, 0, 0)`.

### Layer 2: Density Noise (the core effect)
This is the main layer that generates the swirly organic shapes. Key techniques:

- **Dot noise**: Uses dot products with gold rotation matrices (not simplex noise):
  ```glsl
  const mat3 GOLD = mat3(-0.571, +0.815, +0.097, -0.278, -0.303, +0.912, +0.772, +0.494, +0.400);
  const mat3 GOLD_PHI = mat3(-0.925, -0.450, 1.249, 1.319, -0.490, 0.800, 0.156, 1.475, 0.647);
  float dot_noise(vec3 p) { return dot(cos(GOLD * p), sin(GOLD_PHI * p)); }
  ```

- **Density function**: Stacks multiple octaves of rotated dot noise with amplitude falloff:
  ```glsl
  float density(vec3 q, float amplitude, float depth, vec2 skew) {
    q.xy = (q.xy - 0.5) * skew + 0.5;
    q.z = q.z * depth;
    float n = dot_noise(q * vec3(1.6, 0.8, 1.1)) - 0.2;
    d += amplitude * n;
    // Second octave with rotation
    q = (ROT1 * (q * vec3(0.8, 1.6, 0.9))) * 2.2 + vec3(1.025, 0.575, 0.425);
    amplitude *= 0.5 + 0.5 * (n * 0.5);
    n = dot_noise(q) - 0.2;
    d += amplitude * n;
    // Third octave...
  }
  ```

- **OKLab color mixing**: Colors are interpolated in OKLab perceptual color space (not linear RGB)
- **ACES tonemapping**: Applied for cinematic color response
- **Palette function**: `pal(t, a, b, c, d) = a + b*cos(TAU*(c*t+d))` for procedural coloring

Key uniforms: `uTime`, `uAmplitude`, `uBrightness`, `uMousePos`, `uResolution`

### Layer 3: Normal Map + Lighting
Computes a normal map from the previous layer's output and applies directional lighting:
- Sobel operator for normal calculation
- Light direction from `vec2(0.51, 0.89)` (bottom-right)
- Light color: `rgb(230, 0, 229)` (magenta)
- Screen blend mode for combining with the base

This creates the 3D-like glow and depth effect on the wave surfaces.

### Layers 4-5: Gaussian Blur (first pass)
Two-pass (horizontal + vertical) Gaussian blur with a 9-sample exponential kernel:
- Blur amount: `0.5320 * 1.5`
- Creates the initial softness of the wave edges

### Layer 6: Gradient Color Mapping
Maps the luminance of the composited image to a color gradient using OKLab interpolation:

**Gradient stops** (the actual Stitch colors):
| Stop | Position | Color | RGB |
|------|----------|-------|-----|
| 0 | 0.0625 | Black | `(0, 0, 0)` |
| 1 | 0.3312 | Purple/Indigo | `(96, 86, 240)` → `#6056F0` |
| 2 | 0.4625 | Purple | `(145, 84, 231)` → `#9154E7` |
| 3 | 0.6906 | Blue | `(66, 133, 244)` → `#4285F4` |
| 4 | 0.8656 | Cyan/Teal | `(64, 217, 198)` → `#40D9C6` |

Note: Black extends from 0 to 0.33 — a large portion of the gradient is dark. This is why most of the screen stays black.

The gradient position is **animated over time**: `position -= (uTime*0.01 + posOffset)`, creating a slow color cycling effect.

Features debanding via PCG2D hash to eliminate banding artifacts in smooth gradients.

### Layers 7-8: Gaussian Blur (second pass)
A much heavier blur pass with a **36-sample Gaussian kernel**:
- Directional blur with position-dependent falloff
- The blur is stronger below a center point and fades above it
- This creates the effect of waves being sharp at the crest but soft/diffuse below
- Uses `easeInOutQuad` for the distance-based blur falloff

### Layer 9: Final Color Adjustment
HSL-based color correction:
- Saturation reduced to 0.9 (slightly desaturated for a more sophisticated look)
- No other adjustments (hue rotation = 1.0, lightness offset = 0.0)

## Animation Parameters

From the Unicorn Studio scene data:
- **Speed**: 0.25 (layer speed)
- **Amplitude**: Animated from 0 → 0.64 on page load (2s duration, exponential ease-out, 500ms delay)
- **Brightness**: Animated from 0 → 0.44 on page load
- **Mouse tracking**: Disabled (trackMouse: 0)
- **Shape squish**: -0.33 (elliptical distortion)

## Key Differences from Alex Harri's Approach

| Aspect | Alex Harri | Google Stitch |
|--------|-----------|---------------|
| Noise type | Simplex noise (2D/3D) | Dot product with gold rotation matrices |
| Rendering | Single-pass fragment shader | 9-layer composited pipeline |
| Color mapping | 1x256 gradient texture lookup | OKLab perceptual interpolation with 5 stops |
| Blur | Noise-modulated alpha transition | Multi-pass Gaussian blur (9 + 36 samples) |
| Lighting | None | Normal map + directional light |
| Background | Full-canvas colored gradient | Pure black, color only in wave regions |
| Wave shape | Stacked sine + simplex boundary | Density noise with rotational octaves |
| Color cycling | None | Animated gradient position over time |
| Tonemapping | None | ACES filmic tonemapping |
| Debanding | None | PCG2D hash dithering |

## Source Files

The Stitch frontend is served from `https://app-companion-430619.appspot.com/` with Vite-hashed asset chunks:

- `assets/AuroraEffectCore-BkiyV4hL.js` — Aurora effect component + all 9 shader layers
- `assets/unicornStudio.umd-UkcFwVPG.js` — Unicorn Studio runtime (114KB)
- `assets/StitchBlurEffectCore-C57jBe2j.js` — Separate blur effect variant

The Google SPA framework (`boq-pitchfork`) loads the appspot React app inside an `<appcompanion-root>` custom element.
