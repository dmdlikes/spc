import {
  scaleToCanvas,
  visibleWidth,
  visibleHeight,
} from '../calculator.js';

export const DiamondPattern = {
  getParams() {
    return [
      { name: "diamondSize", label: "Diamond Size (in)", default: 4, min: 1, max: 20 },
    ];
  },

  getZones(config) {
    const diamondSize = config.params?.diamondSize ?? 4;
    const cellSize = diamondSize * Math.SQRT1_2;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, config._canvasW || 600, config._canvasH || 800);

    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const cols = Math.ceil(vw / cellSize);
    const rows = Math.ceil(vh / cellSize);

    const zones = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isOddRow = r % 2 !== 0;
        const xOffset = isOddRow ? cellSize / 2 : 0;
        const x = offsetX + (config.hemSides + c * cellSize + xOffset) * scale;
        const y = offsetY + (config.hemTop + r * cellSize) * scale;
        zones.push({
          id: `diamond-${r}-${c}`,
          row: r,
          col: c,
          x,
          y,
          w: cellSize * scale,
          h: cellSize * scale,
        });
      }
    }
    return zones;
  },

  render(ctx, config, canvasW, canvasH) {
    config._canvasW = canvasW;
    config._canvasH = canvasH;
    const diamondSize = config.params?.diamondSize ?? 4;
    const cellSize = diamondSize * Math.SQRT1_2;
    const { scale, offsetX, offsetY } = scaleToCanvas(config, canvasW, canvasH);

    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const cols = Math.ceil(vw / cellSize);
    const rows = Math.ceil(vh / cellSize);

    const visX = offsetX + config.hemSides * scale;
    const visY = offsetY + config.hemTop * scale;
    const visW = vw * scale;
    const visH = vh * scale;

    // Clip to visible curtain area
    ctx.save();
    ctx.beginPath();
    ctx.rect(visX, visY, visW, visH);
    ctx.clip();

    // Draw hem background
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(offsetX, offsetY, config.width * scale, config.height * scale);

    // Draw each diamond
    const halfSide = (diamondSize * scale) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isOddRow = r % 2 !== 0;
        const xOffset = isOddRow ? cellSize / 2 : 0;
        const cx = offsetX + (config.hemSides + c * cellSize + xOffset + cellSize / 2) * scale;
        const cy = offsetY + (config.hemTop + r * cellSize + cellSize / 2) * scale;
        const zoneId = `diamond-${r}-${c}`;
        const zoneColor = config.zoneColors?.[zoneId];

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);

        // Fill diamond
        ctx.fillStyle = zoneColor ? zoneColor.hex : '#e8e8e8';
        ctx.fillRect(-halfSide, -halfSide, diamondSize * scale, diamondSize * scale);

        // Stroke diamond edges
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(-halfSide, -halfSide, diamondSize * scale, diamondSize * scale);

        // Selected highlight
        if (config.selectedZone === zoneId) {
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-halfSide, -halfSide, diamondSize * scale, diamondSize * scale);
          ctx.setLineDash([]);
        }

        ctx.restore();
      }
    }

    // Remove clip
    ctx.restore();

    // Draw outer hem border stroke
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, config.width * scale, config.height * scale);
  },

  calculateCuts(config) {
    const diamondSize = config.params?.diamondSize ?? 4;
    const cellSize = diamondSize * Math.SQRT1_2;
    const seamAllowance = config.seamAllowance ?? 0;

    const vw = visibleWidth(config);
    const vh = visibleHeight(config);
    const cols = Math.ceil(vw / cellSize);
    const rows = Math.ceil(vh / cellSize);

    const groups = {};

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isOddRow = r % 2 !== 0;
        const isTop = r === 0;
        const isBottom = r === rows - 1;
        const isLeft = c === 0;
        const isRight = c === cols - 1;

        const zoneId = `diamond-${r}-${c}`;
        const zoneColor = config.zoneColors?.[zoneId];

        let name, cutWidth, cutHeight, visW, visH;

        if ((isTop || isBottom) && (isLeft || isRight)) {
          // Corner quarter-diamond
          name = 'Corner quarter-diamond';
          visW = diamondSize / 2;
          visH = diamondSize / 2;
          cutWidth = diamondSize / 2 + (isLeft ? config.hemSides : config.hemSides) + (isTop ? config.hemTop : config.hemBottom);
          cutHeight = cutWidth;
        } else if (isTop || isBottom) {
          // Top/bottom edge half-diamond
          name = isTop ? 'Top edge half-diamond' : 'Bottom edge half-diamond';
          visW = diamondSize;
          visH = diamondSize / 2;
          const hem = isTop ? config.hemTop : config.hemBottom;
          cutWidth = diamondSize + 2 * seamAllowance;
          cutHeight = diamondSize / 2 + seamAllowance + hem;
        } else if (isLeft || isRight) {
          // Left/right edge half-diamond
          name = isLeft ? 'Left edge half-diamond' : 'Right edge half-diamond';
          visW = diamondSize / 2;
          visH = diamondSize;
          cutWidth = diamondSize / 2 + seamAllowance + config.hemSides;
          cutHeight = diamondSize + 2 * seamAllowance;
        } else {
          // Full interior diamond
          name = 'Interior diamond';
          visW = diamondSize;
          visH = diamondSize;
          cutWidth = diamondSize + 2 * seamAllowance;
          cutHeight = diamondSize + 2 * seamAllowance;
        }

        const key = `${name}-${cutWidth}-${cutHeight}`;
        if (!groups[key]) {
          groups[key] = {
            name,
            quantity: 0,
            color: zoneColor ? zoneColor.hex : null,
            colorName: zoneColor ? zoneColor.name : null,
            cutWidth,
            cutHeight,
            visibleWidth: visW,
            visibleHeight: visH,
          };
        }
        groups[key].quantity++;
      }
    }

    return Object.values(groups);
  },
};
