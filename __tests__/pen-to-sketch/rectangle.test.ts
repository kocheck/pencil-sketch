import { convertPenRectangle } from '../../src/converters/pen-to-sketch/rectangle'
import type { PenRectangleNode } from '../../src/types/pen'

describe('convertPenRectangle', () => {
  const parent = {}

  it('creates a ShapePath with correct frame', () => {
    const node: PenRectangleNode = { type: 'rectangle', x: 10, y: 20, width: 100, height: 50 }
    const result = convertPenRectangle(node, parent)
    expect(result.frame).toMatchObject({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('applies a solid fill', () => {
    const node: PenRectangleNode = {
      type: 'rectangle', x: 0, y: 0, width: 100, height: 100,
      fill: { type: 'solid', color: '#ff0000' },
    }
    const result = convertPenRectangle(node, parent)
    expect(result.style.fills[0].color).toMatchObject({ red: 1, green: 0, blue: 0, alpha: 1 })
  })

  it('uses the node name when provided', () => {
    const node: PenRectangleNode = { type: 'rectangle', name: 'Card BG', x: 0, y: 0, width: 50, height: 50 }
    const result = convertPenRectangle(node, parent)
    expect(result.name).toBe('Card BG')
  })
})
