# Tile Pattern Notes

## Overview
A grid of equal squares filling the visible curtain area. No border — just hems on the outer edges.

## Geometry
- All tiles are squares (same width and height)
- Default tile size: 6" (configurable 5–7")
- Tile count is auto-derived from curtain dimensions:
  - Columns: `Math.round(visibleWidth / tileSize)` — then adjust actual tile size to fit evenly
  - Rows: `Math.round(visibleHeight / tileSize)` — same adjustment
- Remainder from rounding goes into hems (side remainder split evenly into side hems, vertical remainder into top hem)

## Scaling Example
- Curtain width 40", side hems 1" each → visible width = 38"
- 38 / 6 = 6.33 → round to 6 tiles
- Actual tile size = 38 / 6 = 6.333..."
- No remainder needed — tiles fill exactly

Alternative approach (user's description): "square root of 40 to start — 6.3245 — then fudge it to 6.3 and take overage out of side hem." In practice we round tile count and let tile size adjust slightly.

## Seam Allowances
- Internal seams: 0.5" per side (seamAllowance from config)
- Edge tiles get hem allowance instead of seam on outer edges:
  - Left/right edges: hemSides (1")
  - Top edge: hemTop (3")
  - Bottom edge: hemBottom (1")

## Coloring
- Each tile independently colorable
- Zone IDs: `tile-{row}-{col}` (0-indexed)

## Cut Piece Categories
Tiles are grouped by position for the cut sheet:
- Corner tiles (4 unique sizes — different hem on two sides)
- Top/bottom edge tiles (hem on one horizontal edge)
- Left/right edge tiles (hem on one vertical edge)
- Interior tiles (seam allowance on all sides)

## Parameters
- `tileSize`: Target tile size in inches (default 6, range 5–7, step 0.5)
