import "./style.css";
import { createScene } from "./scene.ts";
import { createPlate } from "./plate.ts";

const canvas = document.createElement("canvas");
document.querySelector<HTMLDivElement>("#app")!.appendChild(canvas);

const { renderer, scene, camera } = createScene(canvas);
scene.add(createPlate());

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
