export interface SketchColor {
  red: number
  green: number
  blue: number
  alpha: number
}

export function hexToSketchColor(hex: string): SketchColor {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    return hexToSketchColor('#' + h.split('').map(c => c + c).join(''))
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  return { red: r, green: g, blue: b, alpha: a }
}

export function sketchColorToHex(color: SketchColor): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  const rgb = toHex(color.red) + toHex(color.green) + toHex(color.blue)
  if (color.alpha < 1) {
    return '#' + rgb + toHex(color.alpha)
  }
  return '#' + rgb
}
