import type { PenFrameNode, PenNode } from '../../types/pen'

type Dispatch = (node: PenNode, parent: any, symbolMap: Map<string, any>) => any

export function convertPenReusable(node: PenFrameNode, parent: any, symbolMap: Map<string, any>, dispatch: Dispatch): any {
  const { SymbolMaster } = require('sketch/dom')

  const master = new SymbolMaster({
    parent,
    name: node.name ?? 'Component',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 100), height: Number(node.height ?? 100) },
  })

  if (node.id) symbolMap.set(node.id, master)
  ;(node.children ?? []).forEach(child => dispatch(child, master, symbolMap))

  return master
}
