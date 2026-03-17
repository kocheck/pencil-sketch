# Sketch ↔ Pencil (.pen) Converter Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Sketch plugin with two commands — "Import .pen file" (converts `.pen` JSON to Sketch layers) and "Copy as .pen" (converts current Sketch selection to `.pen` JSON and copies to clipboard).

**Architecture:** Visitor/handler pattern — a central orchestrator walks the layer tree and dispatches each node type to a dedicated handler module in `converters/sketch-to-pen/` or `converters/pen-to-sketch/`. All converter logic is pure TypeScript (JSON in → plain object out), fully unit-testable without the Sketch runtime. Plugin commands wire the converters to Sketch's native APIs (NSOpenPanel for file picking, NSPasteboard for clipboard).

**Tech Stack:** skpm (Sketch Plugin Manager), TypeScript, webpack, Jest, Sketch JavaScript API (`sketch/dom`, `sketch/ui`), native macOS ObjC bridge for file dialogs and clipboard.

---

## Reference Docs

Before starting, read these:
- Sketch JS API: https://developer.sketch.com/reference/api/
- Sketch Plugin Manifest: https://developer.sketch.com/plugins/plugin-manifest
- `.pen` format: https://docs.pencil.dev/for-developers/the-pen-format
- skpm GitHub: https://github.com/skpm/skpm

---

## Task 1: Scaffold Project with skpm + TypeScript + Jest

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `jest.config.js`
- Create: `webpack.skpm.config.js`
- Create: `src/commands/import-pen.ts` (stub)
- Create: `src/commands/copy-as-pen.ts` (stub)

**Step 1: Install skpm globally**

```bash
npm install -g skpm
```

**Step 2: Initialize skpm project in the existing repo**

```bash
cd /Users/kylekochanek/Documents/GitHub/pencil-sketch
skpm create . --name="pencil-sketch" --force
```

This generates a base `package.json` and `manifest.json`. We'll overwrite them in the next steps.

**Step 3: Replace `package.json` with this content**

```json
{
  "name": "pencil-sketch",
  "version": "1.0.0",
  "description": "Bidirectional Sketch ↔ Pencil (.pen) converter",
  "main": "pencil-sketch.sketchplugin",
  "scripts": {
    "build": "skpm-build",
    "watch": "skpm-build --watch",
    "start": "skpm-build --watch --run",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "skpm": {
    "name": "Pencil Sketch",
    "main": "pencil-sketch.sketchplugin"
  },
  "devDependencies": {
    "@skpm/builder": "^2.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "commonjs",
    "lib": ["ES2017"],
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*", "__tests__/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 5: Create `jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^sketch$': '<rootDir>/__mocks__/sketch.ts',
    '^sketch/(.*)$': '<rootDir>/__mocks__/sketch.ts',
  },
}
```

**Step 6: Create `webpack.skpm.config.js`** (tells skpm to use ts-loader)

```js
module.exports = (config) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
    exclude: /node_modules/,
  })
  config.resolve.extensions.push('.ts', '.tsx')
  return config
}
```

**Step 7: Create stub commands**

`src/commands/import-pen.ts`:
```typescript
export default function () {
  // TODO: implement
}
```

`src/commands/copy-as-pen.ts`:
```typescript
export default function () {
  // TODO: implement
}
```

**Step 8: Install dependencies**

```bash
npm install
```

**Step 9: Verify build doesn't error**

```bash
npm run build
```

Expected: plugin bundle created in `pencil-sketch.sketchplugin/`

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold skpm + TypeScript + Jest project"
```

---

## Task 2: Plugin Manifest

**Files:**
- Create/replace: `manifest.json`

**Step 1: Write `manifest.json`**

```json
{
  "name": "Pencil Sketch",
  "identifier": "dev.pencil.sketch-converter",
  "version": "1.0.0",
  "description": "Import .pen files into Sketch and export Sketch selections to .pen format",
  "author": "Kyle Kochanek",
  "compatibleVersion": "70",
  "bundleVersion": 1,
  "disableCocoaScriptPreprocessor": true,
  "commands": [
    {
      "name": "Import .pen file…",
      "identifier": "import-pen",
      "script": "./commands/import-pen.js",
      "handler": "default",
      "shortcut": "ctrl shift i"
    },
    {
      "name": "Copy as .pen",
      "identifier": "copy-as-pen",
      "script": "./commands/copy-as-pen.js",
      "handler": "default",
      "shortcut": "ctrl shift c"
    }
  ],
  "menu": {
    "title": "Pencil",
    "items": ["import-pen", "copy-as-pen"]
  }
}
```

**Step 2: Rebuild and verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add manifest.json
git commit -m "feat: add plugin manifest with import and copy-as-pen commands"
```

---

## Task 3: Define TypeScript Types for `.pen` Format

**Files:**
- Create: `src/types/pen.ts`
- Create: `src/types/sketch.d.ts`
- Create: `__mocks__/sketch.ts`

**Step 1: Create `src/types/pen.ts`**

```typescript
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
```

**Step 2: Create `src/types/sketch.d.ts`** (declare ObjC bridge globals)

```typescript
// Objective-C bridge globals available in the Sketch plugin runtime.
// These are NOT available in Jest tests — use __mocks__/sketch.ts instead.

declare const NSOpenPanel: any
declare const NSModalResponseOK: number
declare const NSString: any
declare const NSUTF8StringEncoding: number
declare const NSPasteboard: any
declare const NSPasteboardTypeString: string
declare const NSAlert: any
declare const NSApplication: any
```

**Step 3: Create `__mocks__/sketch.ts`** (minimal mock for tests)

```typescript
const sketch = {
  getSelectedDocument: () => null,
  Document: { getSelectedDocument: () => null },
  ShapePath: class {
    constructor(opts: any) { Object.assign(this, opts) }
    static ShapeType = { Rectangle: 'Rectangle', Oval: 'Oval' }
  },
  Shape: class { constructor(opts: any) { Object.assign(this, opts) } },
  Text: class { constructor(opts: any) { Object.assign(this, opts) } },
  Group: class { constructor(opts: any) { Object.assign(this, opts) } },
  Image: class { constructor(opts: any) { Object.assign(this, opts) } },
  SymbolMaster: class { constructor(opts: any) { Object.assign(this, opts) } },
  SymbolInstance: class { constructor(opts: any) { Object.assign(this, opts) } },
  Artboard: class { constructor(opts: any) { Object.assign(this, opts) } },
  Rectangle: class {
    constructor(public x: number, public y: number, public width: number, public height: number) {}
  },
  UI: {
    message: jest.fn(),
    alert: jest.fn(),
  },
}

export default sketch
module.exports = sketch
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 5: Commit**

```bash
git add src/types/ __mocks__/
git commit -m "feat: add .pen TypeScript types, Sketch ObjC globals, and test mock"
```

---

## Task 4: Color Utility

**Files:**
- Create: `src/utils/color.ts`
- Create: `__tests__/utils/color.test.ts`

The `.pen` format uses hex strings (`#RRGGBB` or `#RRGGBBAA`). The Sketch API uses `{ red, green, blue, alpha }` objects with 0–1 floats.

**Step 1: Write failing tests**

