import type { PenRectangleNode } from '../../types/pen'
import { applySketchStyle } from '../../utils/style'

export function convertSketchRectangle(layer: any): PenRectangleNode {
  const { frame, name, points } = layer
  const cornerRadius = points?.[0]?.cornerRadius || undefined

  const node: PenRectangleNode = {
    type: 'rectangle',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
  }

  applySketchStyle(node, layer)
  if (cornerRadius) node.cornerRadius = cornerRadius

  return node
}
