# Digital Zen Garden

A relaxing sand simulator website. A round, flat-bottomed ceramic plate with short walls, ~80% filled with sand, viewed from a fixed oblique side-down angle. Click to pour in more sand, rake it with a three-tine rake, and push sand over the edge of the plate to discard it.

## Docs

- [status.md](status.md) — project steps and progress
- [variables.md](variables.md) — colour palette

## Look

- **Plate:** round, flat bottom, short straight walls with a slightly inward-stepped rim. The reference image (plate-reference-image.jpg) is for **shape only** — plate colour is Lilac Ash `#a69cac`.
- **Sand:** Almond Cream `#f1dac4`.
- **Style:** soft cartoon-like shadows to add depth (not photorealistic).
- **View/camera:** fixed oblique side-down angle, plate seen as an ellipse (matching the reference image).

## Technical approach

The sand is a **height field**: a 2D grid of cells over the plate interior, each storing a sand depth. Grains "topple" to neighbouring cells when the local slope exceeds the sand's angle of repose (classic sandpile model). This gives realistic pouring, mounding, and rake furrows without simulating individual grains, and runs fast in the browser.

Rendering is 3D: each frame, the height field displaces the vertices of a plane mesh, drawn with Three.js from the fixed oblique camera.

- Stack: **Vite + TypeScript + Three.js**
- Simulation: 2D height-field grid (start ~200×200 cells, tune for performance/feel). The grid is square but the plate is round: cells outside the plate rim are masked as inactive walls.
- Rendering: Three.js `PlaneGeometry` displaced by the height field, fixed oblique camera, directional light so furrows read clearly
- Input: raycast pointer from screen to plate to map clicks/drags onto grid cells

## Sand rules

- Sand conserves exactly while raking: raking only displaces sand, never destroys it.
- Sand is only ever removed by falling over the plate edge into the void below (deleted), or via the deletion tool.

## Development

```bash
npm install
npm run dev
```
