import * as THREE from 'three';

export function getPosition(object) {
  const position = object.position ? object.position : object;
  return {
    x: position.x,
    y: position.y,
    z: position.z,
  };
}

export function getRadians({x, y, z}) {
  const values = {};
  values.x = THREE.MathUtils.degToRad(x);
  values.y = THREE.MathUtils.degToRad(y);
  values.z = THREE.MathUtils.degToRad(z);
  return values;
}

export function getDegrees(object) {
  const values = {};
  values.x = ~~THREE.MathUtils.radToDeg(object.rotation._x);
  values.y = ~~THREE.MathUtils.radToDeg(object.rotation._y);
  values.z = ~~THREE.MathUtils.radToDeg(object.rotation._z);
  return values;
}

function handleScale(object, inputs) {
  let scale = inputs ? inputs : object.scale;
  object.userData.scale.x = scale.x;
  object.userData.scale.y = scale.y;
  object.userData.scale.z = scale.z;
  
  return {
    x: scale.x,
    y: scale.y,
    z: scale.z,
  };
}

export function handleControlsVisibility(controls, mode) {
  if (mode === "flip") {
    controls.hideControls();
  } else {
    controls.showControls();
  }
}

function handleFlip(model, inputs) {
  const values = model.userData.scale;
  if (inputs) {
    values.x = inputs.x !== inputs.prev.x ? -values.x : values.x;
    values.y = inputs.y !== inputs.prev.y ? -values.y : values.y;
    values.z = inputs.z !== inputs.prev.z ? -values.z : values.z;
    
    inputs.prev.x = inputs.x;
    inputs.prev.y = inputs.y;
    inputs.prev.z = inputs.z;
  }
  return values;
}

export function handleValues({ model, inputs, mode, callback }) {
  let values = {};
  if (mode === "translate") {
    values = getPosition(inputs || model);
  }
  if (mode === "rotate") {
    values = inputs ? getRadians(inputs) : getDegrees(model);
  }
  if (mode === "scale") {
    values = handleScale(model, inputs);
  }
  if (mode === "flip") {
    values = handleFlip(model, inputs);
  }

  callback(values);
}

export function createBox(object) {
  const box = new THREE.Box3().setFromObject( object );
  box.model = object;
  box.model.userData.scale = Object.assign({}, object.scale);
  return box;
}