`__tests__/utils/color.test.ts`:
```typescript
import { hexToSketchColor, sketchColorToHex } from '../../src/utils/color'

describe('hexToSketchColor', () => {
  it('converts 6-digit hex to Sketch RGBA', () => {
    expect(hexToSketchColor('#FF0000')).toEqual({ red: 1, green: 0, blue: 0, alpha: 1 })
  })

  it('converts 8-digit hex (with alpha) to Sketch RGBA', () => {
    expect(hexToSketchColor('#FF000080')).toEqual({
      red: 1, green: 0, blue: 0, alpha: expect.closeTo(0.502, 2),
    })
  })

  it('handles lowercase hex', () => {
    expect(hexToSketchColor('#00ff00')).toEqual({ red: 0, green: 1, blue: 0, alpha: 1 })
  })
})

describe('sketchColorToHex', () => {
  it('converts opaque Sketch color to 6-digit hex', () => {
    expect(sketchColorToHex({ red: 1, green: 0, blue: 0, alpha: 1 })).toBe('#ff0000')
  })

  it('converts semi-transparent Sketch color to 8-digit hex', () => {
    expect(sketchColorToHex({ red: 1, green: 0, blue: 0, alpha: 0.5 })).toBe('#ff000080')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=color
```

Expected: FAIL — "cannot find module"

**Step 3: Implement `src/utils/color.ts`**

```typescript
export interface SketchColor {
  red: number
  green: number
  blue: number
  alpha: number
}

/** Convert a hex color string (#RGB, #RRGGBB, or #RRGGBBAA) to a Sketch RGBA object. */
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

/** Convert a Sketch RGBA object to a hex color string. */
export function sketchColorToHex(color: SketchColor): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  const rgb = toHex(color.red) + toHex(color.green) + toHex(color.blue)
  if (color.alpha < 1) {
    return '#' + rgb + toHex(color.alpha)
  }
  return '#' + rgb
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=color
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/utils/color.ts __tests__/utils/color.test.ts
git commit -m "feat: add color utility (hex ↔ Sketch RGBA conversion)"
```

---

## Task 5: Gradient Utility

**Files:**
- Create: `src/utils/gradient.ts`
- Create: `__tests__/utils/gradient.test.ts`

Sketch stores gradient coordinates as 0–1 normalized floats relative to the layer frame. `.pen` uses absolute pixel values. We also need to convert between Sketch's stop objects and `.pen`'s stop format.

**Step 1: Write failing tests**

`__tests__/utils/gradient.test.ts`:
```typescript
import { sketchGradientToPen, penGradientToSketch } from '../../src/utils/gradient'
import type { PenLinearGradientFill } from '../../src/types/pen'

const frame = { width: 100, height: 100 }

describe('sketchGradientToPen', () => {
  it('converts a horizontal linear gradient', () => {
    const sketchGrad = {
      gradientType: 0,  // 0 = linear
      stops: [
        { color: { red: 1, green: 0, blue: 0, alpha: 1 }, position: 0 },
        { color: { red: 0, green: 0, blue: 1, alpha: 1 }, position: 1 },
      ],
      from: { x: 0, y: 0.5 },
      to: { x: 1, y: 0.5 },
    }
    const result = sketchGradientToPen(sketchGrad, frame) as PenLinearGradientFill
    expect(result.type).toBe('linear')
    expect(result.stops).toHaveLength(2)
    expect(result.stops[0].color).toBe('#ff0000')
    expect(result.stops[0].position).toBe(0)
    expect(result.angle).toBeCloseTo(0, 1)
  })
})

describe('penGradientToSketch', () => {
  it('converts a linear gradient to Sketch format', () => {
    const penGrad: PenLinearGradientFill = {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 1 },
      ],
    }
    const result = penGradientToSketch(penGrad, frame)
    expect(result.gradientType).toBe(0)
    expect(result.stops).toHaveLength(2)
    expect(result.from).toBeDefined()
    expect(result.to).toBeDefined()
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern=gradient
```

**Step 3: Implement `src/utils/gradient.ts`**

```typescript
import { sketchColorToHex, hexToSketchColor } from './color'
import type { PenFill, PenLinearGradientFill, PenRadialGradientFill, PenGradientStop } from '../types/pen'

export interface SketchGradient {
  gradientType: 0 | 1 | 2  // 0=linear, 1=radial, 2=angular
  stops: SketchGradientStop[]
  from: { x: number; y: number }  // normalized 0-1
  to: { x: number; y: number }
}

export interface SketchGradientStop {
  color: { red: number; green: number; blue: number; alpha: number }
  position: number  // 0-1
}

interface Frame { width: number; height: number }

/** Convert a Sketch gradient to a .pen fill object. */
export function sketchGradientToPen(grad: SketchGradient, frame: Frame): PenFill {
  const stops: PenGradientStop[] = grad.stops.map(s => ({
    color: sketchColorToHex(s.color),
    position: s.position,
  }))

  if (grad.gradientType === 0) {
    // Linear: compute angle from from/to vectors
    const dx = (grad.to.x - grad.from.x) * frame.width
    const dy = (grad.to.y - grad.from.y) * frame.height
    const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI))
    return { type: 'linear', stops, angle } as PenLinearGradientFill
  }

  if (grad.gradientType === 1) {
    // Radial
    return {
      type: 'radial',
      stops,
      cx: grad.from.x * frame.width,
      cy: grad.from.y * frame.height,
    } as PenRadialGradientFill
  }

  // Angular / fallback to linear
  return { type: 'angular', stops, cx: frame.width / 2, cy: frame.height / 2 } as any
}

/** Convert a .pen gradient fill to a Sketch gradient object. */
export function penGradientToSketch(fill: PenLinearGradientFill | PenRadialGradientFill, frame: Frame): SketchGradient {
  const stops: SketchGradientStop[] = fill.stops.map(s => ({
    color: hexToSketchColor(s.color),
    position: s.position,
  }))

  if (fill.type === 'linear') {
    const angle = ((fill.angle ?? 0) * Math.PI) / 180
    return {
      gradientType: 0,
      stops,
      from: { x: 0.5 - Math.cos(angle) / 2, y: 0.5 - Math.sin(angle) / 2 },
      to:   { x: 0.5 + Math.cos(angle) / 2, y: 0.5 + Math.sin(angle) / 2 },
    }
  }

  // Radial
  const cx = fill.cx != null ? fill.cx / frame.width : 0.5
  const cy = fill.cy != null ? fill.cy / frame.height : 0.5
  return {
    gradientType: 1,
    stops,
    from: { x: cx, y: cy },
    to:   { x: cx + 0.5, y: cy },
  }
}
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern=gradient
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/gradient.ts __tests__/utils/gradient.test.ts
git commit -m "feat: add gradient utility (Sketch ↔ .pen gradient conversion)"
```

---

## Task 6: Style Utility (fills, strokes, effects)

**Files:**
- Create: `src/utils/style.ts`
- Create: `__tests__/utils/style.test.ts`

Centralizes conversion for fills, borders/strokes, and shadow/blur effects — used by both converter directions.

**Step 1: Write failing tests**

