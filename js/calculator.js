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
