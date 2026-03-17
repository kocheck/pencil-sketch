import type { PenEllipseNode } from '../../types/pen'
import { buildShapeStyle } from '../../utils/style'

export function convertPenEllipse(node: PenEllipseNode, parent: any): any {
  const { ShapePath } = require('sketch/dom')
  const w = Number(node.width ?? 100)
  const h = Number(node.height ?? 100)

  return new ShapePath({
    parent,
    name: node.name ?? 'Ellipse',
    shapeType: ShapePath.ShapeType.Oval,
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: w, height: h },
    style: buildShapeStyle(node, w, h),
  })
}
