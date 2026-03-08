// Pojagi Studio — Main Application

// Pattern imports
import { TilePattern } from './patterns/tile.js';
import { FramePattern } from './patterns/frame.js';
import { SquarePattern } from './patterns/square.js';
import { DiamondPattern } from './patterns/diamond.js';
import { NestedPattern } from './patterns/nested.js';

// Picker import
import { renderPicker } from './picker.js';

// PDF export
import { exportPDF, exportClientPDF } from './pdf.js';

// Calculator
import { scaleToCanvas } from './calculator.js';

// Color imports
import { loadLibraries, renderSwatchGrid, addCustomColor } from './colors.js';

const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');

// App state
const state = {
  pattern: 'tile',
  width: 40,
  height: 60,
  hemSides: 1,
  hemTop: 3,
  hemBottom: 1,
  seamAllowance: 0.5,
  params: {},       // pattern-specific params
  zoneColors: {},   // zoneId -> { name, hex }
  selectedZone: null,
  zones: [],
  viewMode: 'design', // 'design' or 'cutsheet'
};

// Registered patterns (populated as patterns are implemented)
const patterns = {};

function getConfig() {
  return {
    width: state.width,
    height: state.height,
    hemSides: state.hemSides,
    hemTop: state.hemTop,
    hemBottom: state.hemBottom,
    seamAllowance: state.seamAllowance,
    params: state.params,
    zoneColors: state.zoneColors,
    selectedZone: state.selectedZone,
  };
}

export function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pattern = patterns[state.pattern];
  if (!pattern) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#999';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select a pattern', canvas.width / 2, canvas.height / 2);
    return;
  }

  const config = getConfig();
  state.zones = pattern.getZones(config);

  if (state.viewMode === 'cutsheet') {
    renderCutSheetView(ctx, config, pattern);
  } else {
    pattern.render(ctx, config, canvas.width, canvas.height);
  }
}

