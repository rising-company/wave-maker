import { noiseGLSL } from './noise'

/**
 * Builds the wave gradient fragment shader.
 *
 * Faithfully adapted from Alex Harri's "A flowing WebGL gradient, deconstructed"
 * https://alexharri.com/blog/webgl-gradients
 * https://github.com/alexharri/website
 *
 * Extended with configurable uniforms for wave count, valley geometry,
 * amplitude, speed, blur, and noise detail.
 */
export function buildFragmentShader(isWebGL2: boolean): string {
  const versionHeader = isWebGL2
    ? '#version 300 es\nprecision highp float;\n'
    : 'precision highp float;\n'

  const textureSample = isWebGL2 ? 'texture' : 'texture2D'
  const fragColorDecl = isWebGL2 ? 'out vec4 fragColor;\n' : ''
  const fragColorName = isWebGL2 ? 'fragColor' : 'gl_FragColor'

  return `${versionHeader}
${fragColorDecl}
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_gradient;

uniform float u_speed;
uniform float u_amplitude;
uniform float u_valley;
uniform float u_valley_depth;
uniform float u_blur;
uniform float u_wave_count;
uniform float u_noise_detail;

const float PI = 3.14159;

${noiseGLSL}

// Center x coordinate (from Alex Harri's get_x)
float get_x() {
  return 900.0 + gl_FragCoord.x - u_resolution.x / 2.0;
}

// Utility functions
float smooth5(float t) {
  return t * t * t * (t * (6.0 * t - 15.0) + 10.0);
}

float lerp(float a, float b, float t) {
  return a * (1.0 - t) + b * t;
}

float ease_in(float x) {
  return 1.0 - cos((x * PI) * 0.5);
}

// Wave blur part — multi-sample blur for smooth edges
float wave_alpha_part(float dist, float blur_fac, float t) {
  float exp = mix(0.90000, 1.20000, t);
  float v = pow(blur_fac, exp);
  v = ease_in(v);
  v = smooth5(v);
  v = clamp(v, 0.008, 1.0);
  v *= 345.0 * u_blur;
  float alpha = clamp(0.5 + dist / v, 0.0, 1.0);
  alpha = smooth5(alpha);
  return alpha;
}

// Background noise — stacked 3D simplex for color variation
float background_noise(float offset) {
  const float S = 0.064;
  const float L = 0.00085;
  const float L1 = 1.5, L2 = 0.9, L3 = 0.6;
  const float LY1 = 1.00, LY2 = 0.85, LY3 = 0.70;
  const float F = 0.04;
  const float Y_SCALE = 1.0 / 0.27;

  float x = get_x() * L;
  float y = gl_FragCoord.y * L * Y_SCALE;
  float time = u_time * u_speed + offset;
  float x_shift = time * F;
  float sum = 0.5;
  sum += simplex_noise(vec3(x * L1 +  x_shift * 1.1, y * L1 * LY1, time * S)) * 0.30;
  if (u_noise_detail >= 2.0)
    sum += simplex_noise(vec3(x * L2 + -x_shift * 0.6, y * L2 * LY2, time * S)) * 0.25;
  if (u_noise_detail >= 3.0)
    sum += simplex_noise(vec3(x * L3 +  x_shift * 0.8, y * L3 * LY3, time * S)) * 0.20;
  return sum;
}

// Wave boundary noise — stacked 2D simplex at different frequencies
float wave_y_noise(float offset) {
  float time = u_time * u_speed + offset;
  float x = get_x() * 0.000845;
  float y = time * 0.075;
  float x_shift = time * 0.026;

  float sum = 0.0;
  sum += simplex_noise(vec2(x * 1.30 + x_shift, y * 0.54)) * 0.85;
  sum += simplex_noise(vec2(x * 1.00 + x_shift, y * 0.68)) * 1.15;
  sum += simplex_noise(vec2(x * 0.70 + x_shift, y * 0.59)) * 0.60;
  sum += simplex_noise(vec2(x * 0.40 + x_shift, y * 0.48)) * 0.40;
  return sum;
}

// Blur bias — oscillates over time for breathing effect
float calc_blur_bias() {
  const float S = 0.261;
  float bias_t = (sin(u_time * u_speed * S) + 1.0) * 0.5;
  return lerp(-0.17, -0.04, bias_t);
}

// Blur factor — noise-modulated for irregular edge softness
float calc_blur(float offset) {
  float time = u_time * u_speed + offset;
  float x = get_x() * 0.0011;

  float blur_fac = calc_blur_bias();
  blur_fac += simplex_noise(vec2(x * 0.60 + time * 0.03, time * 0.07 * 0.7)) * 0.5;
  blur_fac += simplex_noise(vec2(x * 1.30 + time * 0.03 * -0.8, time * 0.07)) * 0.4;
  blur_fac = (blur_fac + 1.0) * 0.5;
  blur_fac = clamp(blur_fac, 0.0, 1.0);
  return blur_fac;
}

// Wave alpha — distance from wave curve with multi-sample blur
float wave_alpha(float Y, float wave_height, float offset) {
  // Valley geometry: parabolic dip pushing wave away from center
  float valley_shift = 0.0;
  if (u_valley > 0.5) {
    float nx = gl_FragCoord.x / u_resolution.x;
    valley_shift = u_valley_depth * u_resolution.y * 4.0 * (nx - 0.5) * (nx - 0.5);
  }

  float wave_y = Y + valley_shift + wave_y_noise(offset) * wave_height * u_amplitude;
  float dist = wave_y - gl_FragCoord.y;
  float blur_fac = calc_blur(offset);

  // Multi-sample blur (7 samples for quality)
  const float PART = 1.0 / 7.0;
  float sum = 0.0;
  for (int i = 0; i < 7; i++) {
    float t = PART * float(i);
    sum += wave_alpha_part(dist, blur_fac, t) * PART;
  }
  return sum;
}

vec3 calc_color(float lightness) {
  lightness = clamp(lightness, 0.0, 1.0);
  return vec3(${textureSample}(u_gradient, vec2(lightness, 0.5)));
}

void main() {
  float h = u_resolution.y;

  // Wave base positions and heights (from Alex Harri's original)
  float WAVE1_Y = 0.45 * h;
  float WAVE2_Y = 0.90 * h;
  float WAVE3_Y = 0.25 * h;
  float WAVE1_HEIGHT = 0.195 * h;
  float WAVE2_HEIGHT = 0.144 * h;
  float WAVE3_HEIGHT = 0.12 * h;

  // Background and per-wave lightness (different time offsets decorrelate)
  float bg_lightness = background_noise(-192.4);
  float w1_lightness = background_noise( 273.3);
  float w2_lightness = background_noise( 623.1);
  float w3_lightness = background_noise( 911.7);

  // Wave alphas
  float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, 112.5 * 48.75);
  float w2_alpha = u_wave_count >= 2.0 ? wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 225.0 * 36.00) : 0.0;
  float w3_alpha = u_wave_count >= 3.0 ? wave_alpha(WAVE3_Y, WAVE3_HEIGHT, 337.5 * 24.00) : 0.0;

  // Composite lightness
  float lightness = bg_lightness;
  lightness = lerp(lightness, w2_lightness, w2_alpha);
  lightness = lerp(lightness, w1_lightness, w1_alpha);
  lightness = lerp(lightness, w3_lightness, w3_alpha);

  ${fragColorName} = vec4(calc_color(lightness), 1.0);
}
`
}
