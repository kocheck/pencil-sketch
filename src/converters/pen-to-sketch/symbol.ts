import type { PenFrameNode, PenNode } from '../../types/pen'
import type { DispatchFn } from './frame'

export function convertPenReusable(node: PenFrameNode, parent: any, symbolMap: Map<string, any>, dispatch: DispatchFn): any {
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
