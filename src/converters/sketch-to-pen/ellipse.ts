import type { PenEllipseNode } from '../../types/pen'
import { applySketchStyle } from '../../utils/style'

export function convertSketchEllipse(layer: any): PenEllipseNode {
  const { frame, name } = layer
  const node: PenEllipseNode = { type: 'ellipse', name, x: frame.x, y: frame.y, width: frame.width, height: frame.height }
  applySketchStyle(node, layer)
  return node
}
