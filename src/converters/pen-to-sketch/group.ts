import type { PenGroupNode, PenNode } from '../../types/pen'
import type { DispatchFn } from './frame'

export function convertPenGroup(node: PenGroupNode, parent: any, symbolMap: Map<string, any>, dispatch: DispatchFn): any {
  const { Group } = require('sketch/dom')

  const group = new Group({
    parent,
    name: node.name ?? 'Group',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 100), height: Number(node.height ?? 100) },
    style: { opacity: node.opacity ?? 1 },
  })

  ;(node.children ?? []).forEach(child => dispatch(child, group, symbolMap))

  return group
}
