import * as THREE from 'three'

/** Plate radius in world units. */
export const PLATE_RADIUS = 1.4

/** Height of the plate walls (top of rim) in world units. */
export const PLATE_WALL_HEIGHT = 0.28 * PLATE_RADIUS

/** Height of the interior floor (sand sits on this) in world units. */
export const PLATE_FLOOR_HEIGHT = 0.05 * PLATE_RADIUS

/**
 * Radius the sand spans. The inner wall slopes outward (0.86R at the floor,
 * ~0.92R at rim height), so the sand extends to 0.92R and its rim embeds
 * into the wall solid — otherwise a gap shows between sand and wall.
 */
export const PLATE_INNER_RADIUS = 0.92 * PLATE_RADIUS

const PLATE_COLOR = 0xa69cac // Lilac Ash

/** Dev aid: checkerboard texture on the plate to judge sand/plate contact. */
const DEV_CHECKER_TEXTURE = false

/** Canvas-generated black/white checkerboard, repeated over the plate UVs. */
function makeCheckerTexture(): THREE.Texture {
  const size = 512
  const squares = 16
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cell = size / squares
  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#333333'
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Round ceramic plate: flat bottom, short near-vertical walls,
 * thin rim stepping slightly inward, flat interior floor.
 * Shape from ref/plate-reference-image.jpg.
 */
export function createPlate(): THREE.Mesh {
  // Lathe profile: [radius, height] pairs, traced from the bottom centre,
  // out along the base, up the outer wall, over the rim, down the inner
  // wall and back to the centre of the interior floor.
  const profile: [number, number][] = [
    [0.0, 0.0],
    [0.6, 0.0],
    [0.94, 0.004],
    [0.99, 0.02], // rounded base edge
    [1.0, 0.06],
    [1.0, 0.25], // outer wall, near vertical
    [0.99, 0.272],
    [0.96, 0.28], // rim top
    [0.925, 0.262], // step inward
    [0.915, 0.2], // inner wall
    [0.9, 0.09],
    [0.86, 0.062], // curve into floor
    [0.7, 0.052],
    [0.0, 0.05], // interior floor
  ]

  const points = profile.map(
    ([r, y]) => new THREE.Vector2(r * PLATE_RADIUS, y * PLATE_RADIUS),
  )

  const geometry = new THREE.LatheGeometry(points, 128)

  const material = new THREE.MeshStandardMaterial({
    color: PLATE_COLOR,
    roughness: 0.95,
    metalness: 0,
  })
  if (DEV_CHECKER_TEXTURE) {
    material.map = makeCheckerTexture()
    material.color.set(0xffffff)
  }

  const plate = new THREE.Mesh(geometry, material)
  plate.castShadow = true
  plate.receiveShadow = true
  return plate
}
