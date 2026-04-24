import { describe, it, expect } from 'vitest'
import { getPreset, presetNames } from '../src/presets'

describe('presets', () => {
  it('exports all 6 preset names', () => {
    expect(presetNames).toEqual(['ocean', 'sunset', 'aurora', 'stitch', 'midnight', 'ember'])
  })

  it('getPreset returns a preset by name', () => {
    const ocean = getPreset('ocean')
    expect(ocean.name).toBe('ocean')
    expect(ocean.colors.length).toBeGreaterThanOrEqual(3)
    expect(ocean.colors.length).toBeLessThanOrEqual(6)
  })

  it('every preset has 3-6 hex color strings', () => {
    for (const name of presetNames) {
      const preset = getPreset(name)
      expect(preset.colors.length).toBeGreaterThanOrEqual(3)
      expect(preset.colors.length).toBeLessThanOrEqual(6)
      for (const color of preset.colors) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })

  it('stitch preset defaults valley to true', () => {
    const stitch = getPreset('stitch')
    expect(stitch.defaults?.valley).toBe(true)
  })

  it('getPreset throws for unknown preset', () => {
    expect(() => getPreset('nonexistent' as any)).toThrow()
  })
})
