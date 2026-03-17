import type { PenDocument, PenNode } from '../../types/pen'
import { convertPenRectangle } from './rectangle'
import { convertPenEllipse } from './ellipse'
import { convertPenPath } from './path'
import { convertPenText } from './text'
import { convertPenFrame } from './frame'
import { convertPenGroup } from './group'
import { convertPenReusable } from './symbol'
import { convertPenRef } from './ref'

export function convertPenDocument(doc: PenDocument, parent: any): void {
  const symbolMap = new Map<string, any>()

  // First pass: register all reusable nodes
  collectReusables(doc.children, symbolMap, parent)

  // Second pass: convert everything else
  doc.children.forEach(node => {
    if ((node as any).reusable) return
    dispatchPenNode(node, parent, symbolMap)
  })
}

function collectReusables(nodes: PenNode[], symbolMap: Map<string, any>, parent: any): void {
  nodes.forEach(node => {
    if ((node as any).reusable && (node.type === 'frame' || node.type === 'group')) {
      convertPenReusable(node as any, parent, symbolMap, dispatchPenNode)
    }
    if ('children' in node && Array.isArray((node as any).children)) {
      collectReusables((node as any).children as PenNode[], symbolMap, parent)
    }
  })
}

export function dispatchPenNode(node: PenNode, parent: any, symbolMap: Map<string, any>): any {
  switch (node.type) {
    case 'rectangle': return convertPenRectangle(node, parent)
    case 'ellipse':   return convertPenEllipse(node, parent)
    case 'path':      return convertPenPath(node, parent)
    case 'line':      return convertPenPath({ ...node, d: `M0,0 L${node.width ?? 100},0` } as any, parent)
    case 'text':      return convertPenText(node, parent)
    case 'frame':     return (node as any).reusable
                        ? convertPenReusable(node as any, parent, symbolMap, dispatchPenNode)
                        : convertPenFrame(node as any, parent, symbolMap, dispatchPenNode)
    case 'group':     return convertPenGroup(node as any, parent, symbolMap, dispatchPenNode)
    case 'ref':       return convertPenRef(node, parent, symbolMap)
    default:
      console.warn(`[pen-to-sketch] Unsupported node type: ${(node as any).type} — skipping`)
      return null
  }
}
