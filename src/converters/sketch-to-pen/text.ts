import type { PenTextNode } from '../../types/pen'
import { sketchColorToHex } from '../../utils/color'

const ALIGN_MAP: Record<string, PenTextNode['textAlign']> = {
  left: 'left', center: 'center', right: 'right', justified: 'justify',
}

export function convertSketchText(layer: any): PenTextNode {
  const { frame, style, name, text } = layer

  const node: PenTextNode = {
    type: 'text',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    content: text,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing != null ? style.letterSpacing : undefined,
    textAlign: ALIGN_MAP[style.alignment] ?? 'left',
  }

  if (style.opacity != null && style.opacity !== 1) node.opacity = style.opacity

  if (style.textColor) {
    node.fill = { type: 'solid', color: sketchColorToHex(style.textColor) }
  }

  return node
}