function renderCutSheetView(ctx, config, pattern) {
  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const zones = state.zones;
  const sa = config.seamAllowance;

  if (!zones.length) return;

  // We need to compute each zone's cutting dimensions and position them
  // in the same spatial arrangement but with gaps between pieces.
  // Each piece grows by seam allowances on all sides, so we need to:
  // 1. Keep the same center positions as design view
  // 2. But scale everything so the expanded pieces + gaps fit

  // Gap between pieces (in inches, before scaling)
  const gapInches = 0.8;

  // Compute how many seam boundaries exist in each axis
  // by looking at unique x-edges and y-edges
  const xEdges = new Set();
  const yEdges = new Set();
  for (const z of zones) {
    if (!z.visW) continue;
    xEdges.add(Math.round(z.x * 100));
    xEdges.add(Math.round((z.x + z.w) * 100));
    yEdges.add(Math.round(z.y * 100));
    yEdges.add(Math.round((z.y + z.h) * 100));
  }
  const numXGaps = xEdges.size - 1;
  const numYGaps = yEdges.size - 1;

  // Get the design view's scale and offset for reference
  const { scale: designScale, offsetX: designOffsetX, offsetY: designOffsetY } =
    scaleToCanvas(config, canvasW, canvasH);

  // Total design pixel size
  const designW = config.width * designScale;
  const designH = config.height * designScale;

  // Extra space needed for gaps (in canvas pixels)
  const totalExtraX = numXGaps * gapInches * designScale;
  const totalExtraY = numYGaps * gapInches * designScale;

  // New scale to fit the exploded view
  const explodedW = designW + totalExtraX;
  const explodedH = designH + totalExtraY;
  const fitScale = Math.min(
    (canvasW - 60) / explodedW,
    (canvasH - 60) / explodedH,
    1.0
  );

  // Sort edges to create index mapping
  const sortedX = [...xEdges].sort((a, b) => a - b);
  const sortedY = [...yEdges].sort((a, b) => a - b);

  function xEdgeIndex(px) {
    const rounded = Math.round(px * 100);
    return sortedX.indexOf(rounded);
  }
  function yEdgeIndex(py) {
    const rounded = Math.round(py * 100);
    return sortedY.indexOf(rounded);
  }

  // Offset so exploded view is centered
  const baseX = (canvasW - explodedW * fitScale) / 2;
  const baseY = (canvasH - explodedH * fitScale) / 2;

  const gapPx = gapInches * designScale * fitScale;
  const saPx = sa * designScale * fitScale;

  ctx.save();

  for (const zone of zones) {
    if (!zone.visW) continue;

    // Original position relative to design origin
    const relX = zone.x - designOffsetX;
    const relY = zone.y - designOffsetY;
    const origW = zone.w;
    const origH = zone.h;

    // How many gaps to insert before this zone's left edge and top edge
    const gapsLeft = xEdgeIndex(zone.x);
    const gapsTop = yEdgeIndex(zone.y);

    // New position: original position * fitScale + gaps * gapPx + expand by sa
    const newX = baseX + relX * fitScale + gapsLeft * gapPx - saPx;
    const newY = baseY + relY * fitScale + gapsTop * gapPx - saPx;
    const newW = origW * fitScale + 2 * saPx;
    const newH = origH * fitScale + 2 * saPx;

    // Fill with color
    const color = config.zoneColors?.[zone.id];
    ctx.fillStyle = color ? color.hex : '#e8e8e8';
    ctx.fillRect(newX, newY, newW, newH);

    // Outer edge = cutting line (solid)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(newX, newY, newW, newH);

    // Inner dashed line = visible area (fold/seam line)
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(newX + saPx, newY + saPx, newW - 2 * saPx, newH - 2 * saPx);
    ctx.setLineDash([]);

    // Cutting dimension label
    const cutW = zone.visW + 2 * sa;
    const cutH = zone.visH + 2 * sa;
    const label = `${fmtDim(cutW)}" x ${fmtDim(cutH)}"`;

    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (newW > 35 && newH > 14) {
      // Label inside
      const cx = newX + newW / 2;
      const cy = newY + newH / 2;
      const tm = ctx.measureText(label);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(cx - tm.width / 2 - 2, cy - 6, tm.width + 4, 12);
      ctx.fillStyle = '#c0392b';
      ctx.fillText(label, cx, cy);
    }
  }

  // Title
  ctx.fillStyle = '#333';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Cut Sheet — cutting dimensions (solid = cut line, dashed = fold/seam line)', 10, 8);

  ctx.restore();
}

function fmtDim(n) {
  if (Number.isInteger(n)) return n.toString();
  // Show fractions cleanly
  const frac = n - Math.floor(n);
  if (Math.abs(frac - 0.5) < 0.01) return Math.floor(n) + '.5';
  if (Math.abs(frac - 0.25) < 0.01) return Math.floor(n) + '.25';
  if (Math.abs(frac - 0.75) < 0.01) return Math.floor(n) + '.75';
  return n.toFixed(2);
}

function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  // Find which zone was clicked
  for (const zone of state.zones) {
    if (x >= zone.x && x <= zone.x + zone.w &&
        y >= zone.y && y <= zone.y + zone.h) {
      state.selectedZone = zone.id;
      updateZoneIndicator();
      render();
      canvas.focus();
      return;
    }
  }

  // Clicked outside any zone — deselect
  state.selectedZone = null;
  updateZoneIndicator();
  render();
}

function readInputs() {
  state.width = parseFloat(document.getElementById('input-width').value) || 40;
  state.height = parseFloat(document.getElementById('input-height').value) || 60;
  state.hemSides = parseFloat(document.getElementById('input-hem-sides').value) || 1;
  state.hemTop = parseFloat(document.getElementById('input-hem-top').value) || 3;
  state.hemBottom = parseFloat(document.getElementById('input-hem-bottom').value) || 1;
  state.seamAllowance = parseFloat(document.getElementById('input-seam').value) || 0.5;

  // Read pattern-specific params
  const paramsDiv = document.getElementById('pattern-params');
  for (const input of paramsDiv.querySelectorAll('input')) {
    state.params[input.dataset.param] = parseFloat(input.value);
  }
}

