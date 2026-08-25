import * as THREE from 'three'
import {
  PLATE_INNER_RADIUS,
  PLATE_FLOOR_HEIGHT,
  PLATE_WALL_HEIGHT,
} from './plate.ts'

const SAND_COLOR = 0xf1dac4 // Almond Cream

/** Vertices per side of the height-field grid. */
const GRID = 200

/** Sand angle of repose — slopes steeper than this topple. */
const REPOSE_ANGLE = THREE.MathUtils.degToRad(33)

/** Toppling relaxation passes per frame. */
const PASSES_PER_FRAME = 2

/** Fraction of the excess slope moved per topple (0..0.5, higher = faster settling). */
const TOPPLE_RATE = 0.25

/** Rest sand depth: plate ~80% full. */
const REST_DEPTH = 0.8 * (PLATE_WALL_HEIGHT - PLATE_FLOOR_HEIGHT)

/** Amplitude of the initial gentle unevenness, relative to rest depth. */
const NOISE_AMPLITUDE = 0.14

/** How many random mounds to scatter on the initial surface. */
const MOUND_COUNT_MIN = 2
const MOUND_COUNT_MAX = 4

/** Mound height range, relative to rest depth. */
const MOUND_HEIGHT_MIN = 0.35
const MOUND_HEIGHT_MAX = 0.8

/** Mound radius range, relative to the plate inner radius. */
const MOUND_RADIUS_MIN = 0.12
const MOUND_RADIUS_MAX = 0.28

/** World size of the grid: spans the plate interior. */
const WORLD_SIZE = 2 * PLATE_INNER_RADIUS

/** Distance between neighbouring grid vertices in world units. */
const CELL_SIZE = WORLD_SIZE / (GRID - 1)

/** Max height difference between orthogonal neighbours before sand topples. */
const MAX_DIFF = Math.tan(REPOSE_ANGLE) * CELL_SIZE

/** Max height difference between diagonal neighbours (√2 further apart). */
const MAX_DIFF_DIAG = MAX_DIFF * Math.SQRT2

export interface Sand {
  mesh: THREE.Mesh
  /** Sand depth per grid vertex (row-major, GRID×GRID), 0 = plate floor. */
  heights: Float32Array
  /** True for vertices inside the plate interior (simulated), false for rim padding. */
  active: Uint8Array
  /** Run toppling passes and refresh the mesh. Call once per frame. */
  update(): void
  /** Mark the height field as changed so the next update re-settles and redraws. */
  markDirty(): void
}

/**
 * Sand height field over the plate interior.
 *
 * A square GRID×GRID grid of sand depths covering the plate's inner circle.
 * Vertices outside the circle are masked inactive and their mesh positions
 * clamped onto the rim, so the rendered surface is exactly a disc. Each
 * frame, cells steeper than the angle of repose topple sand to neighbours
 * (classic sandpile model); the plane mesh is displaced from the result.
 */
