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
