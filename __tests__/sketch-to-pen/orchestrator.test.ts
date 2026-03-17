import { convertSketchPage, dispatchSketchLayer } from '../../src/converters/sketch-to-pen/index'

describe('dispatchSketchLayer', () => {
  it('handles Rectangle', () => {
    const layer = {
      type: 'ShapePath', shapeType: 'Rectangle', name: 'R',
      frame: { x: 0, y: 0, width: 50, height: 50 },
      style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 }, points: [],
    }
    expect(dispatchSketchLayer(layer)?.type).toBe('rectangle')
  })

  it('handles Oval', () => {
    const layer = {
      type: 'ShapePath', shapeType: 'Oval', name: 'O',
      frame: { x: 0, y: 0, width: 50, height: 50 },
      style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 }, points: [],
    }
    expect(dispatchSketchLayer(layer)?.type).toBe('ellipse')
  })

  it('handles Text', () => {
    const layer = {
      type: 'Text', name: 'T', text: 'hi',
      frame: { x: 0, y: 0, width: 100, height: 20 },
      style: { fontSize: 14, fontFamily: 'Inter', fontWeight: 400, textColor: { red: 0, green: 0, blue: 0, alpha: 1 }, alignment: 'left', letterSpacing: 0, opacity: 1, fills: [], borders: [], shadows: [], blurs: [] },
    }
    expect(dispatchSketchLayer(layer)?.type).toBe('text')
  })

  it('returns null for unsupported layer types', () => {
    const layer = { type: 'HotSpot', name: 'hs', frame: { x: 0, y: 0, width: 0, height: 0 } }
    expect(dispatchSketchLayer(layer)).toBeNull()
  })
})

describe('convertSketchPage', () => {
  it('builds a PenDocument from a Sketch page', () => {
    const page = {
      name: 'Page 1',
      layers: [
        {
          type: 'ShapePath', shapeType: 'Rectangle', name: 'R',
          frame: { x: 0, y: 0, width: 100, height: 100 },
          style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 }, points: [],
        },
      ],
    }
    const doc = convertSketchPage(page)
    expect(doc.children).toHaveLength(1)
    expect(doc.children[0].type).toBe('rectangle')
  })

  it('filters out null results from unsupported layers', () => {
    const page = {
      layers: [
        { type: 'HotSpot', name: 'hs', frame: { x: 0, y: 0, width: 0, height: 0 } },
        {
          type: 'ShapePath', shapeType: 'Rectangle', name: 'R',
          frame: { x: 0, y: 0, width: 50, height: 50 },
          style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 }, points: [],
        },
      ],
    }
    expect(convertSketchPage(page).children).toHaveLength(1)
  })
})