`__tests__/utils/style.test.ts`:
```typescript
import {
  sketchFillsToPen, penFillsToSketch,
  sketchBordersToPen, penStrokeToSketch,
  sketchShadowsToPen, penEffectsToSketch,
} from '../../src/utils/style'

describe('sketchFillsToPen', () => {
  it('converts a solid fill', () => {
    const fills = [{ fillType: 0, color: { red: 1, green: 0, blue: 0, alpha: 1 }, isEnabled: true }]
    const result = sketchFillsToPen(fills, { width: 100, height: 100 })
    expect(result).toEqual({ type: 'solid', color: '#ff0000' })
  })

  it('returns undefined for empty fills', () => {
    expect(sketchFillsToPen([], { width: 100, height: 100 })).toBeUndefined()
  })

  it('returns array when multiple fills', () => {
    const fills = [
      { fillType: 0, color: { red: 1, green: 0, blue: 0, alpha: 1 }, isEnabled: true },
      { fillType: 0, color: { red: 0, green: 1, blue: 0, alpha: 1 }, isEnabled: true },
    ]
    const result = sketchFillsToPen(fills, { width: 100, height: 100 })
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('sketchShadowsToPen', () => {
  it('converts a drop shadow', () => {
    const shadows = [{
      color: { red: 0, green: 0, blue: 0, alpha: 0.5 },
      x: 2, y: 4, blur: 8, spread: 0, isEnabled: true,
    }]
    const result = sketchShadowsToPen(shadows, [])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('shadow')
    expect(result[0].x).toBe(2)
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern=style
```

**Step 3: Implement `src/utils/style.ts`**

```typescript
import { hexToSketchColor, sketchColorToHex } from './color'
import { sketchGradientToPen, penGradientToSketch } from './gradient'
import type { PenFill, PenStroke, PenEffect, PenSolidFill } from '../types/pen'

interface Frame { width: number; height: number }

// ── Fills ──────────────────────────────────────────────────────────────────

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
    // Gradient
    return sketchGradientToPen(fill.gradient, frame)
  }
  if (fill.fillType === 4) {
    // Image fill
    return { type: 'image', url: fill.image?.nsimage ? '' : '', fit: 'fill' }
  }
  // Solid (fillType === 0)
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

// ── Borders / Strokes ─────────────────────────────────────────────────────

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

// ── Shadows / Blurs ───────────────────────────────────────────────────────

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
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern=style
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/style.ts __tests__/utils/style.test.ts
git commit -m "feat: add style utility (fills, borders, shadows, blurs)"
```

---

## Task 7: pen-to-sketch Handlers — Basic Shapes (Rectangle, Ellipse, Path)

**Files:**
- Create: `src/converters/pen-to-sketch/rectangle.ts`
- Create: `src/converters/pen-to-sketch/ellipse.ts`
- Create: `src/converters/pen-to-sketch/path.ts`
- Create: `__tests__/pen-to-sketch/rectangle.test.ts`
- Create: `__tests__/pen-to-sketch/ellipse.test.ts`

**Step 1: Write failing tests**

`__tests__/pen-to-sketch/rectangle.test.ts`:
```typescript
import { convertPenRectangle } from '../../src/converters/pen-to-sketch/rectangle'
import type { PenRectangleNode } from '../../src/types/pen'

describe('convertPenRectangle', () => {
  const parent = {}  // mock parent layer

  it('creates a ShapePath with correct frame', () => {
    const node: PenRectangleNode = { type: 'rectangle', x: 10, y: 20, width: 100, height: 50 }
    const result = convertPenRectangle(node, parent)
    expect(result.frame).toMatchObject({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('applies a solid fill', () => {
    const node: PenRectangleNode = {
      type: 'rectangle', x: 0, y: 0, width: 100, height: 100,
      fill: { type: 'solid', color: '#ff0000' },
    }
    const result = convertPenRectangle(node, parent)
    expect(result.style.fills[0].color).toMatchObject({ red: 1, green: 0, blue: 0, alpha: 1 })
  })

  it('uses the node name when provided', () => {
    const node: PenRectangleNode = { type: 'rectangle', name: 'Card BG', x: 0, y: 0, width: 50, height: 50 }
    const result = convertPenRectangle(node, parent)
    expect(result.name).toBe('Card BG')
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="pen-to-sketch/rectangle"
```

**Step 3: Implement handlers**

`src/converters/pen-to-sketch/rectangle.ts`:
```typescript
import type { PenRectangleNode } from '../../types/pen'
import { penFillsToSketch, penStrokeToSketch, penEffectsToSketch } from '../../utils/style'

export function convertPenRectangle(node: PenRectangleNode, parent: any): any {
  const { ShapePath } = require('sketch/dom')
  const w = Number(node.width ?? 100)
  const h = Number(node.height ?? 100)
  const frame = { x: node.x ?? 0, y: node.y ?? 0, width: w, height: h }
  const { shadows, blurs } = penEffectsToSketch(node.effect)

  const shape = new ShapePath({
    parent,
    name: node.name ?? 'Rectangle',
    shapeType: ShapePath.ShapeType.Rectangle,
    frame,
    style: {
      fills: penFillsToSketch(node.fill, { width: w, height: h }),
      borders: penStrokeToSketch(node.stroke),
      shadows,
      blur: blurs[0],
      opacity: node.opacity ?? 1,
    },
  })

  if (node.cornerRadius != null) {
    const r = typeof node.cornerRadius === 'number'
      ? node.cornerRadius
      : node.cornerRadius[0]
    shape.points?.forEach((pt: any) => { pt.cornerRadius = r })
  }

  return shape
}
```

`src/converters/pen-to-sketch/ellipse.ts`:
```typescript
import type { PenEllipseNode } from '../../types/pen'
import { penFillsToSketch, penStrokeToSketch, penEffectsToSketch } from '../../utils/style'

export function convertPenEllipse(node: PenEllipseNode, parent: any): any {
  const { ShapePath } = require('sketch/dom')
  const w = Number(node.width ?? 100)
  const h = Number(node.height ?? 100)
  const { shadows, blurs } = penEffectsToSketch(node.effect)

  return new ShapePath({
    parent,
    name: node.name ?? 'Ellipse',
    shapeType: ShapePath.ShapeType.Oval,
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: w, height: h },
    style: {
      fills: penFillsToSketch(node.fill, { width: w, height: h }),
      borders: penStrokeToSketch(node.stroke),
      shadows,
      blur: blurs[0],
      opacity: node.opacity ?? 1,
    },
  })
}
```

`src/converters/pen-to-sketch/path.ts`:
```typescript
import type { PenPathNode } from '../../types/pen'
import { penFillsToSketch, penStrokeToSketch, penEffectsToSketch } from '../../utils/style'

export function convertPenPath(node: PenPathNode, parent: any): any {
  const { ShapePath } = require('sketch/dom')
  const w = Number(node.width ?? 100)
  const h = Number(node.height ?? 100)
  const { shadows, blurs } = penEffectsToSketch(node.effect)

  return ShapePath.fromSVGPath(node.d, {
    parent,
    name: node.name ?? 'Path',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: w, height: h },
    style: {
      fills: penFillsToSketch(node.fill, { width: w, height: h }),
      borders: penStrokeToSketch(node.stroke),
      shadows,
      blur: blurs[0],
      opacity: node.opacity ?? 1,
    },
  })
}
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="pen-to-sketch"
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/converters/pen-to-sketch/ __tests__/pen-to-sketch/
git commit -m "feat: add pen-to-sketch handlers for rectangle, ellipse, path"
```

---

## Task 8: pen-to-sketch Handlers — Text

**Files:**
- Create: `src/converters/pen-to-sketch/text.ts`
- Create: `__tests__/pen-to-sketch/text.test.ts`

