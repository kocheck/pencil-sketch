import {
  sketchFillsToPen, penFillsToSketch,
  sketchBordersToPen, penStrokeToSketch,
  sketchShadowsToPen, penEffectsToSketch,
} from '../../src/utils/style'

describe('sketchFillsToPen', () => {
  it('converts a solid fill', () => {
    const fills = [{ fillType: 0, color: { red: 1, green: 0, blue: 0, alpha: 1 }, isEnabled: true }]
    const result = sketchFillsToPen(fills, { width: 100, height: 100 })
    expect(result).toEqual({ type: 'solid', color: '#ff0000' })
  })

  it('returns undefined for empty fills', () => {
    expect(sketchFillsToPen([], { width: 100, height: 100 })).toBeUndefined()
  })

  it('returns array when multiple fills', () => {
    const fills = [
      { fillType: 0, color: { red: 1, green: 0, blue: 0, alpha: 1 }, isEnabled: true },
      { fillType: 0, color: { red: 0, green: 1, blue: 0, alpha: 1 }, isEnabled: true },
    ]
    const result = sketchFillsToPen(fills, { width: 100, height: 100 })
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('sketchShadowsToPen', () => {
  it('converts a drop shadow', () => {
    const shadows = [{
      color: { red: 0, green: 0, blue: 0, alpha: 0.5 },
      x: 2, y: 4, blur: 8, spread: 0, isEnabled: true,
    }]
    const result = sketchShadowsToPen(shadows, [])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('shadow')
    expect((result[0] as any).x).toBe(2)
  })
})
