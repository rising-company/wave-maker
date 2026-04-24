import type { Preset, PresetName } from '../types'
import { ocean } from './ocean'
import { sunset } from './sunset'
import { aurora } from './aurora'
import { stitch } from './stitch'
import { midnight } from './midnight'
import { ember } from './ember'

const presets: Record<PresetName, Preset> = {
  ocean,
  sunset,
  aurora,
  stitch,
  midnight,
  ember,
}

export const presetNames: PresetName[] = ['ocean', 'sunset', 'aurora', 'stitch', 'midnight', 'ember']

export function getPreset(name: PresetName): Preset {
  const preset = presets[name]
  if (!preset) {
    throw new Error(`Unknown preset: "${name}". Available: ${presetNames.join(', ')}`)
  }
  return preset
}
