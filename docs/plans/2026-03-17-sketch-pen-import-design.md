# Sketch ↔ Pencil (.pen) Bidirectional Converter — Design

**Date:** 2026-03-17
**Status:** Approved

---

## Overview

A Sketch plugin (TypeScript) that enables bidirectional conversion between Sketch and Pencil's `.pen` format:

- **Import:** Open a `.pen` file via file picker → convert to Sketch layers → insert into current page
- **Export:** Select layers/artboard in Sketch → convert to `.pen` JSON → copy to clipboard → paste into Pencil

Full scope: all node types including symbols/components, images, gradients, effects, styled text, shared styles.

---

## Architecture

**Build tooling:** `skpm` + webpack + TypeScript + Jest

### Plugin Commands

| Command | Action |
|---------|--------|
| `Import .pen file` | Native file picker → parse `.pen` JSON → build Sketch layer tree → insert into current page |
| `Copy as .pen` | Get current selection or artboard → convert to `.pen` JSON → copy to clipboard |

### Project Structure

```
pencil-sketch/
├── src/
│   ├── commands/
│   │   ├── import-pen.ts
│   │   └── copy-as-pen.ts
│   ├── converters/
│   │   ├── sketch-to-pen/
│   │   │   ├── index.ts            # Orchestrator/traversal
│   │   │   ├── frame.ts
│   │   │   ├── group.ts
│   │   │   ├── rectangle.ts
│   │   │   ├── ellipse.ts
│   │   │   ├── text.ts
│   │   │   ├── path.ts
│   │   │   ├── image.ts
│   │   │   ├── symbol.ts           # Symbol masters → reusable components
│   │   │   ├── symbol-instance.ts  # Symbol instances → ref nodes
│   │   │   ├── gradient.ts
│   │   │   ├── effects.ts
│   │   │   └── style.ts
│   │   └── pen-to-sketch/
│   │       ├── index.ts
│   │       ├── frame.ts
│   │       ├── rectangle.ts
│   │       ├── ellipse.ts
│   │       ├── text.ts
│   │       ├── path.ts
│   │       ├── image.ts
│   │       ├── ref.ts              # ref nodes → Symbol instances
│   │       ├── gradient.ts
│   │       └── effects.ts
│   └── utils/
│       ├── color.ts
│       ├── layout.ts
│       └── assets.ts
├── __tests__/
│   ├── sketch-to-pen/
│   └── pen-to-sketch/
├── manifest.json
├── package.json
└── tsconfig.json
```

---

## Data Flow

### Import (`.pen` → Sketch)

```
File picker → read JSON → parse root document
  → walk children recursively
  → dispatch each node to pen-to-sketch/<type>.ts handler
  → build Sketch layer tree
  → insert into current Sketch page
```

### Export (Sketch → `.pen`)

```
Get selection (or artboard) from Sketch API
  → walk layer tree recursively
  → dispatch each layer to sketch-to-pen/<type>.ts handler
  → build .pen JSON object tree
  → serialize → copy to clipboard
```

---

## Key Mapping Challenges

### 1. Symbols ↔ Components
- Sketch Symbol Masters → `.pen` objects with `"reusable": true`
- Sketch Symbol Instances → `.pen` `"type": "ref"` nodes
- Sketch overrides → `.pen` `descendants` property for nested overrides

### 2. Layout
- Sketch: absolute positioning + constraints
- `.pen`: flexbox (`"layout": "vertical"` / `"horizontal"`)
- **Import:** flex `.pen` layouts → Sketch smart layout
- **Export:** detect flex-like arrangements → emit layout props; otherwise `"layout": "none"` with absolute `x`/`y`

### 3. Gradients
- Both formats support linear/radial/angular
- Sketch uses 0–1 normalized coordinates; `.pen` uses absolute px
- Normalize on both sides of the conversion

### 4. Styled Text
- Sketch: attributed string ranges with per-run styling
- `.pen`: `content` array of segments with inline style props
- Straightforward iteration over ranges

### 5. Variables & Shared Styles
- Sketch Shared Styles → `.pen` `variables`
- `.pen` theme-conditional variables → flatten to default value on import (Sketch has no theming)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unknown node type | Skip node, log warning to console |
| Invalid `.pen` JSON | Show Sketch native alert dialog |
| Missing image assets | Insert placeholder rectangle with label |

---

## Testing Strategy

### Unit Tests (per handler)
Each converter handler has its own test file with fixture inputs. e.g., `text.test.ts` feeds a Sketch text layer JSON in and asserts the correct `.pen` text node output.

### Round-Trip Tests
`.pen` → Sketch → `.pen` for representative fixture files. Checks structural equivalence: same node types, hierarchy, fills/strokes. (Pixel-perfect not required, especially for layout.)

### Snapshot Tests
For complex fixtures (artboards with symbols, gradients, effects) — snapshot output so changes are visible as diffs in review.

### Out of Scope for CI
- Actual Sketch plugin execution (requires Sketch app) — manual QA
- Clipboard paste into Pencil — manual QA
