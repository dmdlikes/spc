# Pojagi Studio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based tool for Stella to visualize pojagi curtain color options and calculate cutting measurements, exporting PDF proofs for clients.

**Architecture:** Static HTML + Canvas app with no build step, no framework, no server. Pattern modules render to canvas and compute cut sheets. Color libraries loaded from JSON. PDF generated client-side with jsPDF.

**Tech Stack:** HTML5 Canvas, vanilla JS (ES modules via `<script type="module">`), CSS Grid layout, jsPDF for PDF export.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`

**Step 1: Create directory structure**

```bash
cd /Users/dmd/pojagi-studio
mkdir -p css js/patterns data lib
```

**Step 2: Create index.html with three-panel layout**

Create `index.html` with:
- DOCTYPE, charset, viewport meta
- Link to `css/style.css`
- Three-panel layout using CSS Grid:
  - `#settings-panel` (left) — pattern dropdown, dimension inputs, hem/seam inputs, pattern-specific params div, Export PDF button
  - `#preview-panel` (center) — `<canvas id="preview-canvas">`, div for cut sheet summary
  - `#colors-panel` (right) — sections for IL019, IL020, Custom, and Visual Picker
- Script tag: `<script type="module" src="js/app.js"></script>`
- Header: "Pojagi Studio"

**Step 3: Create style.css**

Create `css/style.css` with:
- CSS Grid: `grid-template-columns: 280px 1fr 300px` for the three panels
- Left/right panels: scrollable, light gray background, padding
- Center panel: flex column, canvas centered, white background
- Swatch grid: CSS Grid of small colored squares (32x32px) with gap
- Selected zone highlight style (dashed border on canvas)
- Form inputs styled simply
- Responsive: panels stack vertically below 1024px

**Step 4: Create app.js stub**

Create `js/app.js` that:
- Imports pattern modules (stubbed for now)
- Imports colors module (stubbed for now)
- Sets up event listeners for pattern dropdown and dimension inputs
- Has a `render()` function that clears canvas and calls the current pattern's render
- Has a `handleCanvasClick(e)` that will detect which zone was clicked
- Logs "Pojagi Studio loaded" to console

**Step 5: Verify scaffolding works**

Open `index.html` in browser. Should see three-panel layout with empty canvas. Console shows "Pojagi Studio loaded".

**Step 6: Commit**

```bash
git add index.html css/ js/app.js
git commit -m "feat: project scaffolding with three-panel layout"
```

---

### Task 2: Color Library Data — Scrape IL019 & IL020

**Files:**
- Create: `scripts/scrape-colors.py` (one-time build script, not part of the app)
- Create: `data/il019-colors.json`
- Create: `data/il020-colors.json`
- Create: `data/custom-colors.json`

**Step 1: Create the scraper script**

Create `scripts/scrape-colors.py` that:
1. Has a list of IL019 fabric slugs (48 entries) and IL020 slugs (29 entries), derived from the fabric-store.com catalog page we already scraped.
2. For each slug, constructs the product page URL: `https://fabrics-store.com/fabrics/{slug}`
3. Fetches the page HTML with a browser-like User-Agent
4. Extracts the main product image URL (pattern: `https://fabrics-store.com/images/product/FS_F_*_500x500.jpg` — use the first 500x500 image found)
5. Downloads the image
6. Uses PIL (Pillow) to open the image, crop to the center 20% region, and compute the average RGB
7. Extracts the color name from the slug (e.g., `linen-fabric-IL019-dusty-rose-fs-signature-finish-medium` → "Dusty Rose")
8. Writes JSON output:
```json
[
  { "name": "Dusty Rose", "hex": "#C4A4A0", "source": "fabrics-store.com", "line": "IL019", "slug": "linen-fabric-IL019-dusty-rose-fs-signature-finish-medium" }
]
```
9. Handles Cloudflare blocks gracefully — if a page returns 403, skip it and log a warning. We can fill in missing colors manually.
10. Adds a 2-second delay between requests to be polite.

