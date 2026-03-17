import { hexToSketchColor, sketchColorToHex } from './color'
import { sketchGradientToPen, penGradientToSketch } from './gradient'
import type { Frame } from './gradient'
import type { PenFill, PenStroke, PenEffect, PenSolidFill } from '../types/pen'

export function sketchFillsToPen(
  fills: any[],
  frame: Frame,
): PenFill | PenFill[] | undefined {
  const enabled = fills.filter(f => f.isEnabled)
  if (enabled.length === 0) return undefined
  const converted = enabled.map(f => sketchFillToPen(f, frame))
  return converted.length === 1 ? converted[0] : converted
}

function sketchFillToPen(fill: any, frame: Frame): PenFill {
  if (fill.fillType === 1) {
    return sketchGradientToPen(fill.gradient, frame)
  }
  if (fill.fillType === 4) {
    return { type: 'image', url: '', fit: 'fill' }
  }
  return { type: 'solid', color: sketchColorToHex(fill.color) } as PenSolidFill
}

export function penFillsToSketch(fill: PenFill | PenFill[] | undefined, frame: Frame): any[] {
  if (!fill) return []
  const fills = Array.isArray(fill) ? fill : [fill]
  return fills.map(f => penFillToSketch(f, frame))
}

function penFillToSketch(fill: PenFill, frame: Frame): any {
  if (fill.type === 'solid') {
    return { fillType: 0, color: hexToSketchColor(fill.color), isEnabled: true }
  }
  if (fill.type === 'linear' || fill.type === 'radial' || fill.type === 'angular') {
    return {
      fillType: 1,
      gradient: penGradientToSketch(fill as any, frame),
      isEnabled: true,
    }
  }
  if (fill.type === 'image') {
    return { fillType: 4, isEnabled: true }
  }
  return { fillType: 0, color: { red: 0.8, green: 0.8, blue: 0.8, alpha: 1 }, isEnabled: true }
}

export function sketchBordersToPen(borders: any[]): PenStroke | undefined {
  const enabled = borders.filter(b => b.isEnabled)
  if (enabled.length === 0) return undefined
  const b = enabled[0]
  const alignmentMap: Record<number, 'inside' | 'center' | 'outside'> = {
    0: 'inside', 1: 'center', 2: 'outside',
  }
  return {
    color: sketchColorToHex(b.color),
    width: b.thickness,
    alignment: alignmentMap[b.position] ?? 'center',
  }
}

export function penStrokeToSketch(stroke: PenStroke | undefined): any[] {
  if (!stroke) return []
  const alignmentMap: Record<string, number> = { inside: 0, center: 1, outside: 2 }
  return [{
    color: hexToSketchColor(stroke.color ?? '#000000'),
    thickness: stroke.width ?? 1,
    position: alignmentMap[stroke.alignment ?? 'center'] ?? 1,
    isEnabled: true,
  }]
}

export function sketchShadowsToPen(shadows: any[], blurs: any[]): PenEffect[] {
  const effects: PenEffect[] = []

  shadows.forEach(s => {
    if (!s.isEnabled) return
    effects.push({
      type: 'shadow',
      color: sketchColorToHex(s.color),
      x: s.x,
      y: s.y,
      blur: s.blur,
      spread: s.spread,
    })
  })

  blurs.forEach(b => {
    if (!b.isEnabled) return
    effects.push({ type: 'blur', radius: b.radius })
  })

  return effects
}

/** Applies fills, stroke, effects, and opacity from a Sketch layer onto a .pen node in-place. */
export function applySketchStyle(node: any, layer: any): void {
  const { frame, style } = layer
  const fill = sketchFillsToPen(style.fills ?? [], { width: frame.width, height: frame.height })
  if (fill) node.fill = fill
  const stroke = sketchBordersToPen(style.borders ?? [])
  if (stroke) node.stroke = stroke
  const effects = sketchShadowsToPen(style.shadows ?? [], style.blurs ?? [])
  if (effects.length) node.effect = effects
  if (style.opacity != null && style.opacity !== 1) node.opacity = style.opacity
}

/** Builds the Sketch style object for a shape node from a .pen node's style properties. */
export function buildShapeStyle(node: any, w: number, h: number): object {
  const { shadows, blurs } = penEffectsToSketch(node.effect)
  return {
    fills: penFillsToSketch(node.fill, { width: w, height: h }),
    borders: penStrokeToSketch(node.stroke),
    shadows,
    blur: blurs[0],
    opacity: node.opacity ?? 1,
  }
}

export function penEffectsToSketch(effects: PenEffect[] | undefined): { shadows: any[]; blurs: any[] } {
  if (!effects) return { shadows: [], blurs: [] }
  const shadows: any[] = []
  const blurs: any[] = []

  effects.forEach(e => {
    if (e.type === 'shadow' || e.type === 'inner_shadow') {
      shadows.push({
        color: hexToSketchColor(e.color ?? '#00000040'),
        x: e.x ?? 0,
        y: e.y ?? 2,
        blur: e.blur ?? 4,
        spread: e.spread ?? 0,
        isEnabled: true,
      })
    } else if (e.type === 'blur' || e.type === 'background_blur') {
      blurs.push({ radius: e.radius, isEnabled: true })
    }
  })

  return { shadows, blurs }
}
