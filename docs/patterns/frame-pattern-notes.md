# Frame Pattern — Construction Notes

Reference drawing: `Frame Design.jpg` (graph paper, 1 grid square = 1 inch)

## Overview

Four 8x8 corner units connected by strips at top/bottom/sides, with a large center panel. The corner units have an interior structure of small squares, strips, and a center.

## Corner Unit (8x8 inches, or 7x7 if curtain width < 16")

```
┌──┬────┬──┐
│2x2│2x4 │2x2│
├──┼────┼──┤
│4x2│ 4x4 │4x2│
├──┼────┼──┤
│2x2│2x4 │2x2│
└──┴────┴──┘
   = 8x8 total
```

9 sub-pieces per corner, each independently colorable:
- 4 corner squares: 2x2
- 2 horizontal strips: 4w x 2h (between top/bottom corner squares)
- 2 vertical strips: 2w x 4h (between left/right corner squares)
- 1 center square: 4x4

### Small corner variant (width < 15")
Center shifts from 4x4 to 3x3. Corner squares stay 2x2. Strips adjust to 3x2 and 2x3. Total unit = 7x7.

### Tiny variant (width < 16")
Entire corner unit scales from 8x8 to 7x7.

## Top/Bottom Connecting Strips

Three horizontal strips stacked, spanning the gap between left and right corners:

```
┌──────────────────┐
│  2" tall strip    │  ← outer
├──────────────────┤
│  4" tall strip    │  ← middle (stretches with width)
├──────────────────┤
│  2" tall strip    │  ← outer
└──────────────────┘
  total height = 8" (matches corner height)
  width = curtain visible width - 2 * corner width
```

## Left/Right Connecting Strips

Same structure rotated 90°. Three vertical strips side by side, spanning the gap between top and bottom corners:

```
┌──┬──┬──┐
│  │  │  │
│2w│4w│2w│  ← height stretches
│  │  │  │
└──┴──┴──┘
  total width = 8" (matches corner width)
  height = curtain visible height - 2 * corner height
```

## Center Panel

One single piece of fabric.

- Width = curtain visible width - 2 * corner width
- Height = curtain visible height - 2 * corner height

## Overall Layout

```
┌────────┬───────────────────┬────────┐
│        │ 2" strip          │        │
│  8x8   │ 4" strip          │  8x8   │
│ corner │ 2" strip          │ corner │
│  (TL)  │                   │  (TR)  │
├────────┼───────────────────┼────────┤
│2│4│2   │                   │2│4│2   │
│ │ │    │                   │ │ │    │
│ │ │    │   CENTER PANEL    │ │ │    │
│ │ │    │   (one piece)     │ │ │    │
│ │ │    │                   │ │ │    │
├────────┼───────────────────┼────────┤
│        │ 2" strip          │        │
│  8x8   │ 4" strip          │  8x8   │
│ corner │ 2" strip          │ corner │
│  (BL)  │                   │  (BR)  │
└────────┴───────────────────┴────────┘
```

## Scaling Rules

1. **Corner units are constant** at 8x8 (unless width < 16", then 7x7)
2. **Corner interior center** is 4x4 (unless width < 15", then 3x3)
3. **Width scales** by stretching: center panel width + top/bottom middle (4") strip width
4. **Height scales** by stretching: center panel height + left/right middle (4") strip height
5. The 2" outer strips in the connectors do NOT stretch — only the 4" middle strip stretches
6. **Top hem** can absorb up to 3" extra for non-exact sizing

## Seam Allowances

- Internal seams: 0.5" per side
- Side hems: 1" fold-over
- Bottom hem: 1" fold-over
- Top hem: 3" fold-over (rod pocket), can grow for scaling

## Piece Count Summary (for a 36" wide x 48" tall curtain)

Corner width = 8". Visible width = 36 - 2(1" side hem) = 34". Center width = 34 - 16 = 18".
Visible height = 48 - 3(top hem) - 1(bottom hem) = 44". Center height = 44 - 16 = 28".

| Piece | Size (visible) | Quantity | Notes |
|-------|---------------|----------|-------|
| Corner 2x2 square | 2x2 | 16 | 4 per corner x 4 corners |
| Corner h-strip | 4x2 | 8 | 2 per corner x 4 corners |
| Corner v-strip | 2x4 | 8 | 2 per corner x 4 corners |
| Corner center | 4x4 | 4 | 1 per corner |
| Top/bottom outer strip | 18x2 | 4 | 2 per top/bottom connector |
| Top/bottom middle strip | 18x4 | 2 | 1 per top/bottom connector (stretches) |
| Left/right outer strip | 2x28 | 4 | 2 per side connector |
| Left/right middle strip | 4x28 | 2 | 1 per side connector (stretches) |
| Center panel | 18x28 | 1 | One piece |
