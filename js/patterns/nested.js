// Nested Pattern — concentric rectangular rings from outer to inner

import { scaleToCanvas, visibleWidth, visibleHeight } from '../calculator.js';

export const NestedPattern = {
  getParams() {
    return [
      { name: 'rings', label: 'Rings', default: 5, min: 2, max: 10 },
    ];
  },

  getZones(config) {
    const canvasW = config._canvasW || 600;
    const canvasH = config._canvasH || 800;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);
    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const rings = config.params.rings || 5;
    const stepW = vw / (2 * rings);
    const stepH = vh / (2 * rings);

    const zones = [];
    for (let i = 0; i < rings; i++) {
      const x = (config.hemSides + i * stepW) * scale + offsetX;
      const y = (config.hemTop + i * stepH) * scale + offsetY;
      const w = (vw - 2 * i * stepW) * scale;
      const h = (vh - 2 * i * stepH) * scale;
      zones.push({ id: `ring-${i}`, x, y, w, h });
    }
    return zones;
  },

  render(ctx, config, canvasW, canvasH) {
    config._canvasW = canvasW;
    config._canvasH = canvasH;

    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);
    const rings = config.params.rings || 5;

    // Draw hem background
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(offsetX, offsetY, config.width * scale, config.height * scale);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, config.width * scale, config.height * scale);

    // Get zones and draw from outermost inward
    const zones = this.getZones(config);
    for (let i = 0; i < rings; i++) {
      const zone = zones[i];
      const color = config.zoneColors[zone.id];
      ctx.fillStyle = color ? color.hex : '#e8e8e8';
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);

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
        ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
        ctx.setLineDash([]);
      }
    }
  },

  calculateCuts(config) {
    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const rings = config.params.rings || 5;
    const sa = config.seamAllowance;
    const stepW = vw / (2 * rings);
    const stepH = vh / (2 * rings);

    const cuts = [];

    for (let i = 0; i < rings; i++) {
      const ringW = vw - 2 * i * stepW;
      const ringH = vh - 2 * i * stepH;
      const color = config.zoneColors[`ring-${i}`];
      const hex = color ? color.hex : null;
      const colorName = color ? color.name : null;

      if (i === rings - 1) {
        // Innermost ring — solid rectangle
        cuts.push({
          name: `Ring ${i} center`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: ringW + 2 * sa,
          cutHeight: ringH + 2 * sa,
          visibleWidth: ringW,
          visibleHeight: ringH,
        });
      } else if (i === 0) {
        // Outermost ring — hem allowances on outer edges
        const innerW = ringW - 2 * stepW;
        const innerH = ringH - 2 * stepH;

        // Top strip
        cuts.push({
          name: `Ring ${i} top strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: innerW + 2 * sa,
          cutHeight: stepH + config.hemTop + sa,
          visibleWidth: innerW,
          visibleHeight: stepH,
        });

        // Bottom strip
        cuts.push({
          name: `Ring ${i} bottom strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: innerW + 2 * sa,
          cutHeight: stepH + config.hemBottom + sa,
          visibleWidth: innerW,
          visibleHeight: stepH,
        });

        // Left strip
        cuts.push({
          name: `Ring ${i} left strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + config.hemSides + sa,
          cutHeight: innerH + 2 * sa,
          visibleWidth: stepW,
          visibleHeight: innerH,
        });

        // Right strip
        cuts.push({
          name: `Ring ${i} right strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + config.hemSides + sa,
          cutHeight: innerH + 2 * sa,
          visibleWidth: stepW,
          visibleHeight: innerH,
        });

        // Corner squares
        cuts.push({
          name: `Ring ${i} top-left corner`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + config.hemSides + sa,
          cutHeight: stepH + config.hemTop + sa,
          visibleWidth: stepW,
          visibleHeight: stepH,
        });

        cuts.push({
          name: `Ring ${i} top-right corner`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + config.hemSides + sa,
          cutHeight: stepH + config.hemTop + sa,
          visibleWidth: stepW,
          visibleHeight: stepH,
        });

        cuts.push({
          name: `Ring ${i} bottom-left corner`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + config.hemSides + sa,
          cutHeight: stepH + config.hemBottom + sa,
          visibleWidth: stepW,
          visibleHeight: stepH,
        });

        cuts.push({
          name: `Ring ${i} bottom-right corner`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + config.hemSides + sa,
          cutHeight: stepH + config.hemBottom + sa,
          visibleWidth: stepW,
          visibleHeight: stepH,
        });
      } else {
        // Interior ring — all edges are internal seams
        const innerW = ringW - 2 * stepW;
        const innerH = ringH - 2 * stepH;

        // Top strip
        cuts.push({
          name: `Ring ${i} top strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: innerW + 2 * sa,
          cutHeight: stepH + 2 * sa,
          visibleWidth: innerW,
          visibleHeight: stepH,
        });

        // Bottom strip
        cuts.push({
          name: `Ring ${i} bottom strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: innerW + 2 * sa,
          cutHeight: stepH + 2 * sa,
          visibleWidth: innerW,
          visibleHeight: stepH,
        });

        // Left strip
        cuts.push({
          name: `Ring ${i} left strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + 2 * sa,
          cutHeight: innerH + 2 * sa,
          visibleWidth: stepW,
          visibleHeight: innerH,
        });

        // Right strip
        cuts.push({
          name: `Ring ${i} right strip`,
          quantity: 1,
          color: hex,
          colorName,
          cutWidth: stepW + 2 * sa,
          cutHeight: innerH + 2 * sa,
          visibleWidth: stepW,
          visibleHeight: innerH,
        });

        // Corner squares
        cuts.push({
          name: `Ring ${i} corner`,
          quantity: 4,
          color: hex,
          colorName,
          cutWidth: stepW + 2 * sa,
          cutHeight: stepH + 2 * sa,
          visibleWidth: stepW,
          visibleHeight: stepH,
        });
      }
    }

    return cuts;
  },
};
