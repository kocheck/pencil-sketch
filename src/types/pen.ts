// Root document
export interface PenDocument {
  version?: string
  themes?: Record<string, string[]>
  imports?: string[]
  variables?: Record<string, PenVariable>
  children: PenNode[]
}

// Union of all node types
export type PenNode =
  | PenFrameNode
  | PenGroupNode
  | PenRectangleNode
  | PenEllipseNode
  | PenLineNode
  | PenPolygonNode
  | PenPathNode
  | PenTextNode
  | PenRefNode

export type PenNodeType =
  | 'frame' | 'group' | 'rectangle' | 'ellipse'
  | 'line' | 'polygon' | 'path' | 'text' | 'ref'

// Shared base properties
export interface PenBaseNode {
  id?: string
  type: PenNodeType
  name?: string
  x?: number
  y?: number
  width?: number | string  // 'fit_content' is valid
  height?: number | string
  opacity?: number
  enabled?: boolean
  rotation?: number
  blendMode?: string
  fill?: PenFill | PenFill[]
  stroke?: PenStroke
  effect?: PenEffect[]
  reusable?: boolean
  theme?: Record<string, string>
  metadata?: Record<string, unknown>
}

// Layout (flexbox)
export interface PenLayoutProps {
  layout?: 'none' | 'vertical' | 'horizontal'
  gap?: number
  padding?: number | string  // '8 16' shorthand is valid
  justifyContent?: 'start' | 'center' | 'end' | 'space_between' | 'space_around'
  alignItems?: 'start' | 'center' | 'end'
  clip?: boolean
}

// Container nodes
export interface PenFrameNode extends PenBaseNode, PenLayoutProps {
  type: 'frame'
  children?: PenNode[]
  slot?: string[]
}

export interface PenGroupNode extends PenBaseNode, PenLayoutProps {
  type: 'group'
  children?: PenNode[]
}

// Shape nodes
export interface PenRectangleNode extends PenBaseNode {
  type: 'rectangle'
  cornerRadius?: number | [number, number, number, number]
}

export interface PenEllipseNode extends PenBaseNode {
  type: 'ellipse'
}

export interface PenLineNode extends PenBaseNode {
  type: 'line'
}

export interface PenPolygonNode extends PenBaseNode {
  type: 'polygon'
  sides?: number
}

export interface PenPathNode extends PenBaseNode {
  type: 'path'
  d: string  // SVG path data string
}

// Text
export interface PenTextNode extends PenBaseNode {
  type: 'text'
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  letterSpacing?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textAlignVertical?: 'top' | 'middle' | 'bottom'
  textGrowth?: 'auto' | 'fixed-width' | 'fixed-width-height'
  content?: string | PenTextSegment[]
}

export interface PenTextSegment {
  text: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  color?: string
  letterSpacing?: number
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
}

// Component reference (instance of reusable)
export interface PenRefNode extends PenBaseNode {
  type: 'ref'
  ref: string  // ID of the reusable component
  descendants?: Record<string, Partial<PenBaseNode>>  // keyed by "path/to/child"
}

// Fill types
export type PenFill =
  | PenSolidFill
  | PenLinearGradientFill
  | PenRadialGradientFill
  | PenAngularGradientFill
  | PenImageFill

export interface PenSolidFill {
  type: 'solid'
  color: string  // hex e.g. '#FF0000' or '#FF0000CC' with alpha
  opacity?: number
}

export interface PenLinearGradientFill {
  type: 'linear'
  stops: PenGradientStop[]
  angle?: number  // degrees
}

export interface PenRadialGradientFill {
  type: 'radial'
  stops: PenGradientStop[]
  cx?: number  // center x (px, relative to node)
  cy?: number
}

export interface PenAngularGradientFill {
  type: 'angular'
  stops: PenGradientStop[]
  cx?: number
  cy?: number
}

export interface PenGradientStop {
  color: string  // hex
  position: number  // 0–1
}

export interface PenImageFill {
  type: 'image'
  url: string  // base64 data URL or external URL
  fit?: 'fill' | 'fit' | 'stretch' | 'tile'
}

// Stroke
export interface PenStroke {
  color?: string
  width?: number
  opacity?: number
  alignment?: 'inside' | 'outside' | 'center'
  dashPattern?: number[]
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
}

// Effects
export type PenEffect =
  | PenShadowEffect
  | PenInnerShadowEffect
  | PenBlurEffect

export interface PenShadowEffect {
  type: 'shadow'
  color: string
  x?: number
  y?: number
  blur?: number
  spread?: number
  opacity?: number
}

export interface PenInnerShadowEffect {
  type: 'inner_shadow'
  color: string
  x?: number
  y?: number
  blur?: number
  spread?: number
  opacity?: number
}

export interface PenBlurEffect {
  type: 'blur' | 'background_blur'
  radius: number
}

// Variables
export interface PenVariable {
  type: 'color' | 'number' | 'string' | 'boolean'
  value: PenVariableValue | PenVariableValue[]
}

export interface PenVariableValue {
  value: string | number | boolean
  theme?: Record<string, string>
}
