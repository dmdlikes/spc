function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

function hueToName(h) {
  if (h < 15) return "Red";
  if (h < 40) return "Orange";
  if (h < 70) return "Yellow";
  if (h < 160) return "Green";
  if (h < 200) return "Cyan";
  if (h < 260) return "Blue";
  if (h < 300) return "Purple";
  if (h < 340) return "Pink";
  return "Red";
}

function removePopup() {
  const existing = document.querySelector(".picker-popup");
  if (existing) existing.remove();
}

export function renderPicker(container, onSelect) {
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(20, 20px)";
  container.style.gap = "2px";
  container.style.position = "relative";

  const hueSteps = [];
  for (let h = 0; h < 360; h += 18) {
    hueSteps.push(h);
  }

  const saturationLevels = [20, 40, 60, 80, 100];
  const lightnessLevels = [20, 35, 50, 65, 80];

  // Rows by lightness, then saturation sub-groups; columns by hue
  for (const l of lightnessLevels) {
    for (const s of saturationLevels) {
      for (const h of hueSteps) {
        const hex = hslToHex(h, s, l);
        const swatch = document.createElement("div");
        swatch.className = "swatch picker-swatch";
        swatch.style.width = "20px";
        swatch.style.height = "20px";
        swatch.style.backgroundColor = hex;
        swatch.style.cursor = "pointer";
        swatch.style.boxSizing = "border-box";

        swatch.addEventListener("click", (e) => {
          e.stopPropagation();
          removePopup();

          const popup = document.createElement("div");
          popup.className = "picker-popup";
          popup.style.position = "absolute";
          popup.style.zIndex = "1000";
          popup.style.background = "#fff";
          popup.style.border = "1px solid #ccc";
          popup.style.borderRadius = "4px";
          popup.style.padding = "8px";
          popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
          popup.style.display = "flex";
          popup.style.flexDirection = "column";
          popup.style.gap = "6px";

          const rect = swatch.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          popup.style.left = (rect.left - containerRect.left) + "px";
          popup.style.top = (rect.bottom - containerRect.top + 4) + "px";

          const preview = document.createElement("div");
          preview.style.width = "40px";
          preview.style.height = "40px";
          preview.style.backgroundColor = hex;
          preview.style.border = "1px solid #ccc";

          const input = document.createElement("input");
          input.type = "text";
          input.value = hueToName(h);
          input.style.padding = "2px 4px";
          input.style.fontSize = "13px";

          const addBtn = document.createElement("button");
          addBtn.textContent = "Add";
          addBtn.style.cursor = "pointer";
          addBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            onSelect({ name: input.value, hex });
            removePopup();
          });

          popup.appendChild(preview);
          popup.appendChild(input);
          popup.appendChild(addBtn);
          popup.addEventListener("click", (ev) => ev.stopPropagation());
          container.appendChild(popup);
        });

        container.appendChild(swatch);
      }
    }
  }

  document.addEventListener("click", () => {
    removePopup();
  });
}
