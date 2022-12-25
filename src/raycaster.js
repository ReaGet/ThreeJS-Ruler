import * as THREE from 'three';

const raycaster = new THREE.Raycaster();

export function cast(mouse, camera, scene, boxes, isObject = false) {
  raycaster.setFromCamera(mouse, camera);
  let intersaction = raycaster.intersectObjects(scene.children);
  let model = intersaction.filter((item) => (
      item.object.userData.interactive === true && item.object.userData.line === false ||
      item.object.userData.line === true
    )
  )[0]?.object;
  console.log(model);

  if (!intersaction) {
    for (let box of boxes) {
      if (raycaster.ray.intersectsBox(box)) {
        model = box.model;
        intersaction = raycaster.intersectObjects(box.model);
      }
    }
  }

  return isObject ? model : intersaction[0];
}

export function castExceptDot(mouse, camera, scene, boxes) {
  raycaster.setFromCamera(mouse, camera);
  let intersaction = raycaster.intersectObjects(scene.children);
  let model = intersaction.filter((item) => (
      item.object.userData.interactive &&
      !item.object.userData.line
    )
  )[0]?.object;

  if (!intersaction) {
    for (let box of boxes) {
      if (raycaster.ray.intersectsBox(box)) {
        model = box.model;
        intersaction = raycaster.intersectObjects(box.model);
      }
    }
  }

  return intersaction[0];
}