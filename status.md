# Digital Zen Garden — Project Status

A relaxing sand simulator website. A round, flat-bottomed ceramic plate with short walls, ~80% filled with sand, viewed from a fixed oblique side-down angle. Click to pour in more sand, then rake it with a raking tool.

## The plate (from reference image)

- **Shape:** round, flat bottom, short straight walls with a slightly inward-stepped rim
- **Material/colour:** ceramic; cream/off-white exterior and walls, blue-grey glazed interior (speckled, slightly mottled)
- **View/camera:** fixed oblique side-down angle, plate seen as an ellipse (matching the reference image)

## Technical approach

The sand is a **height field**: a 2D grid of cells over the plate interior, each storing a sand depth. Grains "topple" to neighbouring cells when the local slope exceeds the sand's angle of repose (classic sandpile model). This gives realistic pouring, mounding, and rake furrows without simulating individual grains, and runs fast in the browser.

Rendering is 3D: each frame, the height field displaces the vertices of a plane mesh, drawn with Three.js from the fixed oblique camera. This gives true perspective, real lighting/shadows on the sand relief, and the glazed ceramic look.

- Stack: **Vite + TypeScript + Three.js**
- Simulation: 2D height-field grid (start ~200×200 cells, tune for performance/feel)
- Rendering: Three.js `PlaneGeometry` displaced by the height field, fixed oblique camera, directional light so furrows read clearly
- Input: raycast pointer from screen to plate to map clicks/drags onto grid cells

## Status legend

⬜ Not started · 🟨 In progress · ✅ Done

## Steps

### Step 0 — Project setup ✅
- Vite + TypeScript + Three.js project scaffolded, dependencies installed

### Step 1 — The plate ⬜
- Model the plate in 3D: round, flat bottom, short walls, cream ceramic outside, blue-grey glazed interior
- Fixed camera at the oblique side-down angle from the reference image
- Walls act as boundaries: sand cannot leave, and it piles up against them

### Step 2 — The sand ⬜
- Height-field grid covering the plate interior
- Initialise ~80% filled with a natural, slightly uneven sand surface
- Toppling/settling simulation (angle of repose) running each frame
- Displace plane mesh from the height field; light from one side so bumps and furrows read clearly

### Step 3 — Pouring sand ⬜
- Click (or click-hold) anywhere on the plate to pour sand from above
- Sand streams onto that spot and forms a growing mound that spreads naturally
- Cap total sand so the plate can't overflow the walls (or let it pile to wall height and stop)

### Step 4 — The rake ⬜
- Rake tool: drag across the sand to carve parallel furrow lines
- Rake follows the cursor; furrow ridges are simulated (displaced sand piles at the edges), not just drawn
- Options to consider: number of tines, tine spacing, rake width

### Step 5 — Polish ⬜
- Tool switcher UI (pour / rake), kept minimal and calm
- Smoothing/reset button to flatten the garden and start over
- Sound? Soft raking/pouring audio, off by default
- Ambient touches: subtle grain texture, maybe a stone or two to rake around

## Open questions
- Rake style: single point, or multi-tine from the start?
- Should sand conserve exactly (raking only displaces, never destroys)? Proposed: yes, it feels more real.
- Height-field grid is square but the plate is round — mask cells outside the plate rim as inactive walls.
- Sand colour: pick something that complements the blue-grey glaze (warm light sand?)

## Future ideas (outside the project steps)

- Rewrite the renderer in regl or twgl.js: a thin WebGL wrapper instead of Three.js, with the height field uploaded as a texture and displaced in a custom vertex shader. Smaller bundle, full pipeline control; cost is hand-writing lighting, ceramic material, camera matrices, and mouse-to-grid picking.