function onInputChange() {
  readInputs();
  render();
  updateCutSheet();
}

function onPatternChange() {
  state.pattern = document.getElementById('pattern-select').value;
  state.zoneColors = {};
  state.selectedZone = null;
  state.params = {};

  // Render pattern-specific params
  const paramsDiv = document.getElementById('pattern-params');
  paramsDiv.innerHTML = '';
  const pattern = patterns[state.pattern];
  if (pattern) {
    for (const p of pattern.getParams()) {
      state.params[p.name] = p.default;
      const label = document.createElement('label');
      label.textContent = p.label;
      const input = document.createElement('input');
      input.type = 'number';
      input.value = p.default;
      input.min = p.min;
      input.max = p.max;
      input.dataset.param = p.name;
      input.addEventListener('input', onInputChange);
      paramsDiv.appendChild(label);
      paramsDiv.appendChild(input);
    }
  }

  render();
  updateCutSheet();
}

export function updateCutSheet() {
  const cutSheetDiv = document.getElementById('cut-sheet');
  const pattern = patterns[state.pattern];
  if (!pattern) {
    cutSheetDiv.innerHTML = '';
    return;
  }

  const config = getConfig();
  const cuts = pattern.calculateCuts(config);

  let html = '<h3>Cut Sheet</h3><table>';
  html += '<tr><th>Piece</th><th>Qty</th><th>Color</th><th>Cut W</th><th>Cut H</th></tr>';
  for (const cut of cuts) {
    const colorSwatch = cut.color
      ? `<span style="display:inline-block;width:12px;height:12px;background:${cut.color};border:1px solid #ccc;vertical-align:middle;"></span> `
      : '';
    html += `<tr>
      <td>${cut.name}</td>
      <td>${cut.quantity}</td>
      <td>${colorSwatch}${cut.colorName || '—'}</td>
      <td>${cut.cutWidth.toFixed(2)}"</td>
      <td>${cut.cutHeight.toFixed(2)}"</td>
    </tr>`;
  }
  html += '</table>';
  cutSheetDiv.innerHTML = html;
}

// Assign a color to the selected zone
export function assignColor(colorEntry) {
  if (state.selectedZone) {
    state.zoneColors[state.selectedZone] = colorEntry;
    render();
    updateCutSheet();
  }
}

// Register a pattern module
export function registerPattern(name, patternModule) {
  patterns[name] = patternModule;
}

// --- Keyboard navigation ---
function findNearestZone(direction) {
  if (!state.zones.length) return null;

  // If nothing selected, pick the first zone
  if (!state.selectedZone) return state.zones[0].id;

  const current = state.zones.find(z => z.id === state.selectedZone);
  if (!current) return state.zones[0].id;

  const cx = current.x + current.w / 2;
  const cy = current.y + current.h / 2;

  let best = null;
  let bestDist = Infinity;

  for (const zone of state.zones) {
    if (zone.id === current.id) continue;
    const zx = zone.x + zone.w / 2;
    const zy = zone.y + zone.h / 2;
    const dx = zx - cx;
    const dy = zy - cy;

    // Filter by direction
    let valid = false;
    if (direction === 'ArrowRight' && dx > 1) valid = true;
    if (direction === 'ArrowLeft' && dx < -1) valid = true;
    if (direction === 'ArrowDown' && dy > 1) valid = true;
    if (direction === 'ArrowUp' && dy < -1) valid = true;

    if (!valid) continue;

    // Distance with bias toward the primary axis
    let dist;
    if (direction === 'ArrowRight' || direction === 'ArrowLeft') {
      dist = Math.abs(dx) + Math.abs(dy) * 3; // penalize vertical offset
    } else {
      dist = Math.abs(dy) + Math.abs(dx) * 3; // penalize horizontal offset
    }

    if (dist < bestDist) {
      bestDist = dist;
      best = zone.id;
    }
  }
  return best;
}

