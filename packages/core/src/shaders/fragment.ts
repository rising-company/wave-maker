import { noiseGLSL } from './noise'

/**
 * Builds the wave gradient fragment shader.
 * Handles WebGL 1 vs 2 differences (version header, texture sampling, output).
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

${noiseGLSL}

float smooth5(float t) {
  return t * t * t * (t * (6.0 * t - 15.0) + 10.0);
}

float lerp(float a, float b, float t) {
  return a + (b - a) * t;
}

float wave_y_noise(float offset) {
  float t = u_time * u_speed;
  float n = 0.0;
  // 4 stacked simplex noise layers at different frequencies
  n += snoise2(vec2(offset * 0.8 + t * 0.3, t * 0.2)) * 0.5;
  n += snoise2(vec2(offset * 1.6 + t * 0.5, t * 0.3 + 10.0)) * 0.25;
  n += snoise2(vec2(offset * 3.2 + t * 0.7, t * 0.4 + 20.0)) * 0.125;
  n += snoise2(vec2(offset * 6.4 + t * 0.9, t * 0.5 + 30.0)) * 0.0625;
  // 2 sine waves for broad motion
  n += sin(offset * 1.5 + t * 0.6) * 0.3;
  n += sin(offset * 2.5 + t * 0.4 + 1.0) * 0.15;
  return n * u_amplitude;
}

float calc_blur(float offset) {
  float t = u_time * u_speed;
  float base = u_blur * 0.06;
  float noise_mod = snoise2(vec2(offset * 2.0 + t * 0.2, t * 0.15 + 50.0));
  return base * (1.0 + noise_mod * 0.3);
}

float wave_alpha(float wave_y_base, float wave_height, float offset) {
  float wy = wave_y_base + wave_height;
  float frag_y = gl_FragCoord.y;
  float blur_r = calc_blur(offset);
  float dist = frag_y - wy;

  // Valley geometry: push wave down at horizontal center
  if (u_valley > 0.5) {
    float center_x = u_resolution.x * 0.5;
    float dx = (gl_FragCoord.x - center_x) / (u_resolution.x * 0.5);
    float valley_factor = 1.0 - smooth5(clamp(abs(dx), 0.0, 1.0));
    dist += valley_factor * u_valley_depth * u_resolution.y * 0.3;
  }

  float edge = blur_r * u_resolution.y;
  if (edge < 1.0) edge = 1.0;
  return smooth5(clamp(dist / edge + 0.5, 0.0, 1.0));
}

float background_noise(float offset) {
  if (u_noise_detail < 1.0) return 0.0;
  float t = u_time * u_speed;
  float n = 0.0;
  float scale = 1.0;
  float amp = 0.04;
  for (float i = 0.0; i < 6.0; i += 1.0) {
    if (i >= u_noise_detail) break;
    n += snoise3(vec3(
      gl_FragCoord.x / u_resolution.x * scale * 3.0 + offset,
      gl_FragCoord.y / u_resolution.y * scale * 3.0,
      t * 0.15 + i * 7.0
    )) * amp;
    scale *= 2.0;
    amp *= 0.5;
  }
  return n;
}

void main() {
  float h = u_resolution.y;
  float offset_x = gl_FragCoord.x / u_resolution.x;

  // 3 wave base positions
  float w1_y = 0.45 * h;
  float w2_y = 0.75 * h;
  float w3_y = 0.25 * h;

  // Wave heights via noise
  float w1_h = wave_y_noise(offset_x) * h * 0.1;
  float w2_h = wave_y_noise(offset_x + 5.0) * h * 0.08;
  float w3_h = wave_y_noise(offset_x + 10.0) * h * 0.07;

  // Background lightness variation
  float bg_noise = background_noise(0.0);

  // Per-wave lightness noise
  float w1_noise = background_noise(100.0);
  float w2_noise = background_noise(200.0);
  float w3_noise = background_noise(300.0);

  // Wave alphas
  float a1 = wave_alpha(w1_y, w1_h, offset_x);
  float a2 = (u_wave_count >= 2.0) ? wave_alpha(w2_y, w2_h, offset_x + 5.0) : 0.0;
  float a3 = (u_wave_count >= 3.0) ? wave_alpha(w3_y, w3_h, offset_x + 10.0) : 0.0;

  // Composite lightness: base 0.5, shifted by waves and noise
  float lightness = 0.5 + bg_noise;
  lightness = lerp(lightness, lightness + 0.15 + w1_noise, a1);
  lightness = lerp(lightness, lightness + 0.1 + w2_noise, a2);
  lightness = lerp(lightness, lightness - 0.1 + w3_noise, a3);
  lightness = clamp(lightness, 0.0, 1.0);

  // Sample gradient texture
  vec4 color = ${textureSample}(u_gradient, vec2(lightness, 0.5));
  ${fragColorName} = color;
}
`
}