IL019 slugs (signature finish only, deduplicated):
```
agave-fs-signature-finish-middle
amethyst-orchid-fs-signature-finish-medium
antique-white-fs-signature-finish-medium
autumn-gold-fs-signature-finish-middle
beet-red-fs-signature-finish-medium
black-fs-signature-finish-middle
bleached-fs-signature-finish-middle
blue-bonnet-fs-signature-finish-middle
blue-heaven-fs-signature-finish-medium
cobalt-fs-signature-finish-middle
coffee-bean-fs-signature-finish-medium
crimson-fs-signature-finish-middle
deep-ultramarine-fs-signature-finish-medium
dried-herb-fs-signature-finish-medium
dusty-lotus-fs-signature-finish-middle
dusty-rose-fs-signature-finish-medium
emerald-fs-signature-finish-medium
evergreen-fs-signature-finish-middle
insignia-blue-fs-signature-finish-middle
japanese-blue-fs-signature-finish-medium
kenya-fs-signature-finish-middle
meadow-fs-signature-finish-middle
medieval-blue-fs-signature-finish-medium
mix-natural-fs-signature-finish-middle
moroccan-blue-fs-signature-finish-medium
natural-fs-signature-finish-middle
nine-iron-fs-signature-finish-middle
olive-branch-fs-signature-finish-middle
optic-white-fs-signature-finish-middle
parchment-fs-signature-finish-medium
potting-soil-fs-signature-finish-medium
royal-blue-fs-signature-finish-medium
royal-purple-fs-signature-finish-middle
sahara-rose-fs-signature-finish-medium
soft-pink-fs-signature-finish-medium
sphinx-fs-signature-finish-middle
spice-fs-signature-finish-medium
tea-rose-fs-signature-finish-medium
tourmaline-fs-signature-finish-medium
vineyard-green-fs-signature-finish-medium
willow-fs-signature-finish-medium
```

IL020 slugs:
```
abyss-softened-light
basile-softened-light
black-softened-light
bleached-softened-light
blue-apatite-softened-light
bougainvillea-softened-light
camel-softened-light
cobalt-softened-light
coral-softened-light
dahlia-softened-light
dawn-softened-light
emerald-softened-light
gouache-softened-light
grey-whisper-softened-light
hedge-green-softened-light
krista-natural-softened-light
light-blue-softened-light
meadow-softened-light
mediterranean-blue-softened-light
mushroom-softened-light
natural-light
optic-white-softened-light
perfectly-pale-softened-light
powder-blue-softened-light
royal-purple-softened-light
shadow-grey-softened-light
silver-lilac-softened-light
tadelakt-softened-light
```

**Step 2: Install Pillow if needed**

```bash
pip3 install Pillow requests
```

**Step 3: Run the scraper**

```bash
python3 scripts/scrape-colors.py
```

Expected: `data/il019-colors.json` and `data/il020-colors.json` populated. Some may be skipped due to Cloudflare — check output and fill in manually if needed.

**Step 4: Create custom-colors.json template**

Create `data/custom-colors.json`:
```json
[]
```

**Step 5: Verify JSON files are valid**

```bash
python3 -m json.tool data/il019-colors.json > /dev/null && echo "IL019 OK"
python3 -m json.tool data/il020-colors.json > /dev/null && echo "IL020 OK"
```

**Step 6: Commit**

```bash
git add scripts/ data/
git commit -m "feat: scrape IL019/IL020 color libraries from fabrics-store.com"
```

---

### Task 3: Color Library UI

**Files:**
- Create: `js/colors.js`
- Modify: `js/app.js`
- Modify: `index.html` (if needed for markup)

**Step 1: Create colors.js**

Create `js/colors.js` that exports:
- `loadLibraries()` — fetches `il019-colors.json`, `il020-colors.json`, loads custom colors from localStorage. Returns `{ il019: [...], il020: [...], custom: [...] }`.
- `renderSwatchGrid(container, colors, onSelect)` — renders a grid of clickable colored squares into a DOM container. Each swatch shows the hex color as background, the color name as tooltip. Clicking calls `onSelect(colorEntry)`.
- `addCustomColor(name, hex)` — adds to custom colors array and persists to localStorage.
- `getCustomColors()` — reads from localStorage, returns array.

**Step 2: Wire colors into app.js**

Modify `js/app.js` to:
- On load, call `loadLibraries()` and render swatch grids into the three library sections in the right panel
- Track `selectedZone` state — when a zone is selected in the canvas, clicking a swatch assigns that color to the zone and re-renders

**Step 3: Verify**

Open in browser. Should see colored swatch grids in the right panel. Clicking a swatch logs the color to console.

**Step 4: Commit**

```bash
git add js/colors.js js/app.js
git commit -m "feat: color library loading and swatch grid UI"
```

---

### Task 4: Visual Color Picker

**Files:**
- Create: `js/picker.js`
- Modify: `js/app.js`

**Step 1: Create picker.js**

