// Frame Pattern — 4 corner units + connecting strips + center panel
// See docs/patterns/frame-pattern-notes.md for full spec

import { scaleToCanvas, drawDimensions } from '../calculator.js';

export const FramePattern = {
  getParams() {
    return [];
  },

  _layout(config) {
    const hemSides = config.hemSides;
    const hemTop = config.hemTop;
    const hemBottom = config.hemBottom;

    const visW = config.width - hemSides * 2;
    const visH = config.height - hemTop - hemBottom;

    // Corner unit size
    let cornerSize = 8;
    let innerCenter = 4;
    if (visW < 16) {
      cornerSize = 7;
    }
    if (visW < 15) {
      innerCenter = 3;
    }
    const innerCornerSq = 2; // small corner squares are always 2x2
    const innerStrip = innerCenter; // strip length matches center
    // Corner = innerCornerSq + innerCenter + innerCornerSq = 2 + 4 + 2 = 8 (or 2+3+2=7)

    // Center panel dimensions
    const centerW = visW - 2 * cornerSize;
    const centerH = visH - 2 * cornerSize;

    // Connecting strips: the middle strip stretches, outer strips are fixed at 2"
    const connOuterStrip = innerCornerSq; // 2"
    const connMiddleStripW = centerW; // horizontal connectors stretch to center width
    const connMiddleStripH = centerH; // vertical connectors stretch to center height
    const connMiddle = innerCenter; // 4" (or 3") — the thickness of the middle strip

    return {
      visW, visH, cornerSize, innerCenter, innerCornerSq,
      centerW, centerH, connOuterStrip, connMiddle,
      hemSides, hemTop, hemBottom,
    };
  },

  getZones(config) {
    const { scale, offsetX, offsetY } = scaleToCanvas(config, config._canvasW || 600, config._canvasH || 800);
    const L = this._layout(config);
    const hx = L.hemSides;
    const hy = L.hemTop;
    const zones = [];
    const cs = L.cornerSize;
    const ic = L.innerCenter;
    const sq = L.innerCornerSq;

    // Helper to create a zone with both pixel and inch dimensions
    function z(id, type, inchX, inchY, inchW, inchH) {
      return {
        id, type,
        x: offsetX + (hx + inchX) * scale,
        y: offsetY + (hy + inchY) * scale,
        w: inchW * scale,
        h: inchH * scale,
        visW: inchW,
        visH: inchH,
      };
    }

    // Helper: add the 9 sub-pieces of a corner unit
    function addCorner(ox, oy, label) {
      zones.push(z(`${label}-sq-tl`, 'corner-sq', ox, oy, sq, sq));
      zones.push(z(`${label}-sq-tr`, 'corner-sq', ox + sq + ic, oy, sq, sq));
      zones.push(z(`${label}-sq-bl`, 'corner-sq', ox, oy + sq + ic, sq, sq));
      zones.push(z(`${label}-sq-br`, 'corner-sq', ox + sq + ic, oy + sq + ic, sq, sq));

      zones.push(z(`${label}-hstrip-top`, 'corner-strip', ox + sq, oy, ic, sq));
      zones.push(z(`${label}-hstrip-bot`, 'corner-strip', ox + sq, oy + sq + ic, ic, sq));

      zones.push(z(`${label}-vstrip-left`, 'corner-strip', ox, oy + sq, sq, ic));
      zones.push(z(`${label}-vstrip-right`, 'corner-strip', ox + sq + ic, oy + sq, sq, ic));

      zones.push(z(`${label}-center`, 'corner-center', ox + sq, oy + sq, ic, ic));
    }

    // Four corners
    addCorner(0, 0, 'tl');
    addCorner(L.visW - cs, 0, 'tr');
    addCorner(0, L.visH - cs, 'bl');
    addCorner(L.visW - cs, L.visH - cs, 'br');

    // Top connector: 3 horizontal strips between TL and TR corners
    const connX = cs;
    zones.push(z('conn-top-outer1', 'conn-strip', connX, 0, L.centerW, sq));
    zones.push(z('conn-top-middle', 'conn-middle', connX, sq, L.centerW, ic));
    zones.push(z('conn-top-outer2', 'conn-strip', connX, sq + ic, L.centerW, sq));

    // Bottom connector
    const botY = L.visH - cs;
    zones.push(z('conn-bot-outer1', 'conn-strip', connX, botY, L.centerW, sq));
    zones.push(z('conn-bot-middle', 'conn-middle', connX, botY + sq, L.centerW, ic));
    zones.push(z('conn-bot-outer2', 'conn-strip', connX, botY + sq + ic, L.centerW, sq));

    // Left connector: 3 vertical strips
    const connY = cs;
    zones.push(z('conn-left-outer1', 'conn-strip', 0, connY, sq, L.centerH));
    zones.push(z('conn-left-middle', 'conn-middle', sq, connY, ic, L.centerH));
    zones.push(z('conn-left-outer2', 'conn-strip', sq + ic, connY, sq, L.centerH));

    // Right connector
    const rightX = L.visW - cs;
    zones.push(z('conn-right-outer1', 'conn-strip', rightX, connY, sq, L.centerH));
    zones.push(z('conn-right-middle', 'conn-middle', rightX + sq, connY, ic, L.centerH));
    zones.push(z('conn-right-outer2', 'conn-strip', rightX + sq + ic, connY, sq, L.centerH));

    // Center panel
    zones.push(z('center', 'center', cs, cs, L.centerW, L.centerH));

    return zones;
  },

  render(ctx, config, canvasW, canvasH) {
    config._canvasW = canvasW;
    config._canvasH = canvasH;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);

    if (!config.hideHem) {
      // Outer hem border
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, offsetY, config.width * scale, config.height * scale);

      // Hem area background
      ctx.fillStyle = '#f8f8f0';
      ctx.fillRect(offsetX, offsetY, config.width * scale, config.height * scale);
    }

    const zones = this.getZones(config);

    for (const zone of zones) {
      const color = config.zoneColors?.[zone.id];

      let defaultColor;
      if (zone.type === 'center') defaultColor = '#f0ece4';
      else if (zone.type === 'corner-sq') defaultColor = '#d8d0c4';
      else if (zone.type === 'corner-strip') defaultColor = '#e0dbd2';
      else if (zone.type === 'corner-center') defaultColor = '#e8e4dc';
      else if (zone.type === 'conn-middle') defaultColor = '#e8e4dc';
      else if (zone.type === 'conn-strip') defaultColor = '#e0dbd2';
      else defaultColor = '#e8e8e8';

      ctx.fillStyle = color ? color.hex : defaultColor;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);

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

    // Dimension labels (skip for client PDF)
    if (!config.hideDimensions) {
      drawDimensions(ctx, zones, config, scale, offsetX, offsetY);
    }
  },

  calculateCuts(config) {
    const L = this._layout(config);
    const sa = config.seamAllowance;
    const sq = L.innerCornerSq;
    const ic = L.innerCenter;
    const cuts = [];

    // Center panel — all internal seams
    cuts.push({
      name: 'Center panel',
      quantity: 1,
      color: config.zoneColors?.['center']?.hex || null,
      colorName: config.zoneColors?.['center']?.name || null,
      cutWidth: L.centerW + 2 * sa,
      cutHeight: L.centerH + 2 * sa,
      visibleWidth: L.centerW,
      visibleHeight: L.centerH,
    });

    // Corner 2x2 squares — 4 per corner x 4 corners = 16
    // Some are on edges (get hem), most are internal
    // Top-left corner of TL: gets hemTop + hemSides
    // Simplification: group all corner squares as internal (conservative — they all get sa on each side)
    // Edge pieces will need hem instead of sa on outer edges
    const tlSqColor = config.zoneColors?.['tl-sq-tl'];
    cuts.push({
      name: 'Corner square (interior)',
      quantity: 16,
      color: tlSqColor?.hex || null,
      colorName: tlSqColor?.name || null,
      cutWidth: sq + 2 * sa,
      cutHeight: sq + 2 * sa,
      visibleWidth: sq,
      visibleHeight: sq,
    });

    // Corner horizontal strips — 2 per corner x 4 = 8
    const chColor = config.zoneColors?.['tl-hstrip-top'];
    cuts.push({
      name: 'Corner h-strip',
      quantity: 8,
      color: chColor?.hex || null,
      colorName: chColor?.name || null,
      cutWidth: ic + 2 * sa,
      cutHeight: sq + 2 * sa,
      visibleWidth: ic,
      visibleHeight: sq,
    });

    // Corner vertical strips — 2 per corner x 4 = 8
    const cvColor = config.zoneColors?.['tl-vstrip-left'];
    cuts.push({
      name: 'Corner v-strip',
      quantity: 8,
      color: cvColor?.hex || null,
      colorName: cvColor?.name || null,
      cutWidth: sq + 2 * sa,
      cutHeight: ic + 2 * sa,
      visibleWidth: sq,
      visibleHeight: ic,
    });

    // Corner center squares — 1 per corner x 4 = 4
    const ccColor = config.zoneColors?.['tl-center'];
    cuts.push({
      name: 'Corner center',
      quantity: 4,
      color: ccColor?.hex || null,
      colorName: ccColor?.name || null,
      cutWidth: ic + 2 * sa,
      cutHeight: ic + 2 * sa,
      visibleWidth: ic,
      visibleHeight: ic,
    });

    // Top/bottom connector outer strips — 2 per connector x 2 = 4
    const ctoColor = config.zoneColors?.['conn-top-outer1'];
    cuts.push({
      name: 'Top/bottom outer strip',
      quantity: 4,
      color: ctoColor?.hex || null,
      colorName: ctoColor?.name || null,
      cutWidth: L.centerW + 2 * sa,
      cutHeight: sq + 2 * sa,
      visibleWidth: L.centerW,
      visibleHeight: sq,
    });

    // Top/bottom connector middle strips — 1 per connector x 2 = 2
    const ctmColor = config.zoneColors?.['conn-top-middle'];
    cuts.push({
      name: 'Top/bottom middle strip',
      quantity: 2,
      color: ctmColor?.hex || null,
      colorName: ctmColor?.name || null,
      cutWidth: L.centerW + 2 * sa,
      cutHeight: ic + 2 * sa,
      visibleWidth: L.centerW,
      visibleHeight: ic,
    });

    // Left/right connector outer strips — 2 per connector x 2 = 4
    const cloColor = config.zoneColors?.['conn-left-outer1'];
    cuts.push({
      name: 'Left/right outer strip',
      quantity: 4,
      color: cloColor?.hex || null,
      colorName: cloColor?.name || null,
      cutWidth: sq + 2 * sa,
      cutHeight: L.centerH + 2 * sa,
      visibleWidth: sq,
      visibleHeight: L.centerH,
    });

    // Left/right connector middle strips — 1 per connector x 2 = 2
    const clmColor = config.zoneColors?.['conn-left-middle'];
    cuts.push({
      name: 'Left/right middle strip',
      quantity: 2,
      color: clmColor?.hex || null,
      colorName: clmColor?.name || null,
      cutWidth: ic + 2 * sa,
      cutHeight: L.centerH + 2 * sa,
      visibleWidth: ic,
      visibleHeight: L.centerH,
    });

    return cuts;
  },
};
