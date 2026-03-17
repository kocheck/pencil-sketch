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
| Artboard | `frame` | Converted as group |
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
