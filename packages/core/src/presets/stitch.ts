import type { Preset } from '../types'
export const stitch: Preset = {
  name: 'stitch',
  // Colors from Stitch's Unicorn Studio shader, with extended black range.
  // Stitch's gradient is black until ~33% of the range, then transitions
  // through purple → blue → cyan. We approximate this with 6 stops where
  // the first two are black/near-black to keep most of the gradient dark.
  colors: ['#000000', '#030010', '#6056F0', '#9154E7', '#4285F4', '#40D9C6'],
  defaults: {
    valley: true,
    valleyDepth: 0.38,
    amplitude: 0.2,
    waveCount: 2,
    blur: 2,
    speed: 1,
    noiseDetail: 2,
  },
}
