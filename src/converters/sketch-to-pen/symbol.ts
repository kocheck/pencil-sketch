import type { PenFrameNode, PenRefNode, PenNode } from '../../types/pen'

type Dispatch = (layer: any) => PenNode | null

export function convertSketchSymbolMaster(layer: any, dispatch?: Dispatch): PenFrameNode {
  const { frame, name, layers, symbolID } = layer
  return {
    type: 'frame',
    id: symbolID ?? name,
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    reusable: true,
    children: dispatch
      ? (layers ?? []).map(dispatch).filter(Boolean) as PenNode[]
      : [],
  }
}

export function convertSketchSymbolInstance(layer: any): PenRefNode {
  const { frame, name, master, overrides } = layer

  const node: PenRefNode = {
    type: 'ref',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    ref: master?.symbolID ?? master?.name ?? '',
  }

  if (overrides && overrides.length > 0) {
    const descendants: Record<string, any> = {}
    overrides.forEach((override: any) => {
      if (override.isDefault) return
      descendants[override.path ?? override.id] = { content: override.value }
    })
    if (Object.keys(descendants).length > 0) node.descendants = descendants
  }

  return node
}
