import type { PenRefNode } from '../../types/pen'

export function convertPenRef(node: PenRefNode, parent: any, symbolMap: Map<string, any>): any {
  const master = symbolMap.get(node.ref)
  if (!master) {
    console.warn(`[pen-to-sketch] Unknown ref: ${node.ref} — skipping`)
    return null
  }
  const instance = master.createNewInstance?.() ?? null
  if (!instance) return null

  instance.parent = parent
  instance.frame = { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 100), height: Number(node.height ?? 100) }
  instance.name = node.name ?? master.name

  return instance
}
