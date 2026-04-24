/**
 * Creates a 256x1 canvas with a linear gradient drawn from the given colors.
 * Colors are distributed evenly across the canvas width.
 *
 * @param colors Array of 3-6 CSS color strings (e.g. hex values)
 * @returns An HTMLCanvasElement with the gradient drawn on it
 */
export function createGradientCanvas(colors: string[]): HTMLCanvasElement {
  if (colors.length < 3) {
    throw new Error(
      `At least 3 colors are required for a gradient, got ${colors.length}`
    )
  }
  if (colors.length > 6) {
    throw new Error(
      `At most 6 colors are allowed for a gradient, got ${colors.length}`
    )
  }

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for gradient texture')
  }

  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  for (let i = 0; i < colors.length; i++) {
    gradient.addColorStop(i / (colors.length - 1), colors[i])
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 1)

  return canvas
}

/**
 * Creates (or updates) a gradient texture from the given colors and uploads
 * it to the GPU via texImage2D.
 *
 * @param gl WebGL rendering context
 * @param texture The WebGL texture object to upload into
 * @param colors Array of 3-6 CSS color strings
 */
export function uploadGradientTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  colors: string[]
): void {
  const canvas = createGradientCanvas(colors)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
}
