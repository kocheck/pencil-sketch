import { convertSketchRectangle } from '../../src/converters/sketch-to-pen/rectangle'

describe('convertSketchRectangle', () => {
  const layer = {
    name: 'Button BG',
    type: 'ShapePath',
    frame: { x: 10, y: 20, width: 100, height: 40 },
    style: {
      fills: [{ fillType: 0, color: { red: 0, green: 0.47, blue: 1, alpha: 1 }, isEnabled: true }],
      borders: [],
      shadows: [],
      blurs: [],
      opacity: 1,
    },
    points: [],
  }

  it('produces a rectangle node with correct position', () => {
    const result = convertSketchRectangle(layer)
    expect(result.type).toBe('rectangle')
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(40)
  })

  it('includes the node name', () => {
    expect(convertSketchRectangle(layer).name).toBe('Button BG')
  })

  it('converts fill color', () => {
    expect(convertSketchRectangle(layer).fill).toMatchObject({ type: 'solid' })
  })
})
