import type { Preset } from '../types'
export const stitch: Preset = {
  name: 'stitch',
  // Near-black → deep indigo → purple → bright blue-purple → lavender glow
  colors: ['#010005', '#080030', '#1a0066', '#4411bb', '#5544ff', '#9988ff'],
  defaults: {
    valley: true,
    valleyDepth: 0.40,
    amplitude: 1.4,
    waveCount: 2,
    blur: 2.5,      // very wide/soft edges like aurora bands
    speed: 0.5,     // slow, smooth animation
    noiseDetail: 3,
  },
}
