/**
 * Builds the fullscreen quad vertex shader.
 * Handles WebGL 1 vs 2 differences (attribute vs in).
 */
export function buildVertexShader(isWebGL2: boolean): string {
  if (isWebGL2) {
    return /* glsl */ `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`
  }
  return /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`
}
