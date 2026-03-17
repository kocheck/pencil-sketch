import type { PenTextNode, PenTextSegment } from '../../types/pen'
import { hexToSketchColor } from '../../utils/color'

const TEXT_ALIGN_MAP: Record<string, string> = {
  left: 'left', center: 'center', right: 'right', justify: 'justified',
}

export function convertPenText(node: PenTextNode, parent: any): any {
  const { Text } = require('sketch/dom')

  const plainText = getPlainText(node.content)
  const fill = node.fill
  const color = fill && !Array.isArray(fill) && fill.type === 'solid'
    ? hexToSketchColor(fill.color)
    : { red: 0, green: 0, blue: 0, alpha: 1 }

  return new Text({
    parent,
    name: node.name ?? 'Text',
    text: plainText,
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 200), height: Number(node.height ?? 30) },
    style: {
      fontSize: node.fontSize ?? 14,
      fontFamily: node.fontFamily ?? 'Inter',
      fontWeight: node.fontWeight ?? 400,
      textColor: color,
      alignment: TEXT_ALIGN_MAP[node.textAlign ?? 'left'] ?? 'left',
      letterSpacing: node.letterSpacing ?? 0,
      lineHeight: node.lineHeight,
      opacity: node.opacity ?? 1,
    },
  })
}

function getPlainText(content: PenTextNode['content']): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  return (content as PenTextSegment[]).map(s => s.text).join('')
}