function handleKeydown(e) {
  // Only capture when canvas has focus or body has focus (not typing in inputs)
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const next = findNearestZone(e.key);
    if (next) {
      state.selectedZone = next;
      updateZoneIndicator();
      render();
    }
  }

  // Tab to advance to next zone sequentially
  if (e.key === 'Tab' && state.zones.length) {
    e.preventDefault();
    const idx = state.zones.findIndex(z => z.id === state.selectedZone);
    const next = e.shiftKey
      ? (idx <= 0 ? state.zones.length - 1 : idx - 1)
      : (idx + 1) % state.zones.length;
    state.selectedZone = state.zones[next].id;
    updateZoneIndicator();
    render();
  }

  // Escape to deselect
  if (e.key === 'Escape') {
    state.selectedZone = null;
    updateZoneIndicator();
    render();
  }
}

function updateZoneIndicator() {
  const el = document.getElementById('zone-indicator');
  if (state.selectedZone) {
    el.textContent = `Selected: ${state.selectedZone}`;
    el.style.color = '#e74c3c';
  } else {
    el.textContent = 'Use arrow keys to navigate zones';
    el.style.color = '#666';
  }
}

// --- Save / Load designs ---
const DESIGNS_KEY = 'pojagi-saved-designs';

function getSavedDesigns() {
  try {
    return JSON.parse(localStorage.getItem(DESIGNS_KEY)) || {};
  } catch { return {}; }
}

function saveDesign() {
  const name = prompt('Design name:');
  if (!name) return;
  const designs = getSavedDesigns();
  designs[name] = {
    pattern: state.pattern,
    width: state.width,
    height: state.height,
    hemSides: state.hemSides,
    hemTop: state.hemTop,
    hemBottom: state.hemBottom,
    seamAllowance: state.seamAllowance,
    params: { ...state.params },
    zoneColors: { ...state.zoneColors },
  };
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
  refreshDesignList();
}

function loadDesign(name) {
  const designs = getSavedDesigns();
  const d = designs[name];
  if (!d) return;

  state.pattern = d.pattern;
  state.width = d.width;
  state.height = d.height;
  state.hemSides = d.hemSides;
  state.hemTop = d.hemTop;
  state.hemBottom = d.hemBottom;
  state.seamAllowance = d.seamAllowance;
  state.params = { ...d.params };
  state.zoneColors = { ...d.zoneColors };
  state.selectedZone = null;

  // Update form inputs
  document.getElementById('pattern-select').value = state.pattern;
  document.getElementById('input-width').value = state.width;
  document.getElementById('input-height').value = state.height;
  document.getElementById('input-hem-sides').value = state.hemSides;
  document.getElementById('input-hem-top').value = state.hemTop;
  document.getElementById('input-hem-bottom').value = state.hemBottom;
  document.getElementById('input-seam').value = state.seamAllowance;

  // Rebuild pattern params UI
  const paramsDiv = document.getElementById('pattern-params');
  paramsDiv.innerHTML = '';
  const pattern = patterns[state.pattern];
  if (pattern) {
    for (const p of pattern.getParams()) {
      const label = document.createElement('label');
      label.textContent = p.label;
      const input = document.createElement('input');
      input.type = 'number';
      input.value = state.params[p.name] ?? p.default;
      input.min = p.min;
      input.max = p.max;
      input.dataset.param = p.name;
      input.addEventListener('input', onInputChange);
      paramsDiv.appendChild(label);
      paramsDiv.appendChild(input);
    }
  }

  render();
  updateCutSheet();
  updateZoneIndicator();
}

