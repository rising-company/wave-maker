/**
 * Creates a WebGL rendering context from a canvas element.
 * Tries WebGL 2 first, falls back to WebGL 1.
 */
export function createWebGLContext(canvas: HTMLCanvasElement): {
  gl: WebGLRenderingContext | WebGL2RenderingContext
  isWebGL2: boolean
} {
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  let isWebGL2 = false

  // Try WebGL 2 first
  gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null
  if (gl) {
    isWebGL2 = true
    return { gl, isWebGL2 }
  }

  // Fall back to WebGL 1
  gl = (canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null

  if (!gl) {
    throw new Error(
      'WebGL is not supported in this browser. WaveMaker requires WebGL to render.'
    )
  }

  return { gl, isWebGL2 }
}