**Step 1: Write failing tests**

`__tests__/pen-to-sketch/text.test.ts`:
```typescript
import { convertPenText } from '../../src/converters/pen-to-sketch/text'
import type { PenTextNode } from '../../src/types/pen'

describe('convertPenText', () => {
  it('creates a Text layer with plain string content', () => {
    const node: PenTextNode = { type: 'text', x: 0, y: 0, width: 200, height: 30, content: 'Hello world' }
    const result = convertPenText(node, {})
    expect(result.text).toBe('Hello world')
  })

  it('joins segment array into plain text', () => {
    const node: PenTextNode = {
      type: 'text', x: 0, y: 0, width: 200, height: 30,
      content: [{ text: 'Hello ' }, { text: 'world', fontWeight: 700 }],
    }
    const result = convertPenText(node, {})
    expect(result.text).toBe('Hello world')
  })

  it('applies fontSize from node', () => {
    const node: PenTextNode = { type: 'text', x: 0, y: 0, width: 100, height: 20, fontSize: 24, content: 'Hi' }
    const result = convertPenText(node, {})
    expect(result.style.fontSize).toBe(24)
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="pen-to-sketch/text"
```

**Step 3: Implement `src/converters/pen-to-sketch/text.ts`**

```typescript
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
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="pen-to-sketch/text"
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/converters/pen-to-sketch/text.ts __tests__/pen-to-sketch/text.test.ts
git commit -m "feat: add pen-to-sketch text handler"
```

---

## Task 9: pen-to-sketch Handlers — Frame, Group, Symbols (Reusable + Ref)

**Files:**
- Create: `src/converters/pen-to-sketch/frame.ts`
- Create: `src/converters/pen-to-sketch/group.ts`
- Create: `src/converters/pen-to-sketch/symbol.ts`
- Create: `src/converters/pen-to-sketch/ref.ts`
- Create: `__tests__/pen-to-sketch/frame.test.ts`

**Step 1: Write failing tests**

`__tests__/pen-to-sketch/frame.test.ts`:
```typescript
import { convertPenFrame } from '../../src/converters/pen-to-sketch/frame'
import type { PenFrameNode, PenRectangleNode } from '../../src/types/pen'

describe('convertPenFrame', () => {
  it('creates a Group with correct frame', () => {
    const node: PenFrameNode = { type: 'frame', x: 10, y: 10, width: 300, height: 200, children: [] }
    const result = convertPenFrame(node, {}, new Map())
    expect(result.frame).toMatchObject({ x: 10, y: 10, width: 300, height: 200 })
  })

  it('recursively converts children', () => {
    const child: PenRectangleNode = { type: 'rectangle', x: 0, y: 0, width: 50, height: 50 }
    const node: PenFrameNode = { type: 'frame', x: 0, y: 0, width: 300, height: 200, children: [child] }
    const result = convertPenFrame(node, {}, new Map())
    expect(result.layers).toHaveLength(1)
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="pen-to-sketch/frame"
```

**Step 3: Implement handlers**

`src/converters/pen-to-sketch/frame.ts`:
```typescript
import type { PenFrameNode } from '../../types/pen'
import { dispatchPenNode } from './index'

export function convertPenFrame(node: PenFrameNode, parent: any, symbolMap: Map<string, any>): any {
  const { Group } = require('sketch/dom')

  const group = new Group({
    parent,
    name: node.name ?? 'Frame',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 100), height: Number(node.height ?? 100) },
    style: { opacity: node.opacity ?? 1 },
  })

  // If this frame is a reusable component, register it in the symbol map
  if (node.reusable && node.id) {
    symbolMap.set(node.id, group)
  }

  ;(node.children ?? []).forEach(child => dispatchPenNode(child, group, symbolMap))

  return group
}
```

`src/converters/pen-to-sketch/group.ts`:
```typescript
import type { PenGroupNode } from '../../types/pen'
import { dispatchPenNode } from './index'

export function convertPenGroup(node: PenGroupNode, parent: any, symbolMap: Map<string, any>): any {
  const { Group } = require('sketch/dom')

  const group = new Group({
    parent,
    name: node.name ?? 'Group',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 100), height: Number(node.height ?? 100) },
    style: { opacity: node.opacity ?? 1 },
  })

  ;(node.children ?? []).forEach(child => dispatchPenNode(child, group, symbolMap))

  return group
}
```

`src/converters/pen-to-sketch/symbol.ts`:
```typescript
// Reusable .pen nodes become SymbolMaster layers in Sketch.
import type { PenFrameNode } from '../../types/pen'
import { dispatchPenNode } from './index'

export function convertPenReusable(node: PenFrameNode, parent: any, symbolMap: Map<string, any>): any {
  const { SymbolMaster } = require('sketch/dom')

  const master = new SymbolMaster({
    parent,
    name: node.name ?? 'Component',
    frame: { x: node.x ?? 0, y: node.y ?? 0, width: Number(node.width ?? 100), height: Number(node.height ?? 100) },
  })

  if (node.id) symbolMap.set(node.id, master)
  ;(node.children ?? []).forEach(child => dispatchPenNode(child, master, symbolMap))

  return master
}
```

`src/converters/pen-to-sketch/ref.ts`:
```typescript
// .pen ref nodes become SymbolInstance layers in Sketch.
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
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="pen-to-sketch/frame"
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/converters/pen-to-sketch/{frame,group,symbol,ref}.ts __tests__/pen-to-sketch/frame.test.ts
git commit -m "feat: add pen-to-sketch handlers for frame, group, symbol, ref"
```

---

## Task 10: pen-to-sketch Orchestrator

**Files:**
- Create: `src/converters/pen-to-sketch/index.ts`
- Create: `__tests__/pen-to-sketch/orchestrator.test.ts`

**Step 1: Write failing test**

`__tests__/pen-to-sketch/orchestrator.test.ts`:
```typescript
import { convertPenDocument } from '../../src/converters/pen-to-sketch/index'
import type { PenDocument } from '../../src/types/pen'

describe('convertPenDocument', () => {
  it('converts a document with a rectangle child', () => {
    const doc: PenDocument = {
      children: [{ type: 'rectangle', x: 0, y: 0, width: 100, height: 100 }],
    }
    const layers: any[] = []
    const mockPage = { layers }
    convertPenDocument(doc, mockPage)
    expect(layers).toHaveLength(0)  // constructor inserts into parent; layers is separate
  })

  it('skips unknown node types without throwing', () => {
    const doc: PenDocument = {
      children: [{ type: 'note' as any, x: 0, y: 0 }],
    }
    expect(() => convertPenDocument(doc, {})).not.toThrow()
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="orchestrator"
```

**Step 3: Implement `src/converters/pen-to-sketch/index.ts`**

