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
- Orbit camera: starts at the oblique side-down angle from the reference image (~30° elevation); drag to circle the plate 360°, scroll to zoom. Elevation clamped between 15° and 75° from vertical, zoom clamped to a comfortable range, panning disabled so the plate stays centred
- Walls act as boundaries: sand piles up against them (enforced by the sand sim in Step 2)

### Step 2 — The sand ✅
- Height field: 200×200 grid over the plate's inner circle; vertices outside the circle are masked inactive and act as walls (no flow), with rim mesh vertices clamped onto the circle so the surface renders as a disc
- Initialised ~80% of wall height with desert-like dunes: three-octave value noise (broad swells + finer ripples) over the whole surface, randomised seed and offsets each load, pre-settled to the repose angle before the first frame
- Wall cling: near the rim the sand rises slightly to meet the wall, with height varying around the circumference (noise sampled on the rim angle, smoothstep blend inward) so the sand/wall meeting line reads as drifted sand, not an even ring
- Toppling simulation: neighbouring cells steeper than the 33° angle of repose move sand downhill each frame (Gauss–Seidel passes over the 8-neighbourhood, diagonal threshold scaled by √2 so cones settle round); sleeps when fully settled and wakes via `markDirty()`
- Rendering: `PlaneGeometry` displaced from the height field each dirty frame, recomputed normals, casts/receives shadows
- Sand colour: Almond Cream `#f1dac4`, matte cartoon-like shading

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
