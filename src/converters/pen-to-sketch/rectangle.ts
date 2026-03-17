import type { PenRectangleNode } from '../../types/pen'
import { buildShapeStyle } from '../../utils/style'

export function convertPenRectangle(node: PenRectangleNode, parent: any): any {
  const { ShapePath } = require('sketch/dom')
  const w = Number(node.width ?? 100)
  const h = Number(node.height ?? 100)
  const frame = { x: node.x ?? 0, y: node.y ?? 0, width: w, height: h }

  const shape = new ShapePath({
    parent,
    name: node.name ?? 'Rectangle',
    shapeType: ShapePath.ShapeType.Rectangle,
    frame,
    style: buildShapeStyle(node, w, h),
  })

  if (node.cornerRadius != null) {
    const r = typeof node.cornerRadius === 'number'
      ? node.cornerRadius
      : node.cornerRadius[0]
    shape.points?.forEach((pt: any) => { pt.cornerRadius = r })
  }

  return shape
}