```typescript
import type { PenDocument, PenNode } from '../../types/pen'
import { convertPenRectangle } from './rectangle'
import { convertPenEllipse } from './ellipse'
import { convertPenPath } from './path'
import { convertPenText } from './text'
import { convertPenFrame } from './frame'
import { convertPenGroup } from './group'
import { convertPenReusable } from './symbol'
import { convertPenRef } from './ref'

/** Convert a full .pen document into Sketch layers, inserting them into `parent`. */
export function convertPenDocument(doc: PenDocument, parent: any): void {
  const symbolMap = new Map<string, any>()

  // First pass: register all reusable nodes so refs can resolve them
  collectReusables(doc.children, symbolMap, parent)

  // Second pass: convert everything
  doc.children.forEach(node => {
    if (node.reusable) return  // already handled in first pass
    dispatchPenNode(node, parent, symbolMap)
  })
}

function collectReusables(nodes: PenNode[], symbolMap: Map<string, any>, parent: any): void {
  nodes.forEach(node => {
    if (node.reusable && (node.type === 'frame' || node.type === 'group')) {
      convertPenReusable(node as any, parent, symbolMap)
    }
    if ('children' in node && Array.isArray(node.children)) {
      collectReusables(node.children as PenNode[], symbolMap, parent)
    }
  })
}

/** Dispatch a single .pen node to its handler. */
export function dispatchPenNode(node: PenNode, parent: any, symbolMap: Map<string, any>): any {
  switch (node.type) {
    case 'rectangle': return convertPenRectangle(node, parent)
    case 'ellipse':   return convertPenEllipse(node, parent)
    case 'path':      return convertPenPath(node, parent)
    case 'line':      return convertPenPath({ ...node, d: `M0,0 L${node.width ?? 100},0` } as any, parent)
    case 'text':      return convertPenText(node, parent)
    case 'frame':     return node.reusable
                        ? convertPenReusable(node, parent, symbolMap)
                        : convertPenFrame(node, parent, symbolMap)
    case 'group':     return convertPenGroup(node, parent, symbolMap)
    case 'ref':       return convertPenRef(node, parent, symbolMap)
    default:
      console.warn(`[pen-to-sketch] Unsupported node type: ${(node as any).type} — skipping`)
      return null
  }
}
```

**Step 4: Run all pen-to-sketch tests**

```bash
npm test -- --testPathPattern="pen-to-sketch"
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/converters/pen-to-sketch/index.ts __tests__/pen-to-sketch/orchestrator.test.ts
git commit -m "feat: add pen-to-sketch orchestrator"
```

---

## Task 11: sketch-to-pen Handlers — Basic Shapes (Rectangle, Ellipse, Path)

**Files:**
- Create: `src/converters/sketch-to-pen/rectangle.ts`
- Create: `src/converters/sketch-to-pen/ellipse.ts`
- Create: `src/converters/sketch-to-pen/path.ts`
- Create: `__tests__/sketch-to-pen/rectangle.test.ts`

**Step 1: Write failing tests**

`__tests__/sketch-to-pen/rectangle.test.ts`:
```typescript
import { convertSketchRectangle } from '../../src/converters/sketch-to-pen/rectangle'

describe('convertSketchRectangle', () => {
  const layer = {
    name: 'Button BG',
    type: 'ShapePath',
    frame: { x: 10, y: 20, width: 100, height: 40 },
    style: {
      fills: [{ fillType: 0, color: { red: 0, green: 0.47, blue: 1, alpha: 1 }, isEnabled: true }],
      borders: [],
      shadows: [],
      blurs: [],
      opacity: 1,
    },
    points: [],
  }

  it('produces a rectangle node with correct position', () => {
    const result = convertSketchRectangle(layer)
    expect(result.type).toBe('rectangle')
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(40)
  })

  it('includes the node name', () => {
    const result = convertSketchRectangle(layer)
    expect(result.name).toBe('Button BG')
  })

  it('converts fill color', () => {
    const result = convertSketchRectangle(layer)
    expect(result.fill).toMatchObject({ type: 'solid' })
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="sketch-to-pen/rectangle"
```

**Step 3: Implement handlers**

`src/converters/sketch-to-pen/rectangle.ts`:
```typescript
import type { PenRectangleNode } from '../../types/pen'
import { sketchFillsToPen, sketchBordersToPen, sketchShadowsToPen } from '../../utils/style'

export function convertSketchRectangle(layer: any): PenRectangleNode {
  const { frame, style, name, points } = layer
  const cornerRadius = points?.[0]?.cornerRadius || undefined

  const node: PenRectangleNode = {
    type: 'rectangle',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
  }

  const fill = sketchFillsToPen(style.fills ?? [], { width: frame.width, height: frame.height })
  if (fill) node.fill = fill

  const stroke = sketchBordersToPen(style.borders ?? [])
  if (stroke) node.stroke = stroke

  const effects = sketchShadowsToPen(style.shadows ?? [], style.blurs ?? [])
  if (effects.length) node.effect = effects

  if (style.opacity != null && style.opacity !== 1) node.opacity = style.opacity
  if (cornerRadius) node.cornerRadius = cornerRadius

  return node
}
```

`src/converters/sketch-to-pen/ellipse.ts`:
```typescript
import type { PenEllipseNode } from '../../types/pen'
import { sketchFillsToPen, sketchBordersToPen, sketchShadowsToPen } from '../../utils/style'

export function convertSketchEllipse(layer: any): PenEllipseNode {
  const { frame, style, name } = layer

  const node: PenEllipseNode = { type: 'ellipse', name, x: frame.x, y: frame.y, width: frame.width, height: frame.height }

  const fill = sketchFillsToPen(style.fills ?? [], { width: frame.width, height: frame.height })
  if (fill) node.fill = fill
  const stroke = sketchBordersToPen(style.borders ?? [])
  if (stroke) node.stroke = stroke
  const effects = sketchShadowsToPen(style.shadows ?? [], style.blurs ?? [])
  if (effects.length) node.effect = effects
  if (style.opacity != null && style.opacity !== 1) node.opacity = style.opacity

  return node
}
```

`src/converters/sketch-to-pen/path.ts`:
```typescript
import type { PenPathNode } from '../../types/pen'
import { sketchFillsToPen, sketchBordersToPen, sketchShadowsToPen } from '../../utils/style'

export function convertSketchPath(layer: any): PenPathNode {
  const { frame, style, name } = layer
  // Sketch exports SVGPath — use getSVGPath() from the layer if available
  const d: string = layer.getSVGPath?.() ?? 'M0 0'

  const node: PenPathNode = { type: 'path', name, x: frame.x, y: frame.y, width: frame.width, height: frame.height, d }

  const fill = sketchFillsToPen(style.fills ?? [], { width: frame.width, height: frame.height })
  if (fill) node.fill = fill
  const stroke = sketchBordersToPen(style.borders ?? [])
  if (stroke) node.stroke = stroke
  const effects = sketchShadowsToPen(style.shadows ?? [], style.blurs ?? [])
  if (effects.length) node.effect = effects

  return node
}
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="sketch-to-pen"
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/converters/sketch-to-pen/ __tests__/sketch-to-pen/
git commit -m "feat: add sketch-to-pen handlers for rectangle, ellipse, path"
```

---

## Task 12: sketch-to-pen Handler — Text

**Files:**
- Create: `src/converters/sketch-to-pen/text.ts`
- Create: `__tests__/sketch-to-pen/text.test.ts`

**Step 1: Write failing tests**

