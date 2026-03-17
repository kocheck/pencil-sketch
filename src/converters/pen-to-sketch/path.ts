import type { PenPathNode } from '../../types/pen'
import { buildShapeStyle } from '../../utils/style'

export function convertPenPath(node: PenPathNode, parent: any): any {
  const { ShapePath } = require('sketch/dom')
  const w = Number(node.width ?? 100)
  const h = Number(node.height ?? 100)

  return ShapePath.fromSVGPath(node.d, {
    parent,
    name: node.name ?? 'Path',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: w, height: h },
    style: buildShapeStyle(node, w, h),
  })
}
