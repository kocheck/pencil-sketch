import { sketchGradientToPen, penGradientToSketch } from '../../src/utils/gradient'
import type { PenLinearGradientFill, PenRadialGradientFill } from '../../src/types/pen'

const frame = { width: 100, height: 100 }

describe('sketchGradientToPen', () => {
  it('converts a horizontal linear gradient', () => {
    const sketchGrad = {
      gradientType: 0,
      stops: [
        { color: { red: 1, green: 0, blue: 0, alpha: 1 }, position: 0 },
        { color: { red: 0, green: 0, blue: 1, alpha: 1 }, position: 1 },
      ],
      from: { x: 0, y: 0.5 },
      to: { x: 1, y: 0.5 },
    }
    const result = sketchGradientToPen(sketchGrad, frame) as PenLinearGradientFill
    expect(result.type).toBe('linear')
    expect(result.stops).toHaveLength(2)
    expect(result.stops[0].color).toBe('#ff0000')
    expect(result.stops[0].position).toBe(0)
    expect(result.angle).toBeCloseTo(0, 1)
  })

  it('converts a radial gradient', () => {
    const sketchGrad = {
      gradientType: 1,
      stops: [
        { color: { red: 1, green: 1, blue: 1, alpha: 1 }, position: 0 },
        { color: { red: 0, green: 0, blue: 0, alpha: 1 }, position: 1 },
      ],
      from: { x: 0.5, y: 0.5 },
      to: { x: 1, y: 0.5 },
    }
    const result = sketchGradientToPen(sketchGrad, frame) as PenRadialGradientFill
    expect(result.type).toBe('radial')
    expect(result.stops).toHaveLength(2)
  })
})

describe('penGradientToSketch', () => {
  it('converts a linear gradient to Sketch format', () => {
    const penGrad: PenLinearGradientFill = {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 1 },
      ],
    }
    const result = penGradientToSketch(penGrad, frame)
    expect(result.gradientType).toBe(0)
    expect(result.stops).toHaveLength(2)
    expect(result.from).toBeDefined()
    expect(result.to).toBeDefined()
  })

  it('converts a radial gradient to Sketch format', () => {
    const penGrad: PenRadialGradientFill = {
      type: 'radial',
      stops: [
        { color: '#ffffff', position: 0 },
        { color: '#000000', position: 1 },
      ],
      cx: 50,
      cy: 50,
    }
    const result = penGradientToSketch(penGrad, frame)
    expect(result.gradientType).toBe(1)
    expect(result.stops).toHaveLength(2)
  })
})
