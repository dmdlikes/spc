// Tile Pattern — grid of near-square tiles
// Tile size configurable (5–7"); cols derived from width, rows from height
// Tiles are tileW × tileH — both snapped to 1/8", within ~1/2" of each other
// Remainders absorbed into hems
// See docs/patterns/tile-pattern-notes.md

import {
  scaleToCanvas,
  tileCutWidth,
  tileCutHeight,
  drawDimensions,
  fmtDim,
} from '../calculator.js';

export const TilePattern = {
  getParams() {
    return [
      { name: "tileSize", label: "Tile Size (in)", default: 6, min: 5, max: 7, step: 0.125 },
    ];
  },

  _layout(config) {
    const tileSize = config.params?.tileSize ?? 6;
    const snap = (n) => Math.round(n * 8) / 8;

    // Visible tile area IS the full curtain — hems/seams are extra on cut pieces
    const fullW = config.width;
    const fullH = config.height;

    // Columns from width
    const cols = Math.max(1, Math.round(fullW / tileSize));
    const tileW = snap(fullW / cols);

    // Rows from height — target same as tileW for near-square
    const rows = Math.max(1, Math.round(fullH / tileW));
    const tileH = snap(fullH / rows);

    return { cols, rows, tileW, tileH };
  },

  getZones(config) {
    const { scale, offsetX, offsetY } = scaleToCanvas(config, config._canvasW || 600, config._canvasH || 800);
    const layout = this._layout(config);
    const { cols, rows, tileW, tileH } = layout;

    const zones = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * tileW * scale;
        const y = offsetY + r * tileH * scale;
        zones.push({
          id: `tile-${r}-${c}`,
          row: r, col: c,
          x, y,
          w: tileW * scale,
          h: tileH * scale,
          visW: tileW, visH: tileH,
        });
      }
    }
    return zones;
  },

  render(ctx, config, canvasW, canvasH) {
    config._canvasW = canvasW;
    config._canvasH = canvasH;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);
    const layout = this._layout(config);
    const { cols, rows, tileW, tileH } = layout;

    const zones = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const zoneId = `tile-${r}-${c}`;
        const x = offsetX + c * tileW * scale;
        const y = offsetY + r * tileH * scale;
        const w = tileW * scale;
        const h = tileH * scale;

        const zoneColor = config.zoneColors?.[zoneId];
        ctx.fillStyle = zoneColor ? zoneColor.hex : '#e8e8e8';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        if (config.selectedZone === zoneId) {
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
        }

        zones.push({ id: zoneId, x, y, w, h, visW: tileW, visH: tileH });
      }
    }

    if (!config.hideDimensions) {
      drawDimensions(ctx, zones, config, scale, offsetX, offsetY);

      // Show remainder note if tiles don't fill curtain exactly
      const actualW = cols * tileW;
      const actualH = rows * tileH;
      const diffW = config.width - actualW;
      const diffH = config.height - actualH;
      if (Math.abs(diffW) > 0.001 || Math.abs(diffH) > 0.001) {
        const parts = [];
        if (Math.abs(diffW) > 0.001) parts.push(`${fmtDim(diffW)}" W`);
        if (Math.abs(diffH) > 0.001) parts.push(`${fmtDim(diffH)}" H`);
        ctx.save();
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#c0392b';
        ctx.fillText(`Remainder: ${parts.join(', ')}`, offsetX + (config.width * scale) / 2, offsetY + config.height * scale + 16);
        ctx.restore();
      }
    }
  },

  calculateCuts(config) {
    const layout = this._layout(config);
    const { cols, rows, tileW, tileH } = layout;
    const seamAllowance = config.seamAllowance ?? 0;

    const groups = {};

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isTop = r === 0;
        const isBottom = r === rows - 1;
        const isLeft = c === 0;
        const isRight = c === cols - 1;

        const cutW = tileCutWidth(tileW, seamAllowance, isLeft, isRight, config.hemSides);
        const cutH = tileCutHeight(tileH, seamAllowance, isTop, isBottom, config.hemTop, config.hemBottom);

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
            visibleWidth: tileW,
            visibleHeight: tileH,
          };
        }
        groups[key].quantity++;
      }
    }

    return Object.values(groups);
  },
};
