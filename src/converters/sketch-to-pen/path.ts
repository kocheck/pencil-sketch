import type { PenPathNode } from '../../types/pen'
import { sketchFillsToPen, sketchBordersToPen, sketchShadowsToPen } from '../../utils/style'

export function convertSketchPath(layer: any): PenPathNode {
  const { frame, style, name } = layer
  const d: string = layer.getSVGPath?.() ?? 'M0 0'

  const node: PenPathNode = { type: 'path', name, x: frame.x, y: frame.y, width: frame.width, height: frame.height, d }

  const fill = sketchFillsToPen(style.fills ?? [], { width: frame.width, height: frame.height })
  if (fill) node.fill = fill
  const stroke = sketchBordersToPen(style.borders ?? [])
  if (stroke) node.stroke = stroke
  const effects = sketchShadowsToPen(style.shadows ?? [], style.blurs ?? [])
  if (effects.length) node.effect = effects

  return node
}
