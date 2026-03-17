import { sketchColorToHex, hexToSketchColor } from './color'
import type { PenFill, PenLinearGradientFill, PenRadialGradientFill, PenGradientStop } from '../types/pen'

export interface SketchGradient {
  gradientType: number
  stops: SketchGradientStop[]
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export interface SketchGradientStop {
  color: { red: number; green: number; blue: number; alpha: number }
  position: number
}

interface Frame { width: number; height: number }

export function sketchGradientToPen(grad: SketchGradient, frame: Frame): PenFill {
  const stops: PenGradientStop[] = grad.stops.map(s => ({
    color: sketchColorToHex(s.color),
    position: s.position,
  }))

  if (grad.gradientType === 0) {
    const dx = (grad.to.x - grad.from.x) * frame.width
    const dy = (grad.to.y - grad.from.y) * frame.height
    const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI))
    return { type: 'linear', stops, angle } as PenLinearGradientFill
  }

  if (grad.gradientType === 1) {
    return {
      type: 'radial',
      stops,
      cx: grad.from.x * frame.width,
      cy: grad.from.y * frame.height,
    } as PenRadialGradientFill
  }

  return { type: 'angular', stops, cx: frame.width / 2, cy: frame.height / 2 } as any
}

export function penGradientToSketch(fill: PenLinearGradientFill | PenRadialGradientFill, frame: Frame): SketchGradient {
  const stops: SketchGradientStop[] = fill.stops.map(s => ({
    color: hexToSketchColor(s.color),
    position: s.position,
  }))

  if (fill.type === 'linear') {
    const angle = ((fill.angle ?? 0) * Math.PI) / 180
    return {
      gradientType: 0 as number,
      stops,
      from: { x: 0.5 - Math.cos(angle) / 2, y: 0.5 - Math.sin(angle) / 2 },
      to:   { x: 0.5 + Math.cos(angle) / 2, y: 0.5 + Math.sin(angle) / 2 },
    }
  }

  const cx = fill.cx != null ? fill.cx / frame.width : 0.5
  const cy = fill.cy != null ? fill.cy / frame.height : 0.5
  return {
    gradientType: 1 as number,
    stops,
    from: { x: cx, y: cy },
    to:   { x: cx + 0.5, y: cy },
  }
}
