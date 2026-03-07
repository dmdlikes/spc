# Pojagi Studio — Design Document

**Date:** 2026-03-07
**Author:** dmd + Claude
**Status:** Approved

## Problem

Stella runs StellaLeeStudio on Etsy, making custom pojagi (Korean patchwork) linen curtains. Clients choose a pattern and request custom colors. Today, Stella communicates color options via colored pencil drawings photographed and sent to clients. Measurement calculations for each piece are done by hand. Both processes are time-consuming and error-prone as order volume grows.

## Solution

A browser-based tool ("Pojagi Studio") that lets Stella:
1. Select a pattern, enter window dimensions, assign colors, and see a live preview
2. Export a PDF with a client-facing color preview and a cut sheet with exact measurements
3. Manage color libraries sourced from her fabric suppliers

## Architecture

**Approach:** Static HTML + Canvas, no framework, no build step, no server.
Stella opens `index.html` in Chrome and it works. Files live in a GitHub repo so she can use Claude to evolve it.

## Project Structure

```
pojagi-studio/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js              # Main app logic, UI wiring
│   ├── patterns/
│   │   ├── frame.js        # Frame pattern renderer + measurement rules
│   │   ├── tile.js         # Tile pattern renderer + measurement rules
│   │   ├── diamond.js      # Diamond/harlequin renderer + measurement rules
│   │   └── nested.js       # Nested rectangle renderer + measurement rules
│   ├── colors.js           # Color library management
│   ├── calculator.js       # Measurement engine
│   ├── pdf.js              # PDF generation
│   └── picker.js           # Visual color picker grid
├── data/
│   ├── il019-colors.json   # IL019 fabric colors (scraped hex values)
│   ├── il020-colors.json   # IL020 fabric colors (scraped hex values)
│   └── custom-colors.json  # Template for user-added colors
├── lib/
│   └── jspdf.min.js        # Vendored PDF library
└── docs/
    └── plans/
```

## Pattern Types

Four patterns based on Stella's current product line:

### 1. Frame Pattern
A large center panel surrounded by a decorative border of alternating small squares and rectangles. Can range from simple (one border ring) to complex (architectural/Frank Lloyd Wright style with multiple border layers).

**Zones:** center panel, border squares, border bars, outer border
**Params:** borderWidth, squareCount

### 2. Tile Pattern
A grid of roughly equal rectangular patches in varied colors.

**Zones:** each individual tile (can assign colors per-tile or per-row/column)
**Params:** cols, rows

### 3. Diamond/Harlequin Pattern
Squares rotated 45 degrees to create a diamond lattice.

**Zones:** each diamond
**Params:** diamondSize

### 4. Nested Rectangle Pattern
Concentric rectangular frames spiraling inward, like a log cabin quilt block.

**Zones:** each ring/frame
**Params:** rings

## Pattern Module Interface

Each pattern file exports:
- `render(canvas, config)` — draws the pattern on canvas
- `getZones(config)` — returns clickable zones (name, shape, position)
- `calculateCuts(config)` — returns cut sheet (piece name, quantity, cut width, cut height)

## Config Object

```js
{
  width: 71,            // overall curtain width in inches
  height: 48,           // overall curtain height in inches
  seamAllowance: 0.5,   // internal seam allowance, per side
  hemSides: 1.0,        // left & right fold-over
  hemBottom: 1.0,        // bottom fold-over
  hemTop: 3.0,           // top fold-over (rod pocket)
  colors: {
    "zone-name": "#8B0000"
  },
  params: {}             // pattern-specific parameters
}
```

### Measurement Rules

- **Internal seams:** 0.5" per side (1" total consumed per seam between two pieces)
- **Side hems:** 1" fold-over (left and right edges)
- **Bottom hem:** 1" fold-over
- **Top hem:** 3" fold-over (rod pocket)
- **Scaling:** When overall dimensions change, visible piece proportions are preserved. Seam allowances are fixed and added on top of the scaled visible dimensions.

## UI Layout

Single page, three-panel layout:

- **Left panel (Settings):** Pattern dropdown, dimension inputs, seam/hem defaults, pattern-specific params, Export PDF button
- **Center panel (Preview):** Live canvas rendering of the curtain. Click a zone to select it. Cut sheet summary below the preview.
- **Right panel (Colors):** IL019 library, IL020 library, custom colors, visual color picker grid. Click a swatch to assign it to the selected zone.

**Core interaction:** Click zone in preview → zone highlights → click color swatch → zone fills → preview updates live.

## Color System

### Fabric Libraries (IL019, IL020)
- ~48 colors each, pre-loaded as JSON
- Hex values derived by scraping product page images from fabrics-store.com and sampling the center region of each swatch photo
- Displayed as named swatches showing color name + hex fill

### Custom Colors
- Added via a visual color picker (~500 colors organized by hue/lightness)
- User can name them (e.g., "sage green from Etsy seller X")
- Persisted to localStorage

### Adding New Libraries
- Future: scrape a supplier's color page, extract swatch images, sample hex values
- For now: manually add to JSON files

### Color Library Entry Format
```json
{
  "name": "Dusty Rose",
  "hex": "#C4A4A0",
  "source": "fabrics-store.com",
  "line": "IL019"
}
```

## PDF Output

### Page 1 — Client Preview
- Curtain design rendered with colors, proportional
- Overall dimensions labeled
- Color legend: swatch + color name + fabric source
- Pattern name
- StellaLeeStudio branding

### Page 2 — Cut Sheet (Stella's reference)
- Table: piece name, quantity, fabric color, cutting width, cutting height
- Seam allowances broken out for verification
- Total fabric yardage per color (assuming 58" bolt width for IL019/IL020)
- Numbered diagram matching the table

## Technical Notes

- No build step, no npm, no server — just files
- jsPDF vendored in `lib/` for offline use
- Custom colors saved to localStorage
- Pattern modules are plain JS files — add new patterns by adding a file
- GitHub repo for version control and Claude-assisted evolution
