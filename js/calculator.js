/**
 * Utility functions for pattern calculations.
 */

export function scaleToCanvas(config, canvasWidth, canvasHeight) {
  const padding = 40;
  const scale = Math.min(
    (canvasWidth - padding * 2) / config.width,
    (canvasHeight - padding * 2) / config.height
  );
  const offsetX = (canvasWidth - config.width * scale) / 2;
  const offsetY = (canvasHeight - config.height * scale) / 2;
  return { scale, offsetX, offsetY };
}

export function visibleWidth(config) {
  return config.width - config.hemSides * 2;
}

export function visibleHeight(config) {
  return config.height - config.hemTop - config.hemBottom;
}

export function tileCutWidth(visibleTileWidth, seamAllowance, isLeftEdge, isRightEdge, hemSides) {
  let width = visibleTileWidth;
  if (!isLeftEdge) width += seamAllowance;
  if (!isRightEdge) width += seamAllowance;
  if (isLeftEdge) width += hemSides;
  if (isRightEdge) width += hemSides;
  return width;
}

export function tileCutHeight(visibleTileHeight, seamAllowance, isTopEdge, isBottomEdge, hemTop, hemBottom) {
  let height = visibleTileHeight;
  if (!isTopEdge) height += seamAllowance;
  if (!isBottomEdge) height += seamAllowance;
  if (isTopEdge) height += hemTop;
  if (isBottomEdge) height += hemBottom;
  return height;
}

/**
 * Draw dimension labels on zones.
 * Zones must have: x, y, w, h (canvas pixels) and visW, visH (inches).
 * Also draws overall curtain dimensions on the outside.
 */
export function drawDimensions(ctx, zones, config, scale, offsetX, offsetY) {
  ctx.save();
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const zone of zones) {
    if (!zone.visW || !zone.visH) continue;

    // Only label zones large enough to fit text
    if (zone.w < 28 || zone.h < 16) continue;

    const label = `${fmtDim(zone.visW)}x${fmtDim(zone.visH)}`;
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;

    // Background for readability
    const metrics = ctx.measureText(label);
    const tw = metrics.width + 4;
    const th = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(cx - tw / 2, cy - th / 2, tw, th);

    ctx.fillStyle = '#444';
    ctx.fillText(label, cx, cy);
  }

  // Overall dimensions on outside
  const totalW = config.width * scale;
  const totalH = config.height * scale;

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#333';

  // Width label (top)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${fmtDim(config.width)}"`, offsetX + totalW / 2, offsetY - 6);

  // Height label (left)
  ctx.save();
  ctx.translate(offsetX - 6, offsetY + totalH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${fmtDim(config.height)}"`, 0, 0);
  ctx.restore();

  ctx.restore();
}

function fmtDim(n) {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}
