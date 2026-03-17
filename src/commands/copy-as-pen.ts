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
