export type PresetName = 'ocean' | 'sunset' | 'aurora' | 'stitch' | 'midnight' | 'ember'

export interface WaveMakerOptions {
  /** Named color theme. Default: 'ocean' */
  preset?: PresetName
  /** Override preset colors (3-6 hex values) */
  colors?: string[]
  /** Animation speed multiplier. 0 = frozen. Default: 1.0 */
  speed?: number
  /** Wave height multiplier. Default: 1.0 */
  amplitude?: number
  /** Number of wave layers. Default: 2 */
  waveCount?: 1 | 2 | 3
  /** Stitch-style center valley for overlaying UI content. Default: false */
  valley?: boolean
  /** Valley dip depth (0-1). Only applies when valley is true. Default: 0.32 */
  valleyDepth?: number
  /** Edge blur intensity. Default: 1.0 */
  blur?: number
  /** Noise octaves (1-6). More = richer detail, higher GPU cost. Default: 4 */
  noiseDetail?: number
  /** Target frame rate cap. Default: 60 */
  fps?: number
  /** Device pixel ratio. Default: window.devicePixelRatio */
  pixelRatio?: number
  /** Auto-start animation on creation. Default: true */
  animate?: boolean
}

export interface Preset {
  name: string
  /** 3-6 hex color strings */
  colors: string[]
  /** Default option overrides for this preset */
  defaults?: Partial<Omit<WaveMakerOptions, 'preset' | 'colors'>>
}

export const DEFAULT_OPTIONS: Required<Omit<WaveMakerOptions, 'preset' | 'colors'>> = {
  speed: 1.0,
  amplitude: 1.0,
  waveCount: 2,
  valley: false,
  valleyDepth: 0.32,
  blur: 1.0,
  noiseDetail: 4,
  fps: 60,
  pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  animate: true,
}
