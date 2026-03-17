import { sketchGradientToPen, penGradientToSketch } from '../../src/utils/gradient'
import type { PenLinearGradientFill } from '../../src/types/pen'

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
})