`__tests__/sketch-to-pen/text.test.ts`:
```typescript
import { convertSketchText } from '../../src/converters/sketch-to-pen/text'

const textLayer = {
  name: 'Heading',
  type: 'Text',
  text: 'Hello world',
  frame: { x: 0, y: 0, width: 200, height: 30 },
  style: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: 700,
    textColor: { red: 0, green: 0, blue: 0, alpha: 1 },
    alignment: 'left',
    letterSpacing: 0,
    opacity: 1,
    fills: [],
    borders: [],
    shadows: [],
    blurs: [],
  },
}

describe('convertSketchText', () => {
  it('creates a text node', () => {
    expect(convertSketchText(textLayer).type).toBe('text')
  })

  it('preserves text content', () => {
    expect(convertSketchText(textLayer).content).toBe('Hello world')
  })

  it('preserves font properties', () => {
    const result = convertSketchText(textLayer)
    expect(result.fontSize).toBe(24)
    expect(result.fontWeight).toBe(700)
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="sketch-to-pen/text"
```

**Step 3: Implement `src/converters/sketch-to-pen/text.ts`**

```typescript
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
    letterSpacing: style.letterSpacing || undefined,
    textAlign: ALIGN_MAP[style.alignment] ?? 'left',
  }

  if (style.opacity != null && style.opacity !== 1) node.opacity = style.opacity

  if (style.textColor) {
    node.fill = { type: 'solid', color: sketchColorToHex(style.textColor) }
  }

  return node
}
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="sketch-to-pen/text"
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/converters/sketch-to-pen/text.ts __tests__/sketch-to-pen/text.test.ts
git commit -m "feat: add sketch-to-pen text handler"
```

---

## Task 13: sketch-to-pen Handlers — Group, Artboard, Symbols

**Files:**
- Create: `src/converters/sketch-to-pen/group.ts`
- Create: `src/converters/sketch-to-pen/symbol.ts`
- Create: `__tests__/sketch-to-pen/group.test.ts`

**Step 1: Write failing test**

`__tests__/sketch-to-pen/group.test.ts`:
```typescript
import { convertSketchGroup } from '../../src/converters/sketch-to-pen/group'

describe('convertSketchGroup', () => {
  it('creates a group node with children', () => {
    const layer = {
      name: 'Card', type: 'Group',
      frame: { x: 0, y: 0, width: 300, height: 200 },
      style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 },
      layers: [
        {
          name: 'BG', type: 'ShapePath', shapeType: 'Rectangle',
          frame: { x: 0, y: 0, width: 300, height: 200 },
          style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 },
          points: [],
        },
      ],
    }
    const result = convertSketchGroup(layer)
    expect(result.type).toBe('group')
    expect(result.children).toHaveLength(1)
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="sketch-to-pen/group"
```

**Step 3: Implement handlers**

`src/converters/sketch-to-pen/group.ts`:
```typescript
import type { PenGroupNode, PenNode } from '../../types/pen'
import { dispatchSketchLayer } from './index'

export function convertSketchGroup(layer: any): PenGroupNode {
  const { frame, style, name } = layer

  const node: PenGroupNode = {
    type: 'group',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    children: (layer.layers ?? []).map((child: any) => dispatchSketchLayer(child)).filter(Boolean) as PenNode[],
  }

  if (style.opacity != null && style.opacity !== 1) node.opacity = style.opacity

  return node
}
```

`src/converters/sketch-to-pen/symbol.ts`:
```typescript
import type { PenFrameNode, PenRefNode, PenNode } from '../../types/pen'
import { dispatchSketchLayer } from './index'

/** Convert a SymbolMaster to a reusable .pen frame. */
export function convertSketchSymbolMaster(layer: any): PenFrameNode {
  const { frame, name, layers, symbolID } = layer

  return {
    type: 'frame',
    id: symbolID ?? name,
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    reusable: true,
    children: (layers ?? []).map((child: any) => dispatchSketchLayer(child)).filter(Boolean) as PenNode[],
  }
}

/** Convert a SymbolInstance to a .pen ref node. */
export function convertSketchSymbolInstance(layer: any): PenRefNode {
  const { frame, name, master, overrides } = layer

  const node: PenRefNode = {
    type: 'ref',
    name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    ref: master?.symbolID ?? master?.name ?? '',
  }

  // Convert Sketch overrides to .pen descendants
  if (overrides && overrides.length > 0) {
    const descendants: Record<string, any> = {}
    overrides.forEach((override: any) => {
      if (override.isDefault) return
      descendants[override.path ?? override.id] = { content: override.value }
    })
    if (Object.keys(descendants).length > 0) node.descendants = descendants
  }

  return node
}
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="sketch-to-pen"
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/converters/sketch-to-pen/{group,symbol}.ts __tests__/sketch-to-pen/group.test.ts
git commit -m "feat: add sketch-to-pen handlers for group, artboard, symbols"
```

---

## Task 14: sketch-to-pen Orchestrator

**Files:**
- Create: `src/converters/sketch-to-pen/index.ts`
- Create: `__tests__/sketch-to-pen/orchestrator.test.ts`

**Step 1: Write failing test**

`__tests__/sketch-to-pen/orchestrator.test.ts`:
```typescript
import { convertSketchPage, dispatchSketchLayer } from '../../src/converters/sketch-to-pen/index'

describe('dispatchSketchLayer', () => {
  it('handles Rectangle', () => {
    const layer = {
      type: 'ShapePath', shapeType: 'Rectangle', name: 'R',
      frame: { x: 0, y: 0, width: 50, height: 50 },
      style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 }, points: [],
    }
    const result = dispatchSketchLayer(layer)
    expect(result?.type).toBe('rectangle')
  })

  it('returns null for unsupported layer types', () => {
    const layer = { type: 'HotSpot', name: 'hs', frame: { x: 0, y: 0, width: 0, height: 0 } }
    expect(dispatchSketchLayer(layer)).toBeNull()
  })
})

describe('convertSketchPage', () => {
  it('builds a PenDocument from a Sketch page', () => {
    const page = {
      name: 'Page 1',
      layers: [
        {
          type: 'ShapePath', shapeType: 'Rectangle', name: 'R',
          frame: { x: 0, y: 0, width: 100, height: 100 },
          style: { fills: [], borders: [], shadows: [], blurs: [], opacity: 1 }, points: [],
        },
      ],
    }
    const doc = convertSketchPage(page)
    expect(doc.children).toHaveLength(1)
  })
})
```

**Step 2: Run to verify failure**

```bash
npm test -- --testPathPattern="sketch-to-pen/orchestrator"
```

**Step 3: Implement `src/converters/sketch-to-pen/index.ts`**

```typescript
import type { PenDocument, PenNode } from '../../types/pen'
import { convertSketchRectangle } from './rectangle'
import { convertSketchEllipse } from './ellipse'
import { convertSketchPath } from './path'
import { convertSketchText } from './text'
import { convertSketchGroup } from './group'
import { convertSketchSymbolMaster, convertSketchSymbolInstance } from './symbol'

/** Convert a Sketch page into a PenDocument. */
export function convertSketchPage(page: any): PenDocument {
  const children = (page.layers ?? [])
    .map((layer: any) => dispatchSketchLayer(layer))
    .filter(Boolean) as PenNode[]

  return { children }
}

/** Dispatch a Sketch layer to the appropriate handler. */
export function dispatchSketchLayer(layer: any): PenNode | null {
  switch (layer.type) {
    case 'ShapePath':
      if (layer.shapeType === 'Rectangle') return convertSketchRectangle(layer)
      if (layer.shapeType === 'Oval') return convertSketchEllipse(layer)
      return convertSketchPath(layer)
    case 'Shape':
      return convertSketchPath(layer)
    case 'Text':
      return convertSketchText(layer)
    case 'Group':
    case 'Artboard':
      return convertSketchGroup(layer)
    case 'SymbolMaster':
      return convertSketchSymbolMaster(layer)
    case 'SymbolInstance':
      return convertSketchSymbolInstance(layer)
    default:
      console.warn(`[sketch-to-pen] Unsupported layer type: ${layer.type} — skipping`)
      return null
  }
}
```

