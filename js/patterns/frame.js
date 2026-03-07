// Frame Pattern — center panel with decorative border of squares and bars

import { scaleToCanvas, visibleWidth, visibleHeight } from '../calculator.js';

export const FramePattern = {
  getParams() {
    return [
      { name: 'borderWidth', label: 'Border Width (in)', default: 3, min: 1, max: 20 },
      { name: 'squaresPerSide', label: 'Squares per Side', default: 8, min: 2, max: 20 },
    ];
  },

  getZones(config) {
    const { scale, offsetX, offsetY } = scaleToCanvas(config, config._canvasW || 600, config._canvasH || 800);
    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const bw = config.params.borderWidth || 3;
    const sps = config.params.squaresPerSide || 8;

    const hemX = config.hemSides * scale;
    const hemY = config.hemTop * scale;

    const zones = [];

    // Center panel
    const cx = offsetX + hemX + bw * scale;
    const cy = offsetY + hemY + bw * scale;
    const cw = (vw - 2 * bw) * scale;
    const ch = (vh - 2 * bw) * scale;
    zones.push({ id: 'center', x: cx, y: cy, w: cw, h: ch });

    // Border squares and bars
    // Top and bottom borders
    const hBarCount = sps;
    const hSquareSize = bw;
    const hBarLen = (vw - 2 * bw) / hBarCount;

    for (let i = 0; i < hBarCount; i++) {
      // Top bar
      zones.push({
        id: `bar-top-${i}`,
        x: offsetX + hemX + bw * scale + i * hBarLen * scale,
        y: offsetY + hemY,
        w: hBarLen * scale,
        h: bw * scale,
      });
      // Bottom bar
      zones.push({
        id: `bar-bottom-${i}`,
        x: offsetX + hemX + bw * scale + i * hBarLen * scale,
        y: offsetY + hemY + (vh - bw) * scale,
        w: hBarLen * scale,
        h: bw * scale,
      });
    }

    // Left and right borders
    const vBarCount = sps;
    const vBarLen = (vh - 2 * bw) / vBarCount;

    for (let i = 0; i < vBarCount; i++) {
      // Left bar
      zones.push({
        id: `bar-left-${i}`,
        x: offsetX + hemX,
        y: offsetY + hemY + bw * scale + i * vBarLen * scale,
        w: bw * scale,
        h: vBarLen * scale,
      });
      // Right bar
      zones.push({
        id: `bar-right-${i}`,
        x: offsetX + hemX + (vw - bw) * scale,
        y: offsetY + hemY + bw * scale + i * vBarLen * scale,
        w: bw * scale,
        h: vBarLen * scale,
      });
    }

    // Corner squares
    const cs = bw * scale;
    zones.push({ id: 'corner-tl', x: offsetX + hemX, y: offsetY + hemY, w: cs, h: cs });
    zones.push({ id: 'corner-tr', x: offsetX + hemX + (vw - bw) * scale, y: offsetY + hemY, w: cs, h: cs });
    zones.push({ id: 'corner-bl', x: offsetX + hemX, y: offsetY + hemY + (vh - bw) * scale, w: cs, h: cs });
    zones.push({ id: 'corner-br', x: offsetX + hemX + (vw - bw) * scale, y: offsetY + hemY + (vh - bw) * scale, w: cs, h: cs });

    return zones;
  },

  render(ctx, config, canvasW, canvasH) {
    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);
    const vw = visibleWidth(config);
    const vh = visibleHeight(config);

    // Store canvas dimensions for getZones
    config._canvasW = canvasW;
    config._canvasH = canvasH;

    const zones = this.getZones(config);

    // Draw outer hem border
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, config.width * scale, config.height * scale);

    // Draw hem area (light fill between outer edge and visible area)
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(offsetX, offsetY, config.width * scale, config.height * scale);

    // Draw each zone
    for (const zone of zones) {
      const color = config.zoneColors[zone.id];
      ctx.fillStyle = color ? color.hex : '#e8e8e8';
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);

      // Seam lines
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    }

    // Highlight selected zone
    if (config.selectedZone) {
      const sel = zones.find(z => z.id === config.selectedZone);
      if (sel) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(sel.x - 1, sel.y - 1, sel.w + 2, sel.h + 2);
        ctx.setLineDash([]);
      }
    }
  },

  calculateCuts(config) {
    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const bw = config.params.borderWidth || 3;
    const sps = config.params.squaresPerSide || 8;
    const sa = config.seamAllowance;

    const cuts = [];

    // Center panel — surrounded by border, so all edges are internal seams
    const centerVisW = vw - 2 * bw;
    const centerVisH = vh - 2 * bw;
    const centerColor = config.zoneColors['center'];
    cuts.push({
      name: 'Center panel',
      quantity: 1,
      color: centerColor ? centerColor.hex : null,
      colorName: centerColor ? centerColor.name : null,
      cutWidth: centerVisW + 2 * sa,
      cutHeight: centerVisH + 2 * sa,
      visibleWidth: centerVisW,
      visibleHeight: centerVisH,
    });

    // Top/bottom bars
    const hBarVisW = (vw - 2 * bw) / sps;
    const hBarVisH = bw;

    // Top bars (top edge gets hemTop, bottom gets seam)
    const topBarColor = config.zoneColors['bar-top-0'];
    cuts.push({
      name: 'Top border bar',
      quantity: sps,
      color: topBarColor ? topBarColor.hex : null,
      colorName: topBarColor ? topBarColor.name : null,
      cutWidth: hBarVisW + 2 * sa,
      cutHeight: hBarVisH + config.hemTop + sa,
      visibleWidth: hBarVisW,
      visibleHeight: hBarVisH,
    });

    // Bottom bars
    const bottomBarColor = config.zoneColors['bar-bottom-0'];
    cuts.push({
      name: 'Bottom border bar',
      quantity: sps,
      color: bottomBarColor ? bottomBarColor.hex : null,
      colorName: bottomBarColor ? bottomBarColor.name : null,
      cutWidth: hBarVisW + 2 * sa,
      cutHeight: hBarVisH + config.hemBottom + sa,
      visibleWidth: hBarVisW,
      visibleHeight: hBarVisH,
    });

    // Left/right bars
    const vBarVisW = bw;
    const vBarVisH = (vh - 2 * bw) / sps;

    const leftBarColor = config.zoneColors['bar-left-0'];
    cuts.push({
      name: 'Left border bar',
      quantity: sps,
      color: leftBarColor ? leftBarColor.hex : null,
      colorName: leftBarColor ? leftBarColor.name : null,
      cutWidth: vBarVisW + config.hemSides + sa,
      cutHeight: vBarVisH + 2 * sa,
      visibleWidth: vBarVisW,
      visibleHeight: vBarVisH,
    });

    const rightBarColor = config.zoneColors['bar-right-0'];
    cuts.push({
      name: 'Right border bar',
      quantity: sps,
      color: rightBarColor ? rightBarColor.hex : null,
      colorName: rightBarColor ? rightBarColor.name : null,
      cutWidth: vBarVisW + config.hemSides + sa,
      cutHeight: vBarVisH + 2 * sa,
      visibleWidth: vBarVisW,
      visibleHeight: vBarVisH,
    });

    // Corner squares — each has two outer edges
    const cornerColor = config.zoneColors['corner-tl'];
    cuts.push({
      name: 'Top-left corner',
      quantity: 1,
      color: cornerColor ? cornerColor.hex : null,
      colorName: cornerColor ? cornerColor.name : null,
      cutWidth: bw + config.hemSides + sa,
      cutHeight: bw + config.hemTop + sa,
      visibleWidth: bw,
      visibleHeight: bw,
    });

    const trColor = config.zoneColors['corner-tr'];
    cuts.push({
      name: 'Top-right corner',
      quantity: 1,
      color: trColor ? trColor.hex : null,
      colorName: trColor ? trColor.name : null,
      cutWidth: bw + config.hemSides + sa,
      cutHeight: bw + config.hemTop + sa,
      visibleWidth: bw,
      visibleHeight: bw,
    });

    const blColor = config.zoneColors['corner-bl'];
    cuts.push({
      name: 'Bottom-left corner',
      quantity: 1,
      color: blColor ? blColor.hex : null,
      colorName: blColor ? blColor.name : null,
      cutWidth: bw + config.hemSides + sa,
      cutHeight: bw + config.hemBottom + sa,
      visibleWidth: bw,
      visibleHeight: bw,
    });

    const brColor = config.zoneColors['corner-br'];
    cuts.push({
      name: 'Bottom-right corner',
      quantity: 1,
      color: brColor ? brColor.hex : null,
      colorName: brColor ? brColor.name : null,
      cutWidth: bw + config.hemSides + sa,
      cutHeight: bw + config.hemBottom + sa,
      visibleWidth: bw,
      visibleHeight: bw,
    });

    return cuts;
  },
};
