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

/** Amplitude of the dune relief, relative to rest depth. */
const DUNE_AMPLITUDE = 0.55

/** Base frequency of the dune noise — lower = broader dunes. */
const DUNE_FREQUENCY = 1.6

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

  // Initial surface: desert-like dunes — multi-octave value noise over the
  // whole plate, randomised each load. Broad swells with finer ripples on
  // top; the toppling passes below relax anything steeper than the repose
  // angle so it all reads as naturally settled sand.
  const noise = makeValueNoise(Math.floor(Math.random() * 0xffffffff))
  const ox = Math.random() * 100
  const oz = Math.random() * 100
  for (let iz = 0; iz < GRID; iz++) {
    for (let ix = 0; ix < GRID; ix++) {
      const idx = iz * GRID + ix
      if (!active[idx]) continue
      const x = worldCoord(ix) / PLATE_INNER_RADIUS
      const z = worldCoord(iz) / PLATE_INNER_RADIUS
      const f = DUNE_FREQUENCY
      const n =
        noise(ox + x * f, oz + z * f) * 0.55 +
        noise(ox + 13 + x * f * 2.7, oz + 41 + z * f * 2.7) * 0.3 +
        noise(ox + 71 + x * f * 6.1, oz + 23 + z * f * 6.1) * 0.15
      heights[idx] = REST_DEPTH * (1 + DUNE_AMPLITUDE * (n * 2 - 1))
    }
  }

  // Geometry: plane displaced by the height field. Vertices outside the
  // sand circle are clamped onto a slightly larger skirt radius that sits
  // hidden inside the wall solid. Clamping exactly onto the sand radius
  // would collapse the rim triangles into slivers whose averaged normals
  // shade like an upward-curving meniscus against the wall.
  const SKIRT_RADIUS = PLATE_INNER_RADIUS + CELL_SIZE * 3
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
    if (r > SKIRT_RADIUS) {
      const s = SKIRT_RADIUS / r
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