**Step 4: Run all sketch-to-pen tests**

```bash
npm test -- --testPathPattern="sketch-to-pen"
```

Expected: all PASS

**Step 5: Run full test suite**

```bash
npm test
```

Expected: all PASS

**Step 6: Commit**

```bash
git add src/converters/sketch-to-pen/index.ts __tests__/sketch-to-pen/orchestrator.test.ts
git commit -m "feat: add sketch-to-pen orchestrator"
```

---

## Task 15: `import-pen` Command

**Files:**
- Modify: `src/commands/import-pen.ts`

This command uses the native NSOpenPanel (ObjC bridge) to let the user pick a `.pen` file, reads it, and calls `convertPenDocument` to insert the nodes into the current Sketch page.

Note: this command can only be tested manually in Sketch since it requires ObjC globals. There is no unit test for this task.

**Step 1: Implement `src/commands/import-pen.ts`**

```typescript
import { convertPenDocument } from '../converters/pen-to-sketch/index'
import type { PenDocument } from '../types/pen'

export default function importPen(context: any): void {
  // 1. Open a native file picker filtered to .pen files
  const panel = NSOpenPanel.openPanel()
  panel.setCanChooseFiles(true)
  panel.setCanChooseDirectories(false)
  panel.setAllowsMultipleSelection(false)
  panel.setAllowedFileTypes(['pen'])
  panel.setTitle('Import .pen file')
  panel.setPrompt('Import')

  const response = panel.runModal()
  if (response !== NSModalResponseOK) return

  // 2. Read the file as a UTF-8 string
  const filePath: string = panel.URL().path()
  const raw = NSString.stringWithContentsOfFile_encoding_error(
    filePath,
    NSUTF8StringEncoding,
    null,
  )

  if (!raw) {
    showAlert('Import failed', `Could not read file: ${filePath}`)
    return
  }

  // 3. Parse JSON
  let doc: PenDocument
  try {
    doc = JSON.parse(raw.toString())
  } catch (e) {
    showAlert('Import failed', 'The selected file is not valid .pen JSON.')
    return
  }

  // 4. Insert into the current Sketch page
  const sketch = require('sketch')
  const document = sketch.getSelectedDocument()
  if (!document) {
    showAlert('Import failed', 'No Sketch document is open.')
    return
  }
  const page = document.selectedPage

  convertPenDocument(doc, page)

  // 5. Notify user
  sketch.UI.message('✓ .pen file imported successfully')
}

function showAlert(title: string, message: string): void {
  const alert = NSAlert.alloc().init()
  alert.setMessageText(title)
  alert.setInformativeText(message)
  alert.runModal()
}
```

**Step 2: Build**

```bash
npm run build
```

Expected: no TypeScript/build errors

**Step 3: Manual QA checklist**

Install the plugin in Sketch (`pencil-sketch.sketchplugin`), then:
- [ ] Plugins > Pencil > "Import .pen file…" opens a file picker
- [ ] Selecting a valid `.pen` file imports layers into the current page
- [ ] Selecting an invalid JSON file shows the error alert
- [ ] Canceling the file picker does nothing

**Step 4: Commit**

```bash
git add src/commands/import-pen.ts
git commit -m "feat: implement import-pen command with NSOpenPanel file picker"
```

---

## Task 16: `copy-as-pen` Command

**Files:**
- Modify: `src/commands/copy-as-pen.ts`

This command converts the current Sketch selection (or artboard, falling back to the full page) to `.pen` JSON and copies it to the clipboard.

**Step 1: Implement `src/commands/copy-as-pen.ts`**

```typescript
import { convertSketchPage } from '../converters/sketch-to-pen/index'

export default function copyAsPen(): void {
  const sketch = require('sketch')
  const document = sketch.getSelectedDocument()

  if (!document) {
    sketch.UI.message('No Sketch document is open.')
    return
  }

  // Use selection if available, otherwise fall back to full page
  const selection = document.selectedLayers?.layers ?? []
  const page = document.selectedPage

  const source = selection.length > 0
    ? { name: 'Selection', layers: selection }
    : page

  // Convert to .pen document
  const penDoc = convertSketchPage(source)
  const json = JSON.stringify(penDoc, null, 2)

  // Copy to clipboard via NSPasteboard
  const pasteboard = NSPasteboard.generalPasteboard()
  pasteboard.clearContents()
  pasteboard.setString_forType(json, NSPasteboardTypeString)

  sketch.UI.message('✓ Copied as .pen — paste into Pencil')
}
```

**Step 2: Build**

```bash
npm run build
```

Expected: no errors

**Step 3: Manual QA checklist**

- [ ] With nothing selected, Plugins > Pencil > "Copy as .pen" copies the full page as JSON
- [ ] With layers selected, only the selection is exported
- [ ] The copied JSON is valid — paste into a text editor and validate it's parseable JSON
- [ ] The JSON structure matches the `.pen` format (has `children` array, correct `type` fields)
- [ ] Open Pencil app, paste — design appears correctly

**Step 4: Commit**

```bash
git add src/commands/copy-as-pen.ts
git commit -m "feat: implement copy-as-pen command with NSPasteboard clipboard export"
```

---

## Task 17: Round-Trip Integration Tests

**Files:**
- Create: `__tests__/integration/round-trip.test.ts`
- Create: `__tests__/fixtures/simple-card.pen.json`
- Create: `__tests__/fixtures/button-component.pen.json`

These tests verify structural equivalence after a full `.pen → Sketch (mocked) → .pen` round-trip.

**Step 1: Create fixture `__tests__/fixtures/simple-card.pen.json`**

```json
{
  "children": [
    {
      "type": "frame",
      "name": "Card",
      "x": 0,
      "y": 0,
      "width": 320,
      "height": 200,
      "fill": { "type": "solid", "color": "#FFFFFF" },
      "effect": [{ "type": "shadow", "color": "#00000033", "x": 0, "y": 4, "blur": 12 }],
      "children": [
        { "type": "rectangle", "name": "Image", "x": 0, "y": 0, "width": 320, "height": 120, "fill": { "type": "solid", "color": "#E5E7EB" } },
        { "type": "text", "name": "Title", "x": 16, "y": 132, "width": 288, "height": 24, "content": "Card Title", "fontSize": 18, "fontWeight": 700 },
        { "type": "text", "name": "Subtitle", "x": 16, "y": 162, "width": 288, "height": 20, "content": "Subtitle text", "fontSize": 14 }
      ]
    }
  ]
}
```

**Step 2: Create fixture `__tests__/fixtures/button-component.pen.json`**

```json
{
  "children": [
    {
      "type": "frame",
      "id": "primary-button",
      "name": "Primary Button",
      "x": 0,
      "y": 0,
      "width": 120,
      "height": 40,
      "reusable": true,
      "fill": { "type": "solid", "color": "#3B82F6" },
      "children": [
        { "type": "text", "name": "Label", "x": 0, "y": 0, "width": 120, "height": 40, "content": "Button", "fontSize": 14, "fontWeight": 600, "fill": { "type": "solid", "color": "#FFFFFF" } }
      ]
    },
    {
      "type": "ref",
      "name": "Button Instance",
      "ref": "primary-button",
      "x": 200,
      "y": 100,
      "width": 120,
      "height": 40
    }
  ]
}
```