export function createSand(): Sand {
  const heights = new Float32Array(GRID * GRID)
  const active = new Uint8Array(GRID * GRID)

  // Grid coordinate helpers: vertex (ix, iz) sits at world x/z below.
  const worldCoord = (i: number) => -PLATE_INNER_RADIUS + i * CELL_SIZE

  // Mask: active inside the plate's inner circle.
  for (let iz = 0; iz < GRID; iz++) {
    for (let ix = 0; ix < GRID; ix++) {
      const x = worldCoord(ix)
      const z = worldCoord(iz)
      active[iz * GRID + ix] = Math.hypot(x, z) <= PLATE_INNER_RADIUS ? 1 : 0
    }
  }

  // For each inactive rim vertex, find the nearest active vertex by walking
  // toward the grid centre; its height is mirrored for seamless rendering.
  const mirror = new Int32Array(GRID * GRID).fill(-1)
  const centre = (GRID - 1) / 2
  for (let iz = 0; iz < GRID; iz++) {
    for (let ix = 0; ix < GRID; ix++) {
      const idx = iz * GRID + ix
      if (active[idx]) continue
      let gx = ix
      let gz = iz
      while (!active[gz * GRID + gx]) {
        const dx = centre - gx
        const dz = centre - gz
        if (Math.abs(dx) >= Math.abs(dz)) gx += Math.sign(dx)
        else gz += Math.sign(dz)
      }
      mirror[idx] = gz * GRID + gx
    }
  }

  // Initial surface: rest depth plus gentle smooth noise, so the sand looks
  // naturally settled rather than machine-flat.
  const noise = makeValueNoise(1)
  for (let iz = 0; iz < GRID; iz++) {
    for (let ix = 0; ix < GRID; ix++) {
      const idx = iz * GRID + ix
      if (!active[idx]) continue
      const x = worldCoord(ix) / PLATE_INNER_RADIUS
      const z = worldCoord(iz) / PLATE_INNER_RADIUS
      const n =
        noise(x * 2.3, z * 2.3) * 0.65 + noise(x * 5.1 + 7, z * 5.1 + 3) * 0.35
      heights[idx] = REST_DEPTH * (1 + NOISE_AMPLITUDE * (n * 2 - 1))
    }
  }

  // Scatter a few random mounds so the garden starts with something to rake.
  // Each mound is a smooth cosine bump; the toppling passes below relax any
  // slopes steeper than the repose angle into natural cones.
  const moundCount =
    MOUND_COUNT_MIN +
    Math.floor(Math.random() * (MOUND_COUNT_MAX - MOUND_COUNT_MIN + 1))
  for (let m = 0; m < moundCount; m++) {
    // Random position, kept away from the wall so mounds settle freely.
    const angle = Math.random() * Math.PI * 2
    const dist = Math.sqrt(Math.random()) * PLATE_INNER_RADIUS * 0.6
    const mx = Math.cos(angle) * dist
    const mz = Math.sin(angle) * dist
    const radius =
      (MOUND_RADIUS_MIN + Math.random() * (MOUND_RADIUS_MAX - MOUND_RADIUS_MIN)) *
      PLATE_INNER_RADIUS
    const height =
      (MOUND_HEIGHT_MIN + Math.random() * (MOUND_HEIGHT_MAX - MOUND_HEIGHT_MIN)) *
      REST_DEPTH
    for (let iz = 0; iz < GRID; iz++) {
      for (let ix = 0; ix < GRID; ix++) {
        const idx = iz * GRID + ix
        if (!active[idx]) continue
        const r = Math.hypot(worldCoord(ix) - mx, worldCoord(iz) - mz)
        if (r >= radius) continue
        heights[idx] += height * 0.5 * (1 + Math.cos((r / radius) * Math.PI))
      }
    }
  }

  // Geometry: plane displaced by the height field. Rim vertices are clamped
  // onto the inner circle so the mesh reads as a disc, not a square.
  const geometry = new THREE.PlaneGeometry(
    WORLD_SIZE,
    WORLD_SIZE,
    GRID - 1,
    GRID - 1,
  )
  geometry.rotateX(-Math.PI / 2)
  const positions = geometry.attributes.position as THREE.BufferAttribute
  for (let v = 0; v < positions.count; v++) {
    const x = positions.getX(v)
    const z = positions.getZ(v)
    const r = Math.hypot(x, z)
    if (r > PLATE_INNER_RADIUS) {
      const s = PLATE_INNER_RADIUS / r
      positions.setX(v, x * s)
      positions.setZ(v, z * s)
    }
  }

  const material = new THREE.MeshStandardMaterial({
    color: SAND_COLOR,
    roughness: 1,
    metalness: 0,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  mesh.castShadow = true

  let dirty = true

  /** One Gauss–Seidel toppling pass; returns total sand moved. */
  function topplePass(): number {
    let moved = 0
    for (let iz = 0; iz < GRID; iz++) {
      for (let ix = 0; ix < GRID; ix++) {
        const idx = iz * GRID + ix
        if (!active[idx]) continue
        // 8-neighbourhood; inactive neighbours act as walls (no flow).
        // Diagonals use a √2-scaled threshold so cones settle round.
        if (ix > 0) moved += settlePair(idx, idx - 1, MAX_DIFF)
        if (ix < GRID - 1) moved += settlePair(idx, idx + 1, MAX_DIFF)
        if (iz > 0) moved += settlePair(idx, idx - GRID, MAX_DIFF)
        if (iz < GRID - 1) moved += settlePair(idx, idx + GRID, MAX_DIFF)
        if (ix > 0 && iz > 0)
          moved += settlePair(idx, idx - GRID - 1, MAX_DIFF_DIAG)
        if (ix < GRID - 1 && iz > 0)
          moved += settlePair(idx, idx - GRID + 1, MAX_DIFF_DIAG)
        if (ix > 0 && iz < GRID - 1)
          moved += settlePair(idx, idx + GRID - 1, MAX_DIFF_DIAG)
        if (ix < GRID - 1 && iz < GRID - 1)
          moved += settlePair(idx, idx + GRID + 1, MAX_DIFF_DIAG)
      }
    }
    return moved
  }

  /** Topple sand between two cells if their slope exceeds the repose angle. */
  function settlePair(a: number, b: number, maxDiff: number): number {
    if (!active[b]) return 0
    const diff = heights[a] - heights[b]
    if (diff > maxDiff) {
      const amount = (diff - maxDiff) * TOPPLE_RATE
      heights[a] -= amount
      heights[b] += amount
      return amount
    }
    return 0
  }

  /** Copy heights into the mesh and refresh normals. */
  function refreshMesh() {
    for (let v = 0; v < positions.count; v++) {
      const idx = mirror[v] === -1 ? v : mirror[v]
      positions.setY(v, PLATE_FLOOR_HEIGHT + heights[idx])
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  }

  // Settle the initial surface so nothing starts steeper than the repose
  // angle — mounds relax into natural cones before the first frame.
  for (let i = 0; i < 300; i++) if (topplePass() < 1e-6) break

  function update() {
    if (!dirty) return
    let moved = 0
    for (let i = 0; i < PASSES_PER_FRAME; i++) moved += topplePass()
    refreshMesh()
    // Fully settled: stop re-uploading the mesh until something changes.
    if (moved < 1e-6) dirty = false
  }

  return {
    mesh,
    heights,
    active,
    update,
    markDirty() {
      dirty = true
    },
  }
}

/**
 * Small deterministic value noise: hash lattice + bilinear interpolation,
 * returns values in [0, 1]. Enough for gentle initial sand unevenness.
 */
function makeValueNoise(seed: number) {
  function hash(x: number, y: number): number {
    let h = seed + x * 374761393 + y * 668265263
    h = (h ^ (h >> 13)) * 1274126177
    return ((h ^ (h >> 16)) >>> 0) / 0xffffffff
  }
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number): number => {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const tx = smooth(x - x0)
    const ty = smooth(y - y0)
    const a = hash(x0, y0)
    const b = hash(x0 + 1, y0)
    const c = hash(x0, y0 + 1)
    const d = hash(x0 + 1, y0 + 1)
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }
}
