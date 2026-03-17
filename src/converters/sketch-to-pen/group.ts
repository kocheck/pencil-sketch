import type { PenGroupNode, PenNode } from '../../types/pen'

type Dispatch = (layer: any) => PenNode | null

export function convertSketchGroup(layer: any, dispatch?: Dispatch): PenGroupNode {
  const { frame, style, name } = layer

  const node: PenGroupNode = {
    type: 'group',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    children: dispatch
      ? (layer.layers ?? []).map(dispatch).filter(Boolean) as PenNode[]
      : [],
  }

  if (style?.opacity != null && style.opacity !== 1) node.opacity = style.opacity
  return node
}
