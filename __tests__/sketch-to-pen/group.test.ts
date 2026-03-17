import { convertSketchGroup } from '../../src/converters/sketch-to-pen/group'
import { convertSketchSymbolMaster, convertSketchSymbolInstance } from '../../src/converters/sketch-to-pen/symbol'

describe('convertSketchGroup', () => {
  const layer = {
    name: 'Card', type: 'Group',
    frame: { x: 0, y: 0, width: 300, height: 200 },
    style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 },
    layers: [
      {
        name: 'BG', type: 'ShapePath', shapeType: 'Rectangle',
        frame: { x: 0, y: 0, width: 300, height: 200 },
        style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 },
        points: [],
      },
    ],
  }

  it('creates a group node', () => {
    expect(convertSketchGroup(layer).type).toBe('group')
  })

  it('has empty children when no dispatch provided', () => {
    expect(convertSketchGroup(layer).children).toHaveLength(0)
  })

  it('dispatches children when dispatch provided', () => {
    const mockDispatch = jest.fn().mockReturnValue({ type: 'rectangle', x: 0, y: 0, width: 100, height: 100 })
    const result = convertSketchGroup(layer, mockDispatch)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(result.children).toHaveLength(1)
  })
})

describe('convertSketchSymbolMaster', () => {
  const layer = {
    name: 'Button', symbolID: 'btn-1',
    frame: { x: 0, y: 0, width: 120, height: 40 },
    layers: [],
  }

  it('creates a reusable frame', () => {
    const result = convertSketchSymbolMaster(layer)
    expect(result.type).toBe('frame')
    expect(result.reusable).toBe(true)
    expect(result.id).toBe('btn-1')
  })
})

describe('convertSketchSymbolInstance', () => {
  it('creates a ref node with correct ref', () => {
    const layer = {
      name: 'Button Instance',
      frame: { x: 100, y: 100, width: 120, height: 40 },
      master: { symbolID: 'btn-1' },
      overrides: [],
    }
    const result = convertSketchSymbolInstance(layer)
    expect(result.type).toBe('ref')
    expect(result.ref).toBe('btn-1')
  })
})
