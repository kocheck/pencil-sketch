import { convertPenDocument, dispatchPenNode } from '../../src/converters/pen-to-sketch/index'
import type { PenDocument } from '../../src/types/pen'

describe('dispatchPenNode', () => {
  it('dispatches a rectangle node without throwing', () => {
    const symbolMap = new Map()
    expect(() => dispatchPenNode(
      { type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
      {},
      symbolMap
    )).not.toThrow()
  })

  it('skips unknown node types without throwing', () => {
    const symbolMap = new Map()
    expect(() => dispatchPenNode(
      { type: 'note' as any, x: 0, y: 0 },
      {},
      symbolMap
    )).not.toThrow()
  })
})

describe('convertPenDocument', () => {
  it('processes all non-reusable children', () => {
    const doc: PenDocument = {
      children: [
        { type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { type: 'text', x: 0, y: 110, width: 100, height: 20, content: 'Hello' },
      ],
    }
    expect(() => convertPenDocument(doc, {})).not.toThrow()
  })

  it('skips reusable nodes in second pass', () => {
    const doc: PenDocument = {
      children: [
        { type: 'frame', id: 'comp', x: 0, y: 0, width: 100, height: 100, reusable: true, children: [] },
        { type: 'rectangle', x: 0, y: 0, width: 50, height: 50 },
      ],
    }
    expect(() => convertPenDocument(doc, {})).not.toThrow()
  })
})
