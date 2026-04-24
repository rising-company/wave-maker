import type { WaveMakerOptions, PresetName, Preset } from './types'
import { DEFAULT_OPTIONS } from './types'
import { getPreset } from './presets'
import { createWebGLContext } from './renderer/webgl-context'
import { createProgram } from './renderer/shader-compiler'
import { uploadGradientTexture } from './renderer/gradient-texture'
import { AnimationLoop } from './renderer/animation-loop'
import { vertexShaderSource } from './shaders/vertex'
import { buildFragmentShader } from './shaders/fragment'

/** Fully resolved options with no optional fields */
export interface ResolvedOptions {
  preset: PresetName
  colors: string[]
  speed: number
  amplitude: number
  waveCount: 1 | 2 | 3
  valley: boolean
  valleyDepth: number
  blur: number
  noiseDetail: number
  fps: number
  pixelRatio: number
  animate: boolean
}

/**
 * Resolves user-provided options against preset defaults and global defaults.
 * Pure function — no WebGL or DOM access needed.
 */
export function resolveOptions(opts: WaveMakerOptions): ResolvedOptions {
  const presetName: PresetName = opts.preset ?? 'ocean'
  const preset: Preset = getPreset(presetName)
  const presetDefaults = preset.defaults ?? {}

  return {
    preset: presetName,
    colors: opts.colors ?? preset.colors,
    speed: opts.speed ?? presetDefaults.speed ?? DEFAULT_OPTIONS.speed,
    amplitude:
      opts.amplitude ?? presetDefaults.amplitude ?? DEFAULT_OPTIONS.amplitude,
    waveCount:
      opts.waveCount ?? presetDefaults.waveCount ?? DEFAULT_OPTIONS.waveCount,
    valley: opts.valley ?? presetDefaults.valley ?? DEFAULT_OPTIONS.valley,
    valleyDepth:
      opts.valleyDepth ??
      presetDefaults.valleyDepth ??
      DEFAULT_OPTIONS.valleyDepth,
    blur: opts.blur ?? presetDefaults.blur ?? DEFAULT_OPTIONS.blur,
    noiseDetail:
      opts.noiseDetail ??
      presetDefaults.noiseDetail ??
      DEFAULT_OPTIONS.noiseDetail,
    fps: opts.fps ?? presetDefaults.fps ?? DEFAULT_OPTIONS.fps,
    pixelRatio:
      opts.pixelRatio ??
      presetDefaults.pixelRatio ??
      DEFAULT_OPTIONS.pixelRatio,
    animate: opts.animate ?? presetDefaults.animate ?? DEFAULT_OPTIONS.animate,
  }
}

/**
 * WaveMaker — animated WebGL wave gradient renderer.
 *
 * Attaches to a canvas element and renders layered wave gradients
 * using simplex noise and a color gradient texture.
 */
export class WaveMaker {
  private _canvas: HTMLCanvasElement
  private _gl: WebGLRenderingContext | WebGL2RenderingContext
  private _isWebGL2: boolean
  private _program: WebGLProgram
  private _texture: WebGLTexture
  private _loop: AnimationLoop
  private _resizeObserver: ResizeObserver | null = null
  private _options: ResolvedOptions

  // Cached uniform locations
  private _uniforms: Record<string, WebGLUniformLocation | null> = {}

  // Quad buffer
  private _positionBuffer: WebGLBuffer | null = null

  constructor(canvas: HTMLCanvasElement, options: WaveMakerOptions = {}) {
    this._canvas = canvas
    this._options = resolveOptions(options)

    // Create WebGL context
    const { gl, isWebGL2 } = createWebGLContext(canvas)
    this._gl = gl
    this._isWebGL2 = isWebGL2

    // Compile shaders and create program
    const fragmentSource = buildFragmentShader(isWebGL2)
    this._program = createProgram(gl, vertexShaderSource, fragmentSource)
    gl.useProgram(this._program)

    // Set up fullscreen quad geometry
    this._setupQuad()

    // Create and upload gradient texture
    const texture = gl.createTexture()
    if (!texture) {
      throw new Error('Failed to create WebGL texture')
    }
    this._texture = texture
    uploadGradientTexture(gl, this._texture, this._options.colors)

    // Cache uniform locations
    this._cacheUniforms()

    // Set up ResizeObserver
    this._resizeObserver = new ResizeObserver(() => {
      this.handleResize()
    })
    this._resizeObserver.observe(canvas)
    this.handleResize()

    // Create animation loop
    this._loop = new AnimationLoop(
      (time: number) => this.render(time),
      this._options.fps
    )

    // Auto-start if configured
    if (this._options.animate) {
      this.play()
    } else {
      // Render a single frame at t=0
      this.render(0)
    }
  }

