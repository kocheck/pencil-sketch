import type { PenDocument, PenNode } from '../../types/pen'
import { convertSketchRectangle } from './rectangle'
import { convertSketchEllipse } from './ellipse'
import { convertSketchPath } from './path'
import { convertSketchText } from './text'
import { convertSketchGroup } from './group'
import { convertSketchSymbolMaster, convertSketchSymbolInstance } from './symbol'

export function convertSketchPage(page: any): PenDocument {
  const children = (page.layers ?? [])
    .map((layer: any) => dispatchSketchLayer(layer))
    .filter(Boolean) as PenNode[]

  return { children }
}

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
      return convertSketchGroup(layer, dispatchSketchLayer)
    case 'SymbolMaster':
      return convertSketchSymbolMaster(layer, dispatchSketchLayer)
    case 'SymbolInstance':
      return convertSketchSymbolInstance(layer)
    default:
      console.warn(`[sketch-to-pen] Unsupported layer type: ${layer.type} — skipping`)
      return null
  }
}
