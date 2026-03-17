import type { PenPathNode } from '../../types/pen'
import { penFillsToSketch, penStrokeToSketch, penEffectsToSketch } from '../../utils/style'

export function convertPenPath(node: PenPathNode, parent: any): any {
  const { ShapePath } = require('sketch/dom')
  const w = Number(node.width ?? 100)
  const h = Number(node.height ?? 100)
  const { shadows, blurs } = penEffectsToSketch(node.effect)

  return ShapePath.fromSVGPath(node.d, {
    parent,
    name: node.name ?? 'Path',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: w, height: h },
    style: {
      fills: penFillsToSketch(node.fill, { width: w, height: h }),
      borders: penStrokeToSketch(node.stroke),
      shadows,
      blur: blurs[0],
      opacity: node.opacity ?? 1,
    },
  })
}
