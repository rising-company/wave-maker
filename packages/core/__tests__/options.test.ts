import { describe, it, expect } from 'vitest'
import { resolveOptions } from '../src/wave-maker'

describe('resolveOptions', () => {
  it('uses ocean preset by default', () => {
    const opts = resolveOptions({})
    expect(opts.preset).toBe('ocean')
    expect(opts.colors.length).toBeGreaterThanOrEqual(3)
  })

  it('applies preset defaults', () => {
    const opts = resolveOptions({ preset: 'stitch' })
    expect(opts.valley).toBe(true)
    expect(opts.amplitude).toBe(1.4)
  })

  it('user options override preset defaults', () => {
    const opts = resolveOptions({ preset: 'stitch', valley: false, amplitude: 0.5 })
    expect(opts.valley).toBe(false)
    expect(opts.amplitude).toBe(0.5)
  })

  it('custom colors override preset colors', () => {
    const custom = ['#111111', '#222222', '#333333']
    const opts = resolveOptions({ colors: custom })
    expect(opts.colors).toEqual(custom)
  })

  it('applies global defaults for unset options', () => {
    const opts = resolveOptions({})
    expect(opts.speed).toBe(1.0)
    expect(opts.waveCount).toBe(2)
    expect(opts.blur).toBe(1.0)
    expect(opts.noiseDetail).toBe(4)
    expect(opts.fps).toBe(60)
    expect(opts.animate).toBe(true)
  })
})
