# Square Pattern — Construction Notes

Reference drawing: `Square design.pdf` (36x36 grid, 1 grid square = 1 inch)

## Overview

A large center panel surrounded by a border made of repeating 6x6-inch square units. The border units contain small colorable squares and strips, creating the "stained glass" frame effect.

## Border Unit (6x6 inches)

Each border unit is a 6x6 square composed of:

```
┌────────┐
│  6x2   │  ← strip (outer edge, sewn as one piece)
├──┬──┬──┤
│2x2│2x2│2x2│  ← 3 individual squares (each independently colorable)
├──┴──┴──┤
│  6x2   │  ← strip (inner edge, sewn as one piece)
└────────┘
```

- Squares are sandwiched between two strips.
- The 3 small squares (2x2 each) are individual pieces that can each have their own color.
- The 2 strips (6x2 each) are each one piece of fabric. They are functionally three 2x2 squares joined, but cut and sewn as a single 6x2 strip.

## Border Layout

- **Top border:** N units in a horizontal row. Outer strip along top edge, squares in middle, inner strip closest to center.
- **Bottom border:** N units in a horizontal row. Mirrored — outer strip along bottom edge, squares in middle, inner strip closest to center.
- **Left border:** M units stacked vertically, ROTATED 90°. Outer strip along left edge, squares in middle, inner strip closest to center.
- **Right border:** M units stacked vertically, ROTATED 90°. Outer strip along right edge, squares in middle, inner strip closest to center.

In all cases: strip-squares-strip, with the outer strip on the curtain edge and the inner strip toward the center.

### Corner handling

The top and bottom border units span the full width of the curtain. The side units fill the remaining height between top and bottom borders.

### Unit counts for a 36x36 curtain

- Top: 6 units across (6 x 6 = 36")
- Bottom: 6 units across
- Left: 4 units tall (4 x 6 = 24", since 36 - 6 top - 6 bottom = 24")
- Right: 4 units tall

## Center Panel

One single piece of fabric filling the remaining space inside the border.

For a 36x36 curtain: center = 24" x 24" (36 - 6 left border - 6 right border = 24 wide; 36 - 6 top border - 6 bottom border = 24 tall).

## Scaling Rules

1. The 6x6 border units MUST remain square. The unit size is always 6x6 inches.
2. The number of border units on each side adjusts to fill the curtain dimensions.
3. Top/bottom unit count = curtain width / 6 (must divide evenly).
4. Side unit count = (curtain height - 12) / 6 (subtracting top and bottom borders; must divide evenly).
5. If the curtain height doesn't divide evenly, add up to 3" of extra fabric at the top (rod pocket flap) to reach a valid height.
6. The center panel absorbs whatever dimensions remain: center width = curtain width - 12", center height = curtain height - 12".

### Valid dimensions

- Width must be a multiple of 6 (e.g., 24, 30, 36, 42, 48, 54, 60, 66, 72...)
- Height must be a multiple of 6, OR close enough that adding up to 3" to the top hem makes it a multiple of 6.
- Minimum size: 18x18 (3 units across, 1 unit per side = no center visible — practical minimum is 24x24).

## Seam Allowances

- Internal seams: 0.5" per side
- Side hems: 1" fold-over
- Bottom hem: 1" fold-over
- Top hem: 3" fold-over (rod pocket), can be up to 6" if extra flap needed for scaling

## Piece Count Summary (for a 36x36 curtain)

| Piece | Size (visible) | Quantity | Notes |
|-------|---------------|----------|-------|
| Center panel | 24x24 | 1 | Single fabric piece |
| Border square | 2x2 | 60 | 3 per unit x 20 units |
| Top/bottom strip | 6x2 | 24 | 2 per unit x 12 units (top + bottom) |
| Side strip | 2x6 | 16 | 2 per unit x 8 units (left + right), rotated |

Total border units: 6 top + 6 bottom + 4 left + 4 right = 20 units.
