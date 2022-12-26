import * as THREE from "three";

import {
  OrbitControls
} from "three/addons/OrbitControls.js";

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/CSS2DRenderer.js";

import Stats from "three/addons/stats.module.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createBox } from "./utils.js";

import { cast, castExceptDot } from "./raycaster.js";
import ui from "./ui.js";
import controls from "./controls.js";

let cameraPersp, currentCamera;
let scene, renderer, orbit;
let rulerEnabled, labelRenderer, stats;
const boxes = [];

init();
// render();

function init() {
  const aspect = window.innerWidth / window.innerHeight;

  cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.01, 30000);
  currentCamera = cameraPersp;

  currentCamera.position.set(1000, 500, 1000);
  currentCamera.lookAt(0, 200, 0);

  scene = new THREE.Scene();
  scene.add(new THREE.GridHelper(1000, 10, 0x888888, 0x444444));

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(1, 1, 1);
  scene.add(light);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  {
  const texture = new THREE.TextureLoader().load("textures/crate.gif");
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const cubeGeometry = new THREE.BoxGeometry(200, 200, 200);
  // const cubeMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000} );

  const cubeMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true
  });
  // Если материал перекрывает точки, то указываем такие значения
  cubeMaterial.polygonOffset = true;
  cubeMaterial.polygonOffsetUnits = 1;
  cubeMaterial.polygonOffsetFactor = 1;

  const sphereGeometry = new THREE.SphereGeometry(100, 32, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xcccc00} );
  sphereMaterial.polygonOffset = true;
  sphereMaterial.polygonOffsetUnits = 1;
  sphereMaterial.polygonOffsetFactor = 1;

  const loader = new GLTFLoader();
  let car = null;
  // Загружаем модель и добавляем на сцену
  // Потом, если мы хотим ее перемещать, мы должны каждый раз при нажатии
  // на модель создавать бокс (строка 158 для примера). 
  loader.load(`./assets/car2/source/car.glb`, function (object) {
    car = object.scene;
    car.scale.set(200, 200, 200);
    car.position.x = -290;
    car.position.y = 0;
    car.position.z = -320;
    boxes.push(createBox(car));

    scene.add(car);
    // render();
  }, function (xhr) {
  }, function (error) {
      console.log("error")
  })

  orbit = new OrbitControls(currentCamera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.update();
  // orbit.addEventListener("change", render);

  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cubeMesh.position.z = 200;
  cubeMesh.rotateX(45 * Math.PI / 180);
  // Добавляем атрибут interactive "true" элементам, которые хотим передвигать
  cubeMesh.userData.interactive = true;
  // Добавляем атрибут scale для того, чтобы флип мог работать
  cubeMesh.userData.scale = Object.assign({}, cubeMesh.scale);
  scene.add(cubeMesh);

  const cubeMesh2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cubeMesh2.position.z = 300;
  cubeMesh2.scale.set(0.5, 0.5, 0.5);
  cubeMesh2.position.x = 400;
  scene.add(cubeMesh2);

  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphereMesh.position.z = -200;
  sphereMesh.position.x = 200;
  // Добавляем атрибут interactive "true" элементам, которые хотим передвигать
  sphereMesh.userData.interactive = true;

  // Добавляем атрибут scale для того, чтобы флип мог работать
  cubeMesh.userData.scale = Object.assign({}, cubeMesh.scale);
  scene.add(sphereMesh);

  const planeGeometry = new THREE.PlaneGeometry(2000, 2000, 8, 8);
  const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xb5b5b5, side: THREE.DoubleSide });
  planeMaterial.polygonOffset = true;
  planeMaterial.polygonOffsetUnits = 1;
  planeMaterial.polygonOffsetFactor = 1;
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX( - Math.PI / 2);
  plane.position.setY(-100);
  scene.add(plane);

  window.addEventListener("resize", onWindowResize);
  }

  // RULER
  // UI.on("rulerEnabled", () => {
  //   orbit.enabled = false;
  //   rulerEnabled = true;
  // });

  // UI.on("rulerCanceled", () => {
  //   orbit.enabled = true;
  //   rulerEnabled = false;
    
  //   finishLine();
  // });

  // UI.on("removeLine", () => {
  //   orbit.enabled = true;
  //   rulerEnabled = false;
  //   console.log(222);
  //   removeLine();
  // });

  ui.on("rulerEnabled", () => {
    orbit.enabled = false;
    rulerEnabled = true;
  });

  ui.on("rulerCanceled", () => {
    orbit.enabled = true;
    rulerEnabled = false;
    finishLine();
  });

  ui.on("removeLine", () => {
    orbit.enabled = true;
    rulerEnabled = false;
    console.log(222);
    removeLine();
  });

  let drawingLine = false,
    mouse = new THREE.Vector2();

  const lines = [];
  const creating = {
    segment: {
      line: null,
      label: null,
      points: {
        a: null,
        b: null,
      },
    },
    lines: [],
  };
  let intersects = null;
  let mousePrev = [];
  let dragging = false;
  
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  labelRenderer.domElement.style.pointerEvents = "none";
  document.body.appendChild(labelRenderer.domElement);

  function removeLine() {
    console.log(selectedLineStructure);
    removeFromScene(creating.segment.line);
    removeFromScene(creating.segment.label);
    removeFromScene(creating.segment.points.a);
    removeFromScene(creating.segment.points.b);
    for (let line of creating.lines) {
      for (let key in line) {
        if (key === "points") {
          removeFromScene(line[key].a);
          removeFromScene(line[key].b);
        } else {
          removeFromScene(line[key]);
        }
      }
    }
    drawingLine = false;
    resetSegment();
  }

  function removeFromScene(element) {
    if (!element) {
      return;
    }
    const object = scene.getObjectByProperty("uuid", element.uuid);
    scene.remove(object);
    scene.remove(element);
  }

  function finishLine() {
    if (creating.segment.points.b === null) {
      scene.remove(creating.segment.line);
      scene.remove(creating.segment.label);
      if (creating.lines.length === 0) {
        removeFromScene(creating.segment.points.a);
        removeFromScene(creating.segment.points.b);
      }
    }
    lines.push(creating.lines);
    resetSegment();
    drawingLine = false;
  }

  function resetSegment() {
    creating.segment.line = null;
    creating.segment.label = null;
    creating.segment.points = {
      a: null,
      b: null,
    };
    creating.lines = [];
  }
  
  function createDot(point) {
    const dotGeometry = new THREE.SphereGeometry(5, 32, 16);
    const dotMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.userData.dot = true;
    dot.position.copy(point);
    return dot;
  }

  function createLine(point) {
    const points = [];
    points.push(point);
    points.push(point.clone());
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points
    );
    const line = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
      })
    );
    line.frustumCulled = false;
    return line;
  }

  function createLabel(point) {
    const measurementDiv = document.createElement(
      'div'
    );
    measurementDiv.className = 'measurementLabel';
    measurementDiv.innerText = '0.0 units';
    const measurementLabel = new CSS2DObject(measurementDiv);
    measurementLabel.position.copy(point);
    return measurementLabel;
  }

  function copyResetSegment() {
    const segment = {};
    for (let key in creating.segment) {
      let object = creating.segment[key];
      if (key === "points") {
        // console.log(object);
        segment[key] = {};
        segment[key].a = object.a.clone();
        segment[key].a.uuid = object.a.uuid;
        segment[key].b = object.b.clone();
        segment[key].b.uuid = object.b.uuid;
      } else {
        segment[key] = creating.segment[key].clone();
        segment[key].uuid = creating.segment[key].uuid;
      }
    }
    creating.segment.line = null;
    creating.segment.points = {
      a: null,
      b: null,
    };
    creating.segment.label = null;
    return segment;
  }

  function updateLine(object) {
    let offset = object.points.a.uuid === clickedPoint.uuid ? 0 : 3;
    let line = scene.getObjectByProperty("uuid", object.line.uuid);
    let label = scene.getObjectByProperty("uuid", object.label.uuid);
    line.geometry.attributes.position.needsUpdate = true;
    const positions = line.geometry.attributes.position.array;
    positions[offset    ] = clickedPoint.position.x;
    positions[offset + 1] = clickedPoint.position.y;
    positions[offset + 2] = clickedPoint.position.z;

    const val = calcDistance(positions);
    label.element.innerText = val.d.toFixed(2) + ' units';
    label.position.lerpVectors(val.v0, val.v1, 0.5);
  }

  function setLineStructureSelected(selected) {
    const color = selected ? 0xff0000 : 0xffffff;
    console.log(selectedLineStructure);
    selectedLineStructure.forEach((segment) => {
      segment.line.material.color.set(color);
      segment.points.a.material.color.set(color);
      segment.points.b.material.color.set(color);
    });
  }

  renderer.domElement.addEventListener('mouseup', onMouseUp, false);
  function onMouseUp(event) {
    if (clickedPoint) {
      orbit.enabled = true;
      clickedPoint = null;
    }
    if (dragging || event.which !== 1 || !rulerEnabled) {
      return;
    }
    intersects = cast(mouse, currentCamera, scene, boxes);
    const dot = createDot(intersects.point);

    if (creating.segment.points.a === null) {
      creating.segment.points.a = dot;
    } else if (creating.segment.points.b === null) {
      creating.segment.points.b = dot;
      const line = copyResetSegment();
      creating.lines.push(line);
      creating.segment.points.a = dot;
    }
    scene.add(dot);

    creating.segment.line = createLine(intersects.point);
    scene.add(creating.segment.line);

    creating.segment.label = createLabel(intersects.point);
    scene.add(creating.segment.label);
    drawingLine = true;
    console.log(creating.lines);
    if (creating.lines.length > 0) {
      // UI.set("startCreating");
      controls.transition(controls.value, "creating");
    } else {
      // UI.set("stopCreating");
      controls.transition(controls.value, "default");
    }
  }

  let linesToUpdate = [];
  let selectedLineStructure = null;
  let clickedPoint = null;

  document.addEventListener('mousedown', onMouseDown, false);
  function onMouseDown() {
    dragging = false;
    if (drawingLine) {
      return;
    }
    clickedPoint = cast(mouse, currentCamera, scene, boxes, true);
    if (clickedPoint) {
      orbit.enabled = false;
      for (let i = 0; i < lines.length; i++) {
        linesToUpdate = lines[i].filter((line) => {
          return (
            line.points.a.uuid === clickedPoint.uuid ||
            line.points.b.uuid === clickedPoint.uuid
          );
        });
        if (linesToUpdate.length > 0) {
          controls.transition(controls.value, "startEditing");
          selectedLineStructure = lines[i];
          setLineStructureSelected(true);
          break;
        }
      }
    } else {
      if (selectedLineStructure) {
        console.log(controls.value);
        controls.transition(controls.value, "default");
        setLineStructureSelected(false);
      }
    }
    
  }

  document.addEventListener('mousemove', onMouseMove, false);
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (mouse.x !== mousePrev[0] && mouse.y !== mousePrev[1]) {
      mousePrev = [mouse.x, mouse.y];
      dragging = true;
    }
    if (clickedPoint) {
      const target = castExceptDot(mouse, currentCamera, scene, boxes, true);
      target && clickedPoint.position.set(target.point.x, target.point.y, target.point.z);
      target && (clickedPoint.position.needsUpdate = true);

      linesToUpdate.forEach(updateLine);
    }
    if (drawingLine) {
      intersects = cast(mouse, currentCamera, scene, boxes);
      if (intersects) {
        const positions = creating.segment.line.geometry.attributes.position.array;
        // const v0 = new THREE.Vector3(
        //     positions[0],
        //     positions[1],
        //     positions[2]
        // );
        // const v1 = new THREE.Vector3(
        //     intersects.point.x,
        //     intersects.point.y,
        //     intersects.point.z
        // );
        positions[3] = intersects.point.x;
        positions[4] = intersects.point.y;
        positions[5] = intersects.point.z;
        creating.segment.line.geometry.attributes.position.needsUpdate = true;
        const val = calcDistance(positions);
        // const distance = v0.distanceTo(v1);
        creating.segment.label.element.innerText = val.d.toFixed(2) + ' units';
        creating.segment.label.position.lerpVectors(val.v0, val.v1, 0.5);
      }
    }
  }

  stats = Stats();
  document.body.appendChild(stats.dom);

  // RULER END

}

function calcDistance(positions) {
  const v0 = new THREE.Vector3(
      positions[0],
      positions[1],
      positions[2]
  );
  const v1 = new THREE.Vector3(
    positions[3],
    positions[4],
    positions[5]
  );
  return {
    d: v0.distanceTo(v1),
    v0,
    v1
  };
}

function onWindowResize() {

  const aspect = window.innerWidth / window.innerHeight;

  cameraPersp.aspect = aspect;
  cameraPersp.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();

}

function render() {
  renderer.render(scene, currentCamera);
  // orbit.update();
  stats.update();
  labelRenderer.render(scene, currentCamera);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, currentCamera);
  render();
}

animate();