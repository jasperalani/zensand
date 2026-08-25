[← Back to README](README.md)

# Project Status

Steps for completing the Digital Zen Garden.

## Status legend

⬜ Not started · 🟨 In progress · ✅ Done

## Steps

### Step 0 — Project setup ✅
- Vite + TypeScript + Three.js project scaffolded, dependencies installed

### Step 1 — The plate ✅
- Plate modelled in 3D (lathe geometry): round, flat bottom, short walls with inward-stepped rim, shape from the reference image
- Plate colour: Lilac Ash `#a69cac`, soft cartoon-like shading (matte material, strong ambient fill + gentle key light)
- Fixed camera at the oblique side-down angle from the reference image (~30° elevation)
- Walls act as boundaries: sand piles up against them (enforced by the sand sim in Step 2)

### Step 2 — The sand ⬜
- Height-field grid covering the plate interior; cells outside the round rim masked as inactive walls
- Initialise ~80% filled with a natural, slightly uneven sand surface
- Toppling/settling simulation (angle of repose) running each frame
- Displace plane mesh from the height field; light from one side so bumps and furrows read clearly
- Sand colour: Almond Cream `#f1dac4`, soft cartoon-like shading

### Step 3 — Pouring sand ⬜
- Click (or click-hold) anywhere on the plate to pour sand from above
- Sand streams onto that spot and forms a growing mound that spreads naturally
- Sand can pile up to wall height; overflow spills over the edge (see Step 5)

### Step 4 — The rake ⬜
- Three-tine rake: drag across the sand to carve three parallel furrow lines
- Rake follows the cursor; furrow ridges are simulated (displaced sand piles at the edges), not just drawn
- Sand conserves exactly while raking: only displaced, never destroyed
- Tune tine spacing and rake width for feel

### Step 5 — Over the edge ⬜
- Sand pushed or piled over the plate walls falls over the edge into the void below and is deleted
- Falling sand animated (simple particles or streaks) so the deletion reads visually

### Step 6 — Sand deletion tool ⬜
- Deletion tool: click/drag to remove sand directly from the plate

### Step 7 — Polish ⬜
- Tool switcher UI (pour / rake / delete), kept minimal and calm
- Smoothing/reset button to flatten the garden and start over
- Sound? Soft raking/pouring audio, off by default
- Ambient touches: subtle grain texture, maybe a stone or two to rake around

## Future ideas (outside the project steps)

- Rewrite the renderer in regl or twgl.js: a thin WebGL wrapper instead of Three.js, with the height field uploaded as a texture and displaced in a custom vertex shader. Smaller bundle, full pipeline control; cost is hand-writing lighting, ceramic material, camera matrices, and mouse-to-grid picking.
