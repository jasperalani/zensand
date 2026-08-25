import * as THREE from 'three'

/**
 * Skybox: equirectangular panorama used as the scene background.
 *
 * To swap the skybox, replace src/skybox/skybox_equirect.png with any
 * 2:1 equirectangular image of the same name — no code changes needed.
 * (The px/nx/py/ny/pz/nz cube faces in the same folder are an unused
 * alternative form of the same panorama.)
 */
const SKYBOX_URL = new URL('./skybox/skybox_equirect.png', import.meta.url).href

export function applySkybox(scene: THREE.Scene) {
  new THREE.TextureLoader().load(SKYBOX_URL, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace
    scene.background = texture
  })
}
