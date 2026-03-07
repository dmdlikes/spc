// Color Library — load, render, and manage color swatches

const STORAGE_KEY = 'pojagi-custom-colors';

export async function loadLibraries() {
  const [il019, il020] = await Promise.all([
    fetch('data/il019-colors.json').then(r => r.json()),
    fetch('data/il020-colors.json').then(r => r.json()),
  ]);
  const custom = getCustomColors();
  return { il019, il020, custom };
}

export function renderSwatchGrid(container, colors, onSelect) {
  container.innerHTML = '';
  for (const color of colors) {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color.hex;
    swatch.title = `${color.name} (${color.hex})`;
    swatch.addEventListener('click', () => onSelect(color));
    container.appendChild(swatch);
  }
}

export function addCustomColor(name, hex) {
  const custom = getCustomColors();
  custom.push({ name, hex, source: 'custom', line: 'Custom', slug: '' });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  return custom;
}

export function getCustomColors() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
