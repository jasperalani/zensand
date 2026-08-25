import "./style.css";
import { createScene } from "./scene.ts";
import { createPlate } from "./plate.ts";
import { createSand } from "./sand.ts";
import { applySkybox } from "./skybox.ts";

const canvas = document.createElement("canvas");
document.querySelector<HTMLDivElement>("#app")!.appendChild(canvas);

const { renderer, scene, camera, controls } = createScene(canvas);
applySkybox(scene);
scene.add(createPlate());

const sand = createSand();
scene.add(sand.mesh);

renderer.setAnimationLoop(() => {
  sand.update();
  controls.update();
  renderer.render(scene, camera);
});
