import type { PenPathNode } from '../../types/pen'
import { applySketchStyle } from '../../utils/style'

export function convertSketchPath(layer: any): PenPathNode {
  const { frame, name } = layer
  const d: string = layer.getSVGPath?.() ?? 'M0 0'

  const node: PenPathNode = { type: 'path', name, x: frame.x, y: frame.y, width: frame.width, height: frame.height, d }
  applySketchStyle(node, layer)
  return node
}
