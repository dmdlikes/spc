// Square Pattern — center panel with border of 6x6 units
// Each unit: strip (outer) / 3 squares / strip (inner)
// See docs/patterns/square-pattern-notes.md for full spec

import { scaleToCanvas, visibleWidth, visibleHeight, drawDimensions } from '../calculator.js';

const UNIT_SIZE = 6;    // each border unit is 6x6 inches
const SQUARE_SIZE = 2;  // each small square is 2x2 inches
const STRIP_W = 6;      // strip width (horizontal orientation)
const STRIP_H = 2;      // strip height

export const SquarePattern = {
  getParams() {
    return [];
    // No user params — unit counts are auto-derived from dimensions
  },

  // Compute derived layout from config
  // Auto-calculates unit counts and adjusts top hem to absorb remainder
  _layout(config) {
    const borderDepth = UNIT_SIZE; // one unit deep on each side

    // Width: available visible width = total width - side hems
    // Must fit whole units across; extra goes into side hems equally
    const availW = config.width - config.hemSides * 2;
    const unitsAcross = Math.max(3, Math.floor(availW / UNIT_SIZE));
    const vw = unitsAcross * UNIT_SIZE;
    const extraSideHem = (availW - vw) / 2; // split leftover evenly into side hems
    const effectiveHemSides = config.hemSides + extraSideHem;

    // Height: available = total height - hemBottom - 2*borderDepth
    // Side units fill the middle; remainder absorbed into top hem (up to 3" extra)
    const baseTopHem = config.hemTop; // normally 3"
    const availH = config.height - baseTopHem - config.hemBottom;
    const unitsTall = Math.max(1, Math.floor((availH - 2 * borderDepth) / UNIT_SIZE));
    const vh = 2 * borderDepth + unitsTall * UNIT_SIZE;
    const effectiveHemTop = config.height - config.hemBottom - vh; // top hem absorbs the rest

    return {
      unitsAcross, unitsTall, vw, vh, borderDepth,
      effectiveHemSides, effectiveHemTop,
    };
  },

  getZones(config) {
    const { scale, offsetX, offsetY } = scaleToCanvas(config, config._canvasW || 600, config._canvasH || 800);
    const layout = this._layout(config);
    const { unitsAcross, unitsTall, borderDepth } = layout;

    const hemX = layout.effectiveHemSides;
    const hemY = layout.effectiveHemTop;
    const zones = [];

    // Helper: add zones for a horizontal border unit at grid position (ux, uy)
    // outerOnTop=true means strip-squares-strip from top to bottom
    // outerOnTop=false means strip-squares-strip from bottom to top (mirrored)
    function addHUnit(ux, uy, unitIndex, side, outerOnTop) {
      const baseX = hemX + ux * UNIT_SIZE;
      const baseY = hemY + uy * UNIT_SIZE;

      const outerStripY = outerOnTop ? baseY : baseY + SQUARE_SIZE + STRIP_H;
      const squaresY = outerOnTop ? baseY + STRIP_H : baseY + STRIP_H;
      const innerStripY = outerOnTop ? baseY + STRIP_H + SQUARE_SIZE : baseY;

      // Outer strip
      zones.push({
        id: `${side}-unit${unitIndex}-outer-strip`,
        type: 'strip',
        x: offsetX + baseX * scale,
        y: offsetY + outerStripY * scale,
        w: STRIP_W * scale,
        h: STRIP_H * scale,
      });

      // 3 squares
      for (let s = 0; s < 3; s++) {
        zones.push({
          id: `${side}-unit${unitIndex}-sq${s}`,
          type: 'square',
          x: offsetX + (baseX + s * SQUARE_SIZE) * scale,
          y: offsetY + squaresY * scale,
          w: SQUARE_SIZE * scale,
          h: SQUARE_SIZE * scale,
        });
      }

      // Inner strip
      zones.push({
        id: `${side}-unit${unitIndex}-inner-strip`,
        type: 'strip',
        x: offsetX + baseX * scale,
        y: offsetY + innerStripY * scale,
        w: STRIP_W * scale,
        h: STRIP_H * scale,
      });
    }

    // Helper: add zones for a vertical (rotated) border unit
    // outerOnLeft=true means strip-squares-strip from left to right
    function addVUnit(ux, uy, unitIndex, side, outerOnLeft) {
      const baseX = hemX + ux * UNIT_SIZE;
      const baseY = hemY + uy * UNIT_SIZE;

      const outerStripX = outerOnLeft ? baseX : baseX + SQUARE_SIZE + STRIP_H;
      const squaresX = outerOnLeft ? baseX + STRIP_H : baseX + STRIP_H;
      const innerStripX = outerOnLeft ? baseX + STRIP_H + SQUARE_SIZE : baseX;

      // Outer strip (vertical: 2 wide x 6 tall)
      zones.push({
        id: `${side}-unit${unitIndex}-outer-strip`,
        type: 'strip',
        x: offsetX + outerStripX * scale,
        y: offsetY + baseY * scale,
        w: STRIP_H * scale,  // 2" wide
        h: STRIP_W * scale,  // 6" tall
      });

      // 3 squares (stacked vertically)
      for (let s = 0; s < 3; s++) {
        zones.push({
          id: `${side}-unit${unitIndex}-sq${s}`,
          type: 'square',
          x: offsetX + squaresX * scale,
          y: offsetY + (baseY + s * SQUARE_SIZE) * scale,
          w: SQUARE_SIZE * scale,
          h: SQUARE_SIZE * scale,
        });
      }

      // Inner strip (vertical: 2 wide x 6 tall)
      zones.push({
        id: `${side}-unit${unitIndex}-inner-strip`,
        type: 'strip',
        x: offsetX + innerStripX * scale,
        y: offsetY + baseY * scale,
        w: STRIP_H * scale,
        h: STRIP_W * scale,
      });
    }

    // Top border: units across, outer strip on top
    for (let i = 0; i < unitsAcross; i++) {
      addHUnit(i, 0, i, 'top', true);
    }

    // Bottom border: units across, outer strip on bottom (mirrored)
    for (let i = 0; i < unitsAcross; i++) {
      addHUnit(i, 1 + unitsTall, i, 'bottom', false);
    }

    // Left border: units stacked, outer strip on left
    for (let i = 0; i < unitsTall; i++) {
      addVUnit(0, 1 + i, i, 'left', true);
    }

    // Right border: units stacked, outer strip on right
    for (let i = 0; i < unitsTall; i++) {
      addVUnit(unitsAcross - 1, 1 + i, i, 'right', false);
    }

    // Center panel
    const centerX = hemX + UNIT_SIZE;
    const centerY = hemY + UNIT_SIZE;
    const centerW = (unitsAcross - 2) * UNIT_SIZE;
    const centerH = unitsTall * UNIT_SIZE;
    zones.push({
      id: 'center',
      type: 'center',
      x: offsetX + centerX * scale,
      y: offsetY + centerY * scale,
      w: centerW * scale,
      h: centerH * scale,
    });

    return zones;
  },

  render(ctx, config, canvasW, canvasH) {
    config._canvasW = canvasW;
    config._canvasH = canvasH;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);

    if (!config.hideHem) {
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, offsetY, config.width * scale, config.height * scale);
      ctx.fillStyle = '#f8f8f0';
      ctx.fillRect(offsetX, offsetY, config.width * scale, config.height * scale);
    }

    const zones = this.getZones(config);

    // Draw each zone
    for (const zone of zones) {
      const color = config.zoneColors?.[zone.id];

      // Default colors by type
      let defaultColor;
      if (zone.type === 'center') defaultColor = '#f0ece4';
      else if (zone.type === 'square') defaultColor = '#d8d0c4';
      else if (zone.type === 'strip') defaultColor = '#e8e4dc';
      else defaultColor = '#e8e8e8';

      ctx.fillStyle = color ? color.hex : defaultColor;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);

      // Seam lines
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    }

    // Highlight selected zone
    if (config.selectedZone) {
      const sel = zones.find(z => z.id === config.selectedZone);
      if (sel) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.strokeRect(sel.x - 1, sel.y - 1, sel.w + 2, sel.h + 2);
        ctx.setLineDash([]);
      }
    }
  },

  calculateCuts(config) {
    const layout = this._layout(config);
    const { unitsAcross, unitsTall, effectiveHemSides, effectiveHemTop } = layout;
    const sa = config.seamAllowance;
    const cuts = [];

    // Center panel — all edges are internal seams
    const centerW = (unitsAcross - 2) * UNIT_SIZE;
    const centerH = unitsTall * UNIT_SIZE;
    const centerColor = config.zoneColors?.['center'];
    cuts.push({
      name: 'Center panel',
      quantity: 1,
      color: centerColor ? centerColor.hex : null,
      colorName: centerColor ? centerColor.name : null,
      cutWidth: centerW + 2 * sa,
      cutHeight: centerH + 2 * sa,
      visibleWidth: centerW,
      visibleHeight: centerH,
    });

    // Border squares (2x2 visible) — all have internal seams on all sides
    // except edge squares which have hem on one or two sides
    // For simplicity, categorize by position:

    // Top unit squares — top edge has hem, other edges internal seam
    const topSqColor = config.zoneColors?.['top-unit0-sq0'];
    cuts.push({
      name: 'Top border square',
      quantity: 3 * unitsAcross,
      color: topSqColor ? topSqColor.hex : null,
      colorName: topSqColor ? topSqColor.name : null,
      cutWidth: SQUARE_SIZE + 2 * sa,
      cutHeight: SQUARE_SIZE + 2 * sa,
      visibleWidth: SQUARE_SIZE,
      visibleHeight: SQUARE_SIZE,
    });

    // Bottom unit squares
    const botSqColor = config.zoneColors?.['bottom-unit0-sq0'];
    cuts.push({
      name: 'Bottom border square',
      quantity: 3 * unitsAcross,
      color: botSqColor ? botSqColor.hex : null,
      colorName: botSqColor ? botSqColor.name : null,
      cutWidth: SQUARE_SIZE + 2 * sa,
      cutHeight: SQUARE_SIZE + 2 * sa,
      visibleWidth: SQUARE_SIZE,
      visibleHeight: SQUARE_SIZE,
    });

    // Left unit squares
    const leftSqColor = config.zoneColors?.['left-unit0-sq0'];
    cuts.push({
      name: 'Left border square',
      quantity: 3 * unitsTall,
      color: leftSqColor ? leftSqColor.hex : null,
      colorName: leftSqColor ? leftSqColor.name : null,
      cutWidth: SQUARE_SIZE + 2 * sa,
      cutHeight: SQUARE_SIZE + 2 * sa,
      visibleWidth: SQUARE_SIZE,
      visibleHeight: SQUARE_SIZE,
    });

    // Right unit squares
    const rightSqColor = config.zoneColors?.['right-unit0-sq0'];
    cuts.push({
      name: 'Right border square',
      quantity: 3 * unitsTall,
      color: rightSqColor ? rightSqColor.hex : null,
      colorName: rightSqColor ? rightSqColor.name : null,
      cutWidth: SQUARE_SIZE + 2 * sa,
      cutHeight: SQUARE_SIZE + 2 * sa,
      visibleWidth: SQUARE_SIZE,
      visibleHeight: SQUARE_SIZE,
    });

    // Top outer strips — top edge = hemTop
    const topOuterColor = config.zoneColors?.['top-unit0-outer-strip'];
    cuts.push({
      name: 'Top outer strip',
      quantity: unitsAcross,
      color: topOuterColor ? topOuterColor.hex : null,
      colorName: topOuterColor ? topOuterColor.name : null,
      cutWidth: STRIP_W + 2 * sa,
      cutHeight: STRIP_H + effectiveHemTop + sa,
      visibleWidth: STRIP_W,
      visibleHeight: STRIP_H,
    });

    // Top inner strips — all internal seams
    const topInnerColor = config.zoneColors?.['top-unit0-inner-strip'];
    cuts.push({
      name: 'Top inner strip',
      quantity: unitsAcross,
      color: topInnerColor ? topInnerColor.hex : null,
      colorName: topInnerColor ? topInnerColor.name : null,
      cutWidth: STRIP_W + 2 * sa,
      cutHeight: STRIP_H + 2 * sa,
      visibleWidth: STRIP_W,
      visibleHeight: STRIP_H,
    });

    // Bottom outer strips — bottom edge = hemBottom
    const botOuterColor = config.zoneColors?.['bottom-unit0-outer-strip'];
    cuts.push({
      name: 'Bottom outer strip',
      quantity: unitsAcross,
      color: botOuterColor ? botOuterColor.hex : null,
      colorName: botOuterColor ? botOuterColor.name : null,
      cutWidth: STRIP_W + 2 * sa,
      cutHeight: STRIP_H + config.hemBottom + sa,  // bottom hem stays fixed
      visibleWidth: STRIP_W,
      visibleHeight: STRIP_H,
    });

    // Bottom inner strips
    const botInnerColor = config.zoneColors?.['bottom-unit0-inner-strip'];
    cuts.push({
      name: 'Bottom inner strip',
      quantity: unitsAcross,
      color: botInnerColor ? botInnerColor.hex : null,
      colorName: botInnerColor ? botInnerColor.name : null,
      cutWidth: STRIP_W + 2 * sa,
      cutHeight: STRIP_H + 2 * sa,
      visibleWidth: STRIP_W,
      visibleHeight: STRIP_H,
    });

    // Left outer strips — left edge = hemSides
    const leftOuterColor = config.zoneColors?.['left-unit0-outer-strip'];
    cuts.push({
      name: 'Left outer strip',
      quantity: unitsTall,
      color: leftOuterColor ? leftOuterColor.hex : null,
      colorName: leftOuterColor ? leftOuterColor.name : null,
      cutWidth: STRIP_H + effectiveHemSides + sa,
      cutHeight: STRIP_W + 2 * sa,
      visibleWidth: STRIP_H,
      visibleHeight: STRIP_W,
    });

    // Left inner strips
    const leftInnerColor = config.zoneColors?.['left-unit0-inner-strip'];
    cuts.push({
      name: 'Left inner strip',
      quantity: unitsTall,
      color: leftInnerColor ? leftInnerColor.hex : null,
      colorName: leftInnerColor ? leftInnerColor.name : null,
      cutWidth: STRIP_H + 2 * sa,
      cutHeight: STRIP_W + 2 * sa,
      visibleWidth: STRIP_H,
      visibleHeight: STRIP_W,
    });

    // Right outer strips — right edge = hemSides
    const rightOuterColor = config.zoneColors?.['right-unit0-outer-strip'];
    cuts.push({
      name: 'Right outer strip',
      quantity: unitsTall,
      color: rightOuterColor ? rightOuterColor.hex : null,
      colorName: rightOuterColor ? rightOuterColor.name : null,
      cutWidth: STRIP_H + effectiveHemSides + sa,
      cutHeight: STRIP_W + 2 * sa,
      visibleWidth: STRIP_H,
      visibleHeight: STRIP_W,
    });

    // Right inner strips
    const rightInnerColor = config.zoneColors?.['right-unit0-inner-strip'];
    cuts.push({
      name: 'Right inner strip',
      quantity: unitsTall,
      color: rightInnerColor ? rightInnerColor.hex : null,
      colorName: rightInnerColor ? rightInnerColor.name : null,
      cutWidth: STRIP_H + 2 * sa,
      cutHeight: STRIP_W + 2 * sa,
      visibleWidth: STRIP_H,
      visibleHeight: STRIP_W,
    });

    return cuts;
  },
};
