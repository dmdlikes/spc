// Pojagi Studio — Main Application

// Pattern imports
import { TilePattern } from './patterns/tile.js';
import { FramePattern } from './patterns/frame.js';
import { DiamondPattern } from './patterns/diamond.js';
import { NestedPattern } from './patterns/nested.js';

// Picker import
import { renderPicker } from './picker.js';

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
  if (pattern) {
    const config = getConfig();
    state.zones = pattern.getZones(config);
    pattern.render(ctx, config, canvas.width, canvas.height);
  } else {
    // Placeholder when no pattern is loaded
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#999';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select a pattern', canvas.width / 2, canvas.height / 2);
  }
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
      render();
      return;
    }
  }

  // Clicked outside any zone — deselect
  state.selectedZone = null;
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

  // Register patterns
  registerPattern('tile', TilePattern);
  registerPattern('frame', FramePattern);
  registerPattern('diamond', DiamondPattern);
  registerPattern('nested', NestedPattern);

  // Initialize with default pattern
  onPatternChange();
  console.log('Pojagi Studio loaded');
}

init();
