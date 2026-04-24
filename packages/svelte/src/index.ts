export { default as WaveMaker } from './WaveMaker.svelte'

// Re-export types from core
export type {
  WaveMakerOptions,
  PresetName,
  Preset,
} from '@rising-company/wave-maker'

export { getPreset, presetNames } from '@rising-company/wave-maker'
