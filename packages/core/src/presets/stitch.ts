import type { Preset } from '../types'
export const stitch: Preset = {
  name: 'stitch',
  // Exact colors from Google Stitch's Unicorn Studio shader (Layer 6 gradient stops):
  // black → purple/indigo → purple → blue → cyan/teal
  colors: ['#000000', '#6056F0', '#9154E7', '#4285F4', '#40D9C6'],
  defaults: {
    valley: true,
    valleyDepth: 0.40,
    amplitude: 1.4,
    waveCount: 2,
    blur: 2.5,      // very wide/soft edges (Stitch uses multi-pass Gaussian blur)
    speed: 0.5,     // slow, smooth animation
    noiseDetail: 3,
  },
}
