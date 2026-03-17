import type { PenFrameNode, PenNode } from '../../types/pen'

type Dispatch = (node: PenNode, parent: any, symbolMap: Map<string, any>) => any

export function convertPenFrame(node: PenFrameNode, parent: any, symbolMap: Map<string, any>, dispatch: Dispatch): any {
  const { Group } = require('sketch/dom')

  const group = new Group({
    parent,
    name: node.name ?? 'Frame',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 100), height: Number(node.height ?? 100) },
    style: { opacity: node.opacity ?? 1 },
  })

  if (node.reusable && node.id) {
    symbolMap.set(node.id, group)
  }

  ;(node.children ?? []).forEach(child => dispatch(child, group, symbolMap))

  return group
}
