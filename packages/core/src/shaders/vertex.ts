/**
 * Minimal fullscreen quad vertex shader.
 * Passes through clip-space positions directly.
 */
export const vertexShaderSource = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`
