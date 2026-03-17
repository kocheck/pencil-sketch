import * as fs from 'fs'
import * as path from 'path'
import { convertSketchPage } from '../../src/converters/sketch-to-pen/index'
import type { PenDocument, PenNode } from '../../src/types/pen'

function loadFixture(name: string): PenDocument {
  const p = path.join(__dirname, '../fixtures', name)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

// Helper: convert a .pen node to a Sketch-like object for re-conversion
function penNodeToSketchLike(node: PenNode): any {
  const base = {
    name: (node as any).name ?? 'Layer',
    frame: {
      x: node.x ?? 0, y: node.y ?? 0,
      width: Number(node.width ?? 100), height: Number(node.height ?? 100),
    },
    style: {
      fills: [],
      borders: [],
      shadows: [],
      blurs: [],
      opacity: (node as any).opacity ?? 1,
    },
  }

  switch (node.type) {
    case 'rectangle':
      return { ...base, type: 'ShapePath', shapeType: 'Rectangle', points: [] }
    case 'ellipse':
      return { ...base, type: 'ShapePath', shapeType: 'Oval', points: [] }
    case 'text':
      return { ...base, type: 'Text', text: typeof (node as any).content === 'string' ? (node as any).content : '' }
    case 'frame':
    case 'group':
      return { ...base, type: 'Group', layers: ((node as any).children ?? []).map(penNodeToSketchLike) }
    default:
      return { ...base, type: 'ShapePath', shapeType: 'Rectangle', points: [] }
  }
}

describe('Round-trip: simple-card', () => {
  it('preserves top-level node count', () => {
    const original = loadFixture('simple-card.pen.json')
    const sketchLikePage = {
      name: 'Page',
      layers: original.children.map(penNodeToSketchLike),
    }
    const result = convertSketchPage(sketchLikePage)
    expect(result.children).toHaveLength(original.children.length)
  })

  it('preserves node types', () => {
    const original = loadFixture('simple-card.pen.json')
    const sketchLikePage = {
      name: 'Page',
      layers: original.children.map(penNodeToSketchLike),
    }
    const result = convertSketchPage(sketchLikePage)
    // Top-level should be a group (frame → Group in sketch → group in pen)
    expect(result.children[0].type).toBe('group')
  })

  it('preserves child count inside card frame', () => {
    const original = loadFixture('simple-card.pen.json')
    const cardNode = original.children[0] as any
    const sketchLikePage = {
      name: 'Page',
      layers: original.children.map(penNodeToSketchLike),
    }
    const result = convertSketchPage(sketchLikePage)
    const resultCard = result.children[0] as any
    expect(resultCard.children).toHaveLength(cardNode.children.length)
  })
})

describe('Round-trip: button-component', () => {
  it('loads fixture without errors', () => {
    expect(() => loadFixture('button-component.pen.json')).not.toThrow()
  })

  it('fixture has a reusable frame and a ref node', () => {
    const doc = loadFixture('button-component.pen.json')
    const reusable = doc.children.find(n => n.type === 'frame' && (n as any).reusable)
    const ref = doc.children.find(n => n.type === 'ref')
    expect(reusable).toBeDefined()
    expect(ref).toBeDefined()
  })
})
