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
