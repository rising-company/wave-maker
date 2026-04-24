import type { Preset } from '../types'
export const stitch: Preset = {
  name: 'stitch',
  // Dark-to-luminous: near-black bg → deep purple → blue → cyan → white glow
  colors: ['#020008', '#0d0030', '#2a0080', '#5533cc', '#7755ff', '#aa99ff'],
  defaults: {
    valley: true,
    amplitude: 1.3,
    waveCount: 2,
    blur: 1.2,
    noiseDetail: 3,
  },
}