Create `js/picker.js` that exports:
- `renderPicker(container, onSelect)` — generates a grid of ~500 colors organized by hue (columns) and lightness (rows). Uses HSL color space: 20 hue steps (0-360 in increments of 18) x 5 saturation levels x 5 lightness levels = 500 swatches. Each is a small clickable square. Clicking opens a small popup: "Name this color:" text input + "Add" button. On add, calls `onSelect({ name, hex })`.

**Step 2: Wire into app.js**

Add the picker to the bottom of the colors panel. When a color is added via the picker, it goes into the custom library and the custom swatch grid re-renders.

**Step 3: Verify**

Open in browser. Should see a rainbow grid at the bottom of the colors panel. Click a color, name it, see it appear in the custom colors section.

**Step 4: Commit**

```bash
git add js/picker.js js/app.js
git commit -m "feat: visual color picker with custom color naming"
```

---

### Task 5: Tile Pattern (First Pattern)

**Files:**
- Create: `js/patterns/tile.js`
- Create: `js/calculator.js`
- Modify: `js/app.js`

Start with Tile because it's the simplest geometrically — a grid of equal rectangles.

**Step 1: Create calculator.js**

Create `js/calculator.js` that exports:
- `scaleToCanvas(config, canvasWidth, canvasHeight)` — returns a scale factor and offsets to render the curtain proportionally within the canvas, with padding.
- `visibleWidth(config)` — returns `config.width - config.hemSides * 2` (the visible width inside the outer hems)
- `visibleHeight(config)` — returns `config.height - config.hemTop - config.hemBottom`
- `tileCutWidth(visibleTileWidth, seamAllowance, isLeftEdge, isRightEdge, hemSides)` — returns the cutting width for a single tile, adding seamAllowance on internal edges and hemSides on outer edges.
- `tileCutHeight(visibleTileHeight, seamAllowance, isTopEdge, isBottomEdge, hemTop, hemBottom)` — same for height.

**Step 2: Create tile.js**

Create `js/patterns/tile.js` that exports `TilePattern` with:

- `getParams()` — returns `[{ name: "cols", label: "Columns", default: 5, min: 1, max: 20 }, { name: "rows", label: "Rows", default: 7, min: 1, max: 20 }]`

- `getZones(config)` — returns an array of zones, one per tile:
  ```js
  [{ id: "tile-0-0", row: 0, col: 0, x, y, w, h }]
  ```
  Each tile's visible width = `visibleWidth / cols`, visible height = `visibleHeight / rows`. x/y are pixel positions on canvas (using scaleToCanvas).

- `render(ctx, config, canvasW, canvasH)`:
  1. Compute scale factor via calculator
  2. Draw outer hem area as a thin border
  3. For each tile, fill with the assigned color (or a default light gray)
  4. Draw seam lines between tiles (dark lines, ~2px)
  5. If a zone is selected, draw a dashed highlight border on it

- `calculateCuts(config)`:
  1. Compute visible tile dimensions
  2. For each tile position, compute cutting dimensions by adding appropriate seam/hem allowances based on edge position
  3. Group identical pieces (e.g., all interior tiles are the same size)
  4. Return array:
  ```js
  [{ name: "Interior tile", quantity: 15, color: "#xxx", cutWidth: 5.5, cutHeight: 7.5, visibleWidth: 4.5, visibleHeight: 6.5 }]
  ```

**Step 3: Wire tile pattern into app.js**

- Import TilePattern
- When pattern dropdown = "Tile", show cols/rows inputs in the settings panel
- On any change (dimensions, params, colors), call render and update cut sheet display
- On canvas click, use getZones to find which tile was clicked, set it as selectedZone

**Step 4: Verify**

Open in browser. Select Tile pattern. Enter dimensions (e.g., 40" x 60"). See a grid of tiles on canvas. Click a tile — it highlights. Click a color swatch — tile fills. Change cols/rows — grid updates. Cut sheet shows below canvas.

**Step 5: Commit**

```bash
git add js/patterns/tile.js js/calculator.js js/app.js
git commit -m "feat: tile pattern with rendering, zone selection, and cut calculation"
```

---

### Task 6: Frame Pattern

**Files:**
- Create: `js/patterns/frame.js`
- Modify: `js/app.js`

**Step 1: Create frame.js**

Create `js/patterns/frame.js` that exports `FramePattern` with:

- `getParams()` — returns:
  - `borderWidth`: width of the border strip in inches (default: 3)
  - `squaresPerSide`: number of accent squares on longest side (default: 8, min: 2)

