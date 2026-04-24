// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGradientCanvas } from '../src/renderer/gradient-texture'

describe('createGradientCanvas', () => {
  it('throws if fewer than 3 colors', () => {
    expect(() => createGradientCanvas(['#ff0000', '#00ff00'])).toThrow(
      'At least 3 colors'
    )
  })

  it('throws if more than 6 colors', () => {
    expect(() =>
      createGradientCanvas([
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#ff00ff',
        '#00ffff',
        '#ffff00',
        '#ffffff',
      ])
    ).toThrow('At most 6 colors')
  })

  it('creates a 256x1 canvas', () => {
    // jsdom does not implement canvas getContext('2d') natively,
    // so we stub it to verify the function sets dimensions correctly.
    const mockCtx = {
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      fillRect: vi.fn(),
      fillStyle: '',
    }
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'canvas') {
        vi.spyOn(el as HTMLCanvasElement, 'getContext').mockReturnValue(
          mockCtx as unknown as CanvasRenderingContext2D
        )
      }
      return el
    })

    const canvas = createGradientCanvas(['#ff0000', '#00ff00', '#0000ff'])
    expect(canvas.width).toBe(256)
    expect(canvas.height).toBe(1)
    expect(mockCtx.createLinearGradient).toHaveBeenCalledWith(0, 0, 256, 0)
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 256, 1)

    vi.restoreAllMocks()
  })
})