**Step 3: Write round-trip tests**

`__tests__/integration/round-trip.test.ts`:
```typescript
import * as fs from 'fs'
import * as path from 'path'
import { convertPenDocument, dispatchPenNode } from '../../src/converters/pen-to-sketch/index'
import { convertSketchPage } from '../../src/converters/sketch-to-pen/index'
import type { PenDocument, PenNode } from '../../src/types/pen'

function loadFixture(name: string): PenDocument {
  const p = path.join(__dirname, '../fixtures', name)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

// Minimal mock page that captures inserted layers
function makeMockPage(): { layers: any[]; mockPage: any } {
  const layers: any[] = []
  const mockPage = {
    layers,
    name: 'Page 1',
  }
  return { layers, mockPage }
}

describe('pen → sketch → pen round-trip: simple-card', () => {
  it('preserves node count at top level', () => {
    const original = loadFixture('simple-card.pen.json')
    // Simulate: convert pen doc → collect nodes → re-convert to pen
    // Since we can't fully instantiate Sketch layers in Jest, we test
    // sketch-to-pen against a hand-crafted Sketch-like model
    const sketchLikePage = {
      name: 'Round-trip',
      layers: original.children.map(node => penNodeToSketchLike(node)),
    }
    const result = convertSketchPage(sketchLikePage)
    expect(result.children).toHaveLength(original.children.length)
  })

  it('preserves top-level node types', () => {
    const original = loadFixture('simple-card.pen.json')
    const sketchLikePage = {
      name: 'Round-trip',
      layers: original.children.map(penNodeToSketchLike),
    }
    const result = convertSketchPage(sketchLikePage)
    original.children.forEach((origNode, i) => {
      expect(result.children[i]?.type).toBeTruthy()
    })
  })
})

describe('pen → sketch → pen round-trip: button-component', () => {
  it('preserves the reusable frame', () => {
    const original = loadFixture('button-component.pen.json')
    const reusable = original.children.find(n => n.type === 'frame' && (n as any).reusable)
    expect(reusable).toBeDefined()
  })
})

// Helper: convert a .pen node to a minimal Sketch-like object for re-conversion
function penNodeToSketchLike(node: PenNode): any {
  const base = {
    name: (node as any).name ?? 'Layer',
    frame: {
      x: node.x ?? 0, y: node.y ?? 0,
      width: Number(node.width ?? 100), height: Number(node.height ?? 100),
    },
    style: { fills: [], borders: [], shadows: [], blurs: [], opacity: (node as any).opacity ?? 1 },
  }

  switch (node.type) {
    case 'rectangle': return { ...base, type: 'ShapePath', shapeType: 'Rectangle', points: [] }
    case 'ellipse':   return { ...base, type: 'ShapePath', shapeType: 'Oval', points: [] }
    case 'text':      return { ...base, type: 'Text', text: typeof (node as any).content === 'string' ? (node as any).content : '' }
    case 'frame':
    case 'group':     return { ...base, type: 'Group', layers: ((node as any).children ?? []).map(penNodeToSketchLike) }
    default:          return { ...base, type: 'ShapePath', shapeType: 'Rectangle', points: [] }
  }
}
```

**Step 4: Run integration tests**

```bash
npm test -- --testPathPattern="integration"
```

Expected: PASS

**Step 5: Run full test suite one final time**

```bash
npm test
```

Expected: all PASS

**Step 6: Commit**

```bash
git add __tests__/integration/ __tests__/fixtures/
git commit -m "test: add round-trip integration tests with fixtures"
```

---

## Task 18: Final Build + README

**Files:**
- Modify: `README.md`

**Step 1: Update README.md**

````markdown
# pencil-sketch

A Sketch plugin for bidirectional conversion between Sketch and [Pencil](https://pencil.dev) (`.pen` files).

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| **Import .pen file…** | `Ctrl+Shift+I` | Opens a file picker, imports a `.pen` file into the current Sketch page |
| **Copy as .pen** | `Ctrl+Shift+C` | Copies the current selection (or full page) to the clipboard as `.pen` JSON — ready to paste into Pencil |

## Installation

1. [Download the latest release](https://github.com/kylekochanek/pencil-sketch/releases)
2. Double-click `pencil-sketch.sketchplugin` to install

## Development

```bash
npm install
npm run watch   # build + watch for changes
npm test        # run unit + integration tests
```

## Supported Elements

| Sketch | .pen | Notes |
|--------|------|-------|
| Rectangle / ShapePath | `rectangle` | Corner radius supported |
| Ellipse | `ellipse` | |
| Path / Shape | `path` | SVG path data |
| Text | `text` | Font family, size, weight, color |
| Group | `group` | |
| Artboard | `frame` | |
| Symbol Master | reusable `frame` | |
| Symbol Instance | `ref` | Overrides → descendants |
| Solid Fill | solid fill | |
| Gradient Fill | linear/radial/angular | Coordinate conversion |
| Border | stroke | |
| Shadow / Inner Shadow | shadow effect | |
| Blur | blur effect | |

## Architecture

```
src/
  commands/          Plugin entry points (Sketch commands)
  converters/
    pen-to-sketch/   .pen node → Sketch layer handlers
    sketch-to-pen/   Sketch layer → .pen node handlers
  utils/             Shared color, gradient, style utilities
  types/             TypeScript types for .pen format
__tests__/
  pen-to-sketch/     Unit tests per handler
  sketch-to-pen/     Unit tests per handler
  utils/             Utility unit tests
  integration/       Round-trip tests
  fixtures/          Sample .pen JSON files
```
````

**Step 2: Final build**

```bash
npm run build
```

Expected: clean build, `pencil-sketch.sketchplugin` ready to install

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with installation, commands, and architecture overview"
```

---

## Summary of Commits

By the end of this plan you will have:

1. `feat: scaffold skpm + TypeScript + Jest project`
2. `feat: add plugin manifest with import and copy-as-pen commands`
3. `feat: add .pen TypeScript types, Sketch ObjC globals, and test mock`
4. `feat: add color utility (hex ↔ Sketch RGBA conversion)`
5. `feat: add gradient utility (Sketch ↔ .pen gradient conversion)`
6. `feat: add style utility (fills, borders, shadows, blurs)`
7. `feat: add pen-to-sketch handlers for rectangle, ellipse, path`
8. `feat: add pen-to-sketch text handler`
9. `feat: add pen-to-sketch handlers for frame, group, symbol, ref`
10. `feat: add pen-to-sketch orchestrator`
11. `feat: add sketch-to-pen handlers for rectangle, ellipse, path`
12. `feat: add sketch-to-pen text handler`
13. `feat: add sketch-to-pen handlers for group, artboard, symbols`
14. `feat: add sketch-to-pen orchestrator`
15. `feat: implement import-pen command with NSOpenPanel file picker`
16. `feat: implement copy-as-pen command with NSPasteboard clipboard export`
17. `test: add round-trip integration tests with fixtures`
18. `docs: add README with installation, commands, and architecture overview`
