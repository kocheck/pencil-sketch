import { convertPenFrame } from '../../src/converters/pen-to-sketch/frame'
import type { PenFrameNode, PenRectangleNode, PenNode } from '../../src/types/pen'

const mockDispatch = jest.fn()

describe('convertPenFrame', () => {
  beforeEach(() => mockDispatch.mockClear())

  it('creates a Group with correct frame', () => {
    const node: PenFrameNode = { type: 'frame', x: 10, y: 10, width: 300, height: 200, children: [] }
    const result = convertPenFrame(node, {}, new Map(), mockDispatch)
    expect(result.frame).toMatchObject({ x: 10, y: 10, width: 300, height: 200 })
  })

  it('calls dispatch for each child', () => {
    const child: PenRectangleNode = { type: 'rectangle', x: 0, y: 0, width: 50, height: 50 }
    const node: PenFrameNode = { type: 'frame', x: 0, y: 0, width: 300, height: 200, children: [child] }
    convertPenFrame(node, {}, new Map(), mockDispatch)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(mockDispatch).toHaveBeenCalledWith(child, expect.anything(), expect.any(Map))
  })

  it('registers reusable node in symbolMap', () => {
    const symbolMap = new Map<string, any>()
    const node: PenFrameNode = { type: 'frame', id: 'btn-1', x: 0, y: 0, width: 100, height: 40, reusable: true, children: [] }
    convertPenFrame(node, {}, symbolMap, mockDispatch)
    expect(symbolMap.has('btn-1')).toBe(true)
  })
})
