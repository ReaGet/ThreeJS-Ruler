import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const clickMouse = new THREE.Vector2();
let dragging = false;
let mousePrev = [];

export default function Raycasting(camera, scene, getBoxes, callback) {
  window.addEventListener("mousedown", (event) => {
    if (event.target.closest(".menu")) {
      return;
    }
    dragging = false;
  });

  window.addEventListener("mousemove", (event) => {
    if (event.clientX !== mousePrev[0] && event.clientY !== mousePrev[1]) {
      dragging = true;
      mousePrev = [event.clientX, event.clientY];
    }
  });
  
  window.addEventListener("mouseup", (event) => {
    if (dragging) {
      return;
    }

    clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(clickMouse, camera);
    const found = raycaster.intersectObjects(scene.children);
    let intersation = found.filter((item) => item.object.userData.interactive)[0]?.object;

    if (!intersation) {
      const boxes = getBoxes();
      for (let box of boxes) {
        if (raycaster.ray.intersectsBox(box)) {
          intersation = box.model;
          // console.log(box)
          // intersation.userData.parent = box;
          // console.log(intersation)
        }
      }
    }

    callback(intersation);
  });
}