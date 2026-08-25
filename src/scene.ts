import * as THREE from 'three'
import { PLATE_RADIUS } from './plate.ts'

const BACKGROUND_COLOR = 0xf1dac4 // Almond Cream backdrop for now

/**
 * Scene, fixed camera and soft lighting.
 * Camera matches the oblique side-down angle of the plate reference image:
 * the plate reads as an ellipse roughly twice as wide as tall (~30° elevation).
 */
export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BACKGROUND_COLOR)

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
  // Oblique side-down view: elevated ~30°, looking at the plate centre.
  const distance = PLATE_RADIUS * 4.6
  const elevation = THREE.MathUtils.degToRad(30)
  camera.position.set(
    0,
    Math.sin(elevation) * distance,
    Math.cos(elevation) * distance,
  )
  camera.lookAt(0, 0, 0)

  // Soft, cartoon-like lighting: strong ambient fill, one gentle key light
  // from the upper left so relief reads without harsh contrast.
  const ambient = new THREE.AmbientLight(0xffffff, 1.9)
  scene.add(ambient)

  const key = new THREE.DirectionalLight(0xfff6ec, 1.6)
  key.position.set(-PLATE_RADIUS * 3, PLATE_RADIUS * 5, PLATE_RADIUS * 2)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  const shadowExtent = PLATE_RADIUS * 2
  key.shadow.camera.left = -shadowExtent
  key.shadow.camera.right = shadowExtent
  key.shadow.camera.top = shadowExtent
  key.shadow.camera.bottom = -shadowExtent
  key.shadow.camera.far = PLATE_RADIUS * 12
  key.shadow.radius = 8
  scene.add(key)

  function resize() {
    const { innerWidth: w, innerHeight: h } = window
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)
  resize()

  return { renderer, scene, camera }
}
