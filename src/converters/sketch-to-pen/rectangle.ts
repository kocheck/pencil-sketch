import type { PenRectangleNode } from '../../types/pen'
import { sketchFillsToPen, sketchBordersToPen, sketchShadowsToPen } from '../../utils/style'

export function convertSketchRectangle(layer: any): PenRectangleNode {
  const { frame, style, name, points } = layer
  const cornerRadius = points?.[0]?.cornerRadius || undefined

  const node: PenRectangleNode = {
    type: 'rectangle',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
  }

  const fill = sketchFillsToPen(style.fills ?? [], { width: frame.width, height: frame.height })
  if (fill) node.fill = fill

  const stroke = sketchBordersToPen(style.borders ?? [])
  if (stroke) node.stroke = stroke

  const effects = sketchShadowsToPen(style.shadows ?? [], style.blurs ?? [])
  if (effects.length) node.effect = effects

  if (style.opacity != null && style.opacity !== 1) node.opacity = style.opacity
  if (cornerRadius) node.cornerRadius = cornerRadius

  return node
}
