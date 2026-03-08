import {
  scaleToCanvas,
  visibleWidth,
  visibleHeight,
  tileCutWidth,
  tileCutHeight,
} from '../calculator.js';

export const TilePattern = {
  getParams() {
    return [
      { name: "cols", label: "Columns", default: 5, min: 1, max: 20 },
      { name: "rows", label: "Rows", default: 7, min: 1, max: 20 },
    ];
  },

  getZones(config) {
    const cols = config.params?.cols ?? 5;
    const rows = config.params?.rows ?? 7;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, config._canvasW || 600, config._canvasH || 800);

    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const tileW = vw / cols;
    const tileH = vh / rows;

    const zones = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + (config.hemSides + c * tileW) * scale;
        const y = offsetY + (config.hemTop + r * tileH) * scale;
        zones.push({
          id: `tile-${r}-${c}`,
          row: r,
          col: c,
          x,
          y,
          w: tileW * scale,
          h: tileH * scale,
        });
      }
    }
    return zones;
  },

  render(ctx, config, canvasW, canvasH) {
    config._canvasW = canvasW;
    config._canvasH = canvasH;
    const cols = config.params?.cols ?? 5;
    const rows = config.params?.rows ?? 7;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);

    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const tileW = vw / cols;
    const tileH = vh / rows;

    if (!config.hideHem) {
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, offsetY, config.width * scale, config.height * scale);
    }

    // Draw each tile
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const zoneId = `tile-${r}-${c}`;
        const x = offsetX + (config.hemSides + c * tileW) * scale;
        const y = offsetY + (config.hemTop + r * tileH) * scale;
        const w = tileW * scale;
        const h = tileH * scale;

        // Fill with assigned color or default light gray
        const zoneColor = config.zoneColors?.[zoneId];
        ctx.fillStyle = zoneColor ? zoneColor.hex : '#e8e8e8';
        ctx.fillRect(x, y, w, h);

        // Draw seam lines (dark gray borders between tiles)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        // Draw selected zone highlight
        if (config.selectedZone === zoneId) {
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
        }
      }
    }
  },

  calculateCuts(config) {
    const cols = config.params?.cols ?? 5;
    const rows = config.params?.rows ?? 7;
    const seamAllowance = config.seamAllowance ?? 0;

    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const visTileW = vw / cols;
    const visTileH = vh / rows;

    // Categorize positions: corner, top/bottom edge, left/right edge, interior
    const groups = {};

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isTop = r === 0;
        const isBottom = r === rows - 1;
        const isLeft = c === 0;
        const isRight = c === cols - 1;

        const cutW = tileCutWidth(visTileW, seamAllowance, isLeft, isRight, config.hemSides);
        const cutH = tileCutHeight(visTileH, seamAllowance, isTop, isBottom, config.hemTop, config.hemBottom);

        let posType;
        if ((isTop || isBottom) && (isLeft || isRight)) {
          posType = 'Corner tile';
        } else if (isTop) {
          posType = 'Top edge tile';
        } else if (isBottom) {
          posType = 'Bottom edge tile';
        } else if (isLeft) {
          posType = 'Left edge tile';
        } else if (isRight) {
          posType = 'Right edge tile';
        } else {
          posType = 'Interior tile';
        }

        const key = `${posType}-${cutW}-${cutH}`;
        if (!groups[key]) {
          const zoneId = `tile-${r}-${c}`;
          const zoneColor = config.zoneColors?.[zoneId];
          groups[key] = {
            name: posType,
            quantity: 0,
            color: zoneColor ? zoneColor.hex : null,
            colorName: zoneColor ? zoneColor.name : null,
            cutWidth: cutW,
            cutHeight: cutH,
            visibleWidth: visTileW,
            visibleHeight: visTileH,
          };
        }
        groups[key].quantity++;
      }
    }

    return Object.values(groups);
  },
};