function deleteDesign() {
  const select = document.getElementById('design-select');
  const name = select.value;
  if (!name) return;
  if (!confirm(`Delete "${name}"?`)) return;
  const designs = getSavedDesigns();
  delete designs[name];
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
  refreshDesignList();
}

function refreshDesignList() {
  const select = document.getElementById('design-select');
  const designs = getSavedDesigns();
  select.innerHTML = '<option value="">— Load a design —</option>';
  for (const name of Object.keys(designs).sort()) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }
}

// Export state for other modules
export { state, patterns, canvas, ctx };

// Init
async function init() {
  // Event listeners
  document.getElementById('pattern-select').addEventListener('change', onPatternChange);
  for (const id of ['input-width', 'input-height', 'input-hem-sides', 'input-hem-top', 'input-hem-bottom', 'input-seam']) {
    document.getElementById(id).addEventListener('input', onInputChange);
  }
  canvas.addEventListener('click', handleCanvasClick);

  // Load color libraries
  const libs = await loadLibraries();
  const onColorSelect = (color) => assignColor(color);
  renderSwatchGrid(document.getElementById('swatches-il019'), libs.il019, onColorSelect);
  renderSwatchGrid(document.getElementById('swatches-il020'), libs.il020, onColorSelect);
  renderSwatchGrid(document.getElementById('swatches-custom'), libs.custom, onColorSelect);

  // Visual color picker
  renderPicker(document.getElementById('color-picker'), (color) => {
    const custom = addCustomColor(color.name, color.hex);
    renderSwatchGrid(document.getElementById('swatches-custom'), custom, onColorSelect);
    assignColor(color);
  });

  // Export PDF button (full — 2 pages with dimensions + cut sheet)
  document.getElementById('btn-export').addEventListener('click', () => {
    const config = getConfig();
    config.patternName = state.pattern;
    const pattern = patterns[state.pattern];
    if (pattern) {
      exportPDF(config, pattern, canvas);
    }
  });

  // Client PDF button (clean 1-page preview, no dimensions)
  document.getElementById('btn-client-pdf').addEventListener('click', () => {
    const config = getConfig();
    config.patternName = state.pattern;
    config.hideDimensions = true;
    config.hideHem = true;
    const pattern = patterns[state.pattern];
    if (pattern) {
      // Temporarily render design view without dimensions for the capture
      const prevMode = state.viewMode;
      const prevZone = state.selectedZone;
      state.viewMode = 'design';
      state.selectedZone = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pattern.render(ctx, config, canvas.width, canvas.height);
      exportClientPDF(config, pattern, canvas);
      // Restore
      state.viewMode = prevMode;
      state.selectedZone = prevZone;
      render();
    }
  });

  // View toggle
  document.getElementById('btn-design-view').addEventListener('click', () => {
    state.viewMode = 'design';
    document.getElementById('btn-design-view').classList.add('active');
    document.getElementById('btn-cut-view').classList.remove('active');
    render();
  });
  document.getElementById('btn-cut-view').addEventListener('click', () => {
    state.viewMode = 'cutsheet';
    document.getElementById('btn-cut-view').classList.add('active');
    document.getElementById('btn-design-view').classList.remove('active');
    render();
  });

  // Keyboard navigation — on canvas and document
  canvas.addEventListener('keydown', handleKeydown);
  document.addEventListener('keydown', handleKeydown);

  // Save / Load designs
  document.getElementById('btn-save').addEventListener('click', saveDesign);
  document.getElementById('btn-delete-design').addEventListener('click', deleteDesign);
  document.getElementById('design-select').addEventListener('change', (e) => {
    if (e.target.value) loadDesign(e.target.value);
  });
  refreshDesignList();

  // Register patterns
  registerPattern('tile', TilePattern);
  registerPattern('square', SquarePattern);
  registerPattern('frame', FramePattern);
  registerPattern('diamond', DiamondPattern);
  registerPattern('nested', NestedPattern);

  // Initialize with default pattern
  onPatternChange();
  console.log('Pojagi Studio loaded');
}

init();
