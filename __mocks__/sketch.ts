const sketch = {
  getSelectedDocument: () => null,
  Document: { getSelectedDocument: () => null },
  ShapePath: class {
    constructor(opts: any) { Object.assign(this, opts) }
    static ShapeType = { Rectangle: 'Rectangle', Oval: 'Oval' }
    static fromSVGPath = (d: string, opts: any) => ({ ...opts, d, type: 'ShapePath' })
  },
  Shape: class { constructor(opts: any) { Object.assign(this, opts) } },
  Text: class { constructor(opts: any) { Object.assign(this, opts) } },
  Group: class { constructor(opts: any) { Object.assign(this, opts) } },
  Image: class { constructor(opts: any) { Object.assign(this, opts) } },
  SymbolMaster: class {
    constructor(opts: any) { Object.assign(this, opts) }
    createNewInstance() { return { ...this } }
  },
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
