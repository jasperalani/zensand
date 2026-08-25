[← Back to README](README.md)

# Skybox

The scene background is an equirectangular panorama loaded by src/skybox.ts from `src/skybox/skybox_equirect.png`. Swap that file for any 2:1 equirect image and it just works.

## Current state

The current image is AI-generated and not a true 360°×180° sphere: the ground was padded outward, so looking down shows a "pinwheel" pinch at the nadir (the classic equirect pole artifact). It's a placeholder.

## Requirements for a good skybox

- True full-sphere coverage (360° × 180°), otherwise poles pinch
- 2:1 aspect equirectangular (or six cube faces)
- Soft, cartoon-like textures to match the project style

## Sources for non-AI skybox images

- **Poly Haven** (polyhaven.com/hdris) — the gold standard. Hundreds of real photographed 360° HDRIs, full sphere, up to 16k, CC0. The tonemapped JPG works if HDR isn't needed. Photorealistic, not cartoon.
- **Kenney** (kenney.nl) — CC0 game assets in a soft cartoon style that matches this project; has ready-made cube-face skybox packs.
- **OpenGameArt.org** — search "skybox"; many stylized/painted ones; check licenses (mostly CC0/CC-BY).
- **ambientCG** (ambientcg.com) — CC0 materials and some HDRIs.
- **itch.io asset store** — search "stylized skybox"; many cheap/free hand-painted packs.
- **Unity Asset Store** — hand-painted skyboxes; many licenses allow use outside Unity (verify per asset).

## Proper ways to get the soft cartoon look

1. **Procedural gradient sky** (recommended): a shader or big sphere with a smooth pastel vertical gradient from the project palette (e.g. Almond Cream horizon → Lilac Ash → Dusty Grape zenith), optionally soft billboard clouds. Zero seams, zero pole artifacts, tiny size, perfectly on-palette. This is what most stylized games ship.
2. **Render in Blender**: build a stylized world (gradient + toon clouds) and render a 360° equirect with a panoramic camera. Full control, guaranteed seamless.
3. **Buy/download a hand-painted skybox** from itch.io or the Unity Asset Store (license permitting).
