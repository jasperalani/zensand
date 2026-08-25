import * as THREE from 'three'

/** Plate radius in world units. */
export const PLATE_RADIUS = 1.4

/** Height of the plate walls (top of rim) in world units. */
export const PLATE_WALL_HEIGHT = 0.28 * PLATE_RADIUS

/** Height of the interior floor (sand sits on this) in world units. */
export const PLATE_FLOOR_HEIGHT = 0.05 * PLATE_RADIUS

/** Interior radius at the floor — the area the sand occupies. */
export const PLATE_INNER_RADIUS = 0.86 * PLATE_RADIUS

const PLATE_COLOR = 0xa69cac // Lilac Ash

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

  const plate = new THREE.Mesh(geometry, material)
  plate.castShadow = true
  plate.receiveShadow = true
  return plate
}