- `getZones(config)`:
  Zones are:
  - `center` — the large center panel
  - `border-bars` — the rectangular strips between squares
  - `border-squares` — the small accent squares in the border
  - `outer-border` — optional outer strip framing everything

  Compute positions: center panel is `(visibleWidth - 2*borderWidth) x (visibleHeight - 2*borderWidth)`. Border squares are `borderWidth x borderWidth`. Border bars fill the gaps between squares.

- `render(ctx, config, canvasW, canvasH)`:
  1. Draw center panel fill
  2. Draw border bars
  3. Draw border squares (evenly spaced along each side)
  4. Draw seam lines
  5. Highlight selected zone

- `calculateCuts(config)`:
  - Center panel: 1 piece, visible size + seam allowances on all 4 sides (internal seams only, no hems — it's surrounded by border)
  - Border bars: compute count and size based on squaresPerSide. Bars on left/right edges get hemSides; bars on top get hemTop; bottom get hemBottom.
  - Border squares: count = squaresPerSide * 4 (minus corners counted once). Size = borderWidth x borderWidth + seam allowances. Corner squares get two hem edges.

**Step 2: Wire into app.js**

Add FramePattern to the pattern dropdown. Show borderWidth and squaresPerSide inputs when selected.

**Step 3: Verify**

Select Frame pattern. Should see a center panel with a decorative border of alternating squares and bars. Click zones, assign colors. Cut sheet updates.

**Step 4: Commit**

```bash
git add js/patterns/frame.js js/app.js
git commit -m "feat: frame pattern with border squares and bars"
```

---

### Task 7: Diamond Pattern

**Files:**
- Create: `js/patterns/diamond.js`
- Modify: `js/app.js`

**Step 1: Create diamond.js**

Create `js/patterns/diamond.js` that exports `DiamondPattern` with:

- `getParams()` — returns:
  - `diamondSize`: visible size of each diamond in inches (default: 4, this is the side length of the square before rotation)

- `getZones(config)`:
  Diamonds are squares rotated 45°. Compute how many fit: cols = `visibleWidth / (diamondSize * 0.707)`, rows = `visibleHeight / (diamondSize * 0.707)`. Each diamond gets a zone. Odd rows are offset by half a diamond width (harlequin pattern). Edge diamonds are clipped by the curtain boundary.

- `render(ctx, config, canvasW, canvasH)`:
  1. Clip to curtain rectangle
  2. For each diamond position, draw a rotated square filled with its assigned color
  3. Draw seam lines (the edges of each diamond)
  4. Highlight selected zone
  5. Draw outer hem border

- `calculateCuts(config)`:
  - Full interior diamonds: count, cutting size = diamondSize + seam allowance on all 4 edges
  - Edge half-diamonds and corner quarter-diamonds: count, cutting size adjusted
  - Note: actual cutting would be squares, rotated — so cutting dim is the square side + seam allowances

**Step 2: Wire into app.js**

Add DiamondPattern to dropdown. Show diamondSize input.

**Step 3: Verify**

Select Diamond. Should see a harlequin pattern of colored diamonds. Assign colors, check cut sheet.

**Step 4: Commit**

```bash
git add js/patterns/diamond.js js/app.js
git commit -m "feat: diamond/harlequin pattern"
```

---

### Task 8: Nested Rectangle Pattern

**Files:**
- Create: `js/patterns/nested.js`
- Modify: `js/app.js`

**Step 1: Create nested.js**

Create `js/patterns/nested.js` that exports `NestedPattern` with:

- `getParams()` — returns:
  - `rings`: number of concentric rectangles (default: 5, min: 2, max: 10)

- `getZones(config)`:
  Each ring is a zone. Ring 0 is outermost, ring N-1 is innermost (center). Ring width = `visibleWidth / (2 * rings)`, ring height = `visibleHeight / (2 * rings)`. Each ring is a rectangular frame.

- `render(ctx, config, canvasW, canvasH)`:
  1. Draw from outermost ring inward (so inner rings paint over outer)
  2. Each ring is drawn as a filled rectangle, progressively smaller
  3. Draw seam lines at ring boundaries
  4. Highlight selected zone

- `calculateCuts(config)`:
  Each ring consists of 4 strips (top, bottom, left, right) plus 4 corner pieces, OR it could be constructed as 4 L-shaped pieces, OR as strips joined at corners. This depends on Stella's actual construction method.

  **Default approach:** Each ring = 4 strips + 4 corner squares. The innermost ring is a solid rectangle (the center panel).
  - Strip dimensions: width = ring width, length = side length minus corners
  - Corner squares: ring width x ring width
  - Apply seam/hem allowances based on edge position

**Step 2: Wire into app.js**

Add NestedPattern to dropdown. Show rings input.

**Step 3: Verify**

Select Nested. Should see concentric rectangles. Assign colors per ring, check cut sheet.

**Step 4: Commit**

```bash
git add js/patterns/nested.js js/app.js
git commit -m "feat: nested rectangle pattern"
```

---

### Task 9: PDF Export

**Files:**
- Create: `js/pdf.js`
- Create: `lib/jspdf.min.js` (vendored)
- Modify: `js/app.js`
- Modify: `index.html` (add jsPDF script tag)

**Step 1: Vendor jsPDF**

```bash
curl -L "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js" -o lib/jspdf.min.js
```

Add `<script src="lib/jspdf.min.js"></script>` to index.html before the module script.

**Step 2: Create pdf.js**

Create `js/pdf.js` that exports:
- `exportPDF(config, pattern, canvasElement)`:

  **Page 1 — Client Preview:**
  1. Add "StellaLeeStudio" header and pattern name
  2. Render the canvas content to the PDF (using `canvas.toDataURL()` → `doc.addImage()`)
  3. Add overall dimensions label: "Width: 71" x Height: 48""
  4. Add color legend: for each unique color used, draw a small swatch rectangle + color name + fabric source

  **Page 2 — Cut Sheet:**
  1. Add "Cut Sheet" header
  2. Call `pattern.calculateCuts(config)` to get the pieces
  3. Render a table with columns: Piece, Qty, Color, Cut Width, Cut Height, (Visible Width, Visible Height)
  4. Add a row showing total fabric yardage per color (sum of piece areas, divided by bolt width 58", converted to yards, rounded up)
  5. Add seam allowance reference: "Internal seam: 0.5" per side | Sides/Bottom hem: 1" | Top hem: 3""

  Call `doc.save("pojagi-studio-export.pdf")`

**Step 3: Wire into app.js**

Hook up the "Export PDF" button to call `exportPDF()`.

**Step 4: Verify**

Assign colors to a Tile pattern, click Export PDF. Should download a 2-page PDF with the preview and cut sheet.

**Step 5: Commit**

```bash
git add lib/jspdf.min.js js/pdf.js js/app.js index.html
git commit -m "feat: PDF export with client preview and cut sheet"
```

---

### Task 10: Polish & GitHub Setup

**Files:**
- Create: `README.md`
- Create: `.gitignore` (update existing)

**Step 1: Create README.md**

```markdown
# Pojagi Studio

A browser-based tool for designing custom pojagi (Korean patchwork) curtains.

## Quick Start

1. Open `index.html` in Chrome (or any modern browser)
2. Select a pattern, enter your window dimensions
3. Click zones in the preview and assign colors from the swatches
4. Export a PDF to share with your client

## Adding Colors

- Custom colors are saved in your browser automatically
- To add a new fabric library, edit the JSON files in `data/`

## Adding Patterns

- Add a new JS file in `js/patterns/` following the existing pattern structure
- Register it in `js/app.js`

## Built for StellaLeeStudio
```

**Step 2: Update .gitignore**

Add:
```
.DS_Store
scripts/__pycache__/
```

**Step 3: Create GitHub repo**

```bash
gh repo create pojagi-studio --private --source=. --push
```

(Private so Stella controls access. Can be made public later if desired.)

**Step 4: Final commit and push**

```bash
git add -A
git commit -m "docs: add README and finalize project setup"
git push -u origin main
```

---

## Task Dependency Order

```
Task 1 (scaffolding)
  ├─→ Task 2 (scrape colors) — can run in parallel with Task 1
  ├─→ Task 3 (color library UI) — depends on Task 1 + Task 2
  ├─→ Task 4 (visual picker) — depends on Task 3
  ├─→ Task 5 (tile pattern) — depends on Task 1
  ├─→ Task 6 (frame pattern) — depends on Task 5
  ├─→ Task 7 (diamond pattern) — depends on Task 5
  ├─→ Task 8 (nested pattern) — depends on Task 5
  ├─→ Task 9 (PDF export) — depends on Task 5 + Task 3
  └─→ Task 10 (polish + GitHub) — depends on all above
```

Parallelizable: Tasks 2-4 (colors) can be done in parallel with Tasks 5-8 (patterns), merging at Task 9.
