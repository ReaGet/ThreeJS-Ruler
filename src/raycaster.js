import * as THREE from 'three';

const raycaster = new THREE.Raycaster();

export default function cast(mouse, camera, scene, boxes) {
  raycaster.setFromCamera(mouse, camera);
  let intersaction = raycaster.intersectObjects(scene.children);
  let model = intersaction.filter((item) => item.object.userData.interactive)[0]?.object;

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