  /** Whether the animation is currently playing */
  get isPlaying(): boolean {
    return this._loop.isPlaying
  }

  /** The currently active preset name */
  get currentPreset(): PresetName {
    return this._options.preset
  }

  /** Start or resume animation */
  play(): void {
    this._loop.play()
  }

  /** Pause animation */
  pause(): void {
    this._loop.pause()
  }

  /** Clean up all WebGL resources, observers, and animation */
  destroy(): void {
    this._loop.stop()

    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }

    const gl = this._gl

    if (this._positionBuffer) {
      gl.deleteBuffer(this._positionBuffer)
      this._positionBuffer = null
    }

    gl.deleteTexture(this._texture)
    gl.deleteProgram(this._program)
  }

  /** Manually trigger a resize (also called automatically by ResizeObserver) */
  resize(): void {
    this.handleResize()
  }

  /** Switch to a named preset, re-uploading the gradient texture */
  setPreset(name: PresetName): void {
    this._options = resolveOptions({ ...this._options, preset: name, colors: undefined })
    uploadGradientTexture(this._gl, this._texture, this._options.colors)
  }

  /** Update the gradient colors */
  setColors(colors: string[]): void {
    this._options.colors = colors
    uploadGradientTexture(this._gl, this._texture, colors)
  }

  /** Update the animation speed multiplier */
  setSpeed(n: number): void {
    this._options.speed = n
  }

  /** Update the wave amplitude multiplier */
  setAmplitude(n: number): void {
    this._options.amplitude = n
  }

  /** Set up the fullscreen quad (2 triangles covering clip space) */
  private _setupQuad(): void {
    const gl = this._gl
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ])

    this._positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const posAttr = gl.getAttribLocation(this._program, 'a_position')
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)
  }

  /** Cache all uniform locations for the shader program */
  private _cacheUniforms(): void {
    const gl = this._gl
    const program = this._program
    const names = [
      'u_time',
      'u_resolution',
      'u_gradient',
      'u_speed',
      'u_amplitude',
      'u_valley',
      'u_valley_depth',
      'u_blur',
      'u_wave_count',
      'u_noise_detail',
    ]
    for (const name of names) {
      this._uniforms[name] = gl.getUniformLocation(program, name)
    }
  }

  /** Update canvas dimensions to match CSS layout size * pixel ratio */
  private handleResize(): void {
    const dpr = this._options.pixelRatio
    const displayWidth = Math.round(this._canvas.clientWidth * dpr)
    const displayHeight = Math.round(this._canvas.clientHeight * dpr)

    if (
      this._canvas.width !== displayWidth ||
      this._canvas.height !== displayHeight
    ) {
      this._canvas.width = displayWidth
      this._canvas.height = displayHeight
      this._gl.viewport(0, 0, displayWidth, displayHeight)
    }
  }

  /** Push current option values to shader uniforms */
  private updateUniforms(time: number): void {
    const gl = this._gl
    const u = this._uniforms
    const o = this._options

    gl.uniform1f(u.u_time, time)
    gl.uniform2f(u.u_resolution, this._canvas.width, this._canvas.height)
    gl.uniform1i(u.u_gradient, 0) // texture unit 0
    gl.uniform1f(u.u_speed, o.speed)
    gl.uniform1f(u.u_amplitude, o.amplitude)
    gl.uniform1f(u.u_valley, o.valley ? 1.0 : 0.0)
    gl.uniform1f(u.u_valley_depth, o.valleyDepth)
    gl.uniform1f(u.u_blur, o.blur)
    gl.uniform1f(u.u_wave_count, o.waveCount)
    gl.uniform1f(u.u_noise_detail, o.noiseDetail)
  }

  /** Render a single frame at the given time (in seconds) */
  private render(time: number): void {
    const gl = this._gl

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this._texture)

    this.updateUniforms(time)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
