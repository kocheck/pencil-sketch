import { hexToSketchColor, sketchColorToHex } from '../../src/utils/color'

describe('hexToSketchColor', () => {
  it('converts 6-digit hex to Sketch RGBA', () => {
    expect(hexToSketchColor('#FF0000')).toEqual({ red: 1, green: 0, blue: 0, alpha: 1 })
  })

  it('converts 8-digit hex (with alpha) to Sketch RGBA', () => {
    expect(hexToSketchColor('#FF000080')).toEqual({
      red: 1, green: 0, blue: 0, alpha: expect.closeTo(0.502, 2),
    })
  })

  it('handles lowercase hex', () => {
    expect(hexToSketchColor('#00ff00')).toEqual({ red: 0, green: 1, blue: 0, alpha: 1 })
  })
})

describe('sketchColorToHex', () => {
  it('converts opaque Sketch color to 6-digit hex', () => {
    expect(sketchColorToHex({ red: 1, green: 0, blue: 0, alpha: 1 })).toBe('#ff0000')
  })

  it('converts semi-transparent Sketch color to 8-digit hex', () => {
    expect(sketchColorToHex({ red: 1, green: 0, blue: 0, alpha: 0.5 })).toBe('#ff000080')
  })
})
