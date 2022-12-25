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
import UI from "./ui.js";

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
  const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
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
  UI.on("rulerEnabled", () => {
    orbit.enabled = false;
    rulerEnabled = true;
  });

  UI.on("rulerCanceled", () => {
    orbit.enabled = true;
    rulerEnabled = false;
    
    finishLine();
  });

  UI.on("removeLine", () => {
    orbit.enabled = true;
    rulerEnabled = false;
    removeLine();
  });

  let drawingLine = false,
    mouse = new THREE.Vector2();

  const lines = [];
  const creating = {
    segment: {
      line: null,
      label: null,
      points: [],
    },
    lines: [],
  };
  let intersects = null;
  let mousePrev = [];
  let dragging = false;
  let mouseClicked = false;
  
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  labelRenderer.domElement.style.pointerEvents = "none";
  document.body.appendChild(labelRenderer.domElement);

  function removeLine() {
    removeFromScene(creating.segment.line);
    removeFromScene(creating.segment.label);
    removeFromScene(creating.segment.points);
    for (let line of creating.lines) {
      for (let key in line) {
        removeFromScene(line[key]);
      }
    }
    drawingLine = false;
    resetSegment();
  }

  function removeFromScene(element) {
    if (Array.isArray(element)) {
      element.forEach((item) => removeFromScene(item));
    } else {
      const object = scene.getObjectByProperty("uuid", element.uuid);
      scene.remove(object);
      scene.remove(element);
    }
  }

  function finishLine() {
    if (creating.segment.points.length === 1) {
      scene.remove(creating.segment.line);
      scene.remove(creating.segment.label);
      if (creating.lines.length === 0) {
        removeFromScene(creating.segment.points);
      }
    }
    lines.push(...creating.lines);
    resetSegment();
    drawingLine = false;
  }

  function resetSegment() {
    creating.segment.line = null;
    creating.segment.label = null;
    creating.segment.points = [];
    creating.lines = [];
  }
  
  function createDot(point) {
    const dotGeometry = new THREE.SphereGeometry(5, 32, 16);
    const dotMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.userData.line = true;
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
    measurementDiv.innerText = '0.0m';
    const measurementLabel = new CSS2DObject(measurementDiv);
    measurementLabel.position.copy(point);
    return measurementLabel;
  }

  function copyResetSegment() {
    const segment = {};
    for (let key in creating.segment) {
      let object = creating.segment[key];
      if (Array.isArray(object)) {
        let array = [];
        for (let item of object) {
          const el = item.clone();
          el.uuid = item.uuid;
          array.push(el);
        }
        segment[key] = array;
      } else {
        segment[key] = creating.segment[key].clone();
        segment[key].uuid = creating.segment[key].uuid;
      }
    }
    creating.segment.line = null;
    creating.segment.points = [];
    creating.segment.label = null;
    return segment;
  }

  renderer.domElement.addEventListener('mouseup', onClick, false);
  function onClick(event) {
    if (clickedDot) {
      orbit.enabled = true;
      clickedDot = null;
    }
    if (dragging || event.which !== 1 || !rulerEnabled) {
      return;
    }
    intersects = cast(mouse, currentCamera, scene, boxes);
    const dot = createDot(intersects.point);
    creating.segment.points.push(dot);
    scene.add(dot);
    
    if (creating.segment.points.length === 2) {
      const line = copyResetSegment();
      creating.lines.push(line);
      creating.segment.points.push(dot);
    }

    creating.segment.line = createLine(intersects.point);
    scene.add(creating.segment.line);

    creating.segment.label = createLabel(intersects.point);
    scene.add(creating.segment.label);
    drawingLine = true;

    if (creating.lines.length > 0) {
      UI.set("startCreating");
    } else {
      UI.set("stopCreating");
    }

    mouseClicked = false;
  }

  let clickedDot = null;

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  function onDocumentMouseDown() {
    mouseClicked = true;
    dragging = false;
    if (drawingLine) {
      return;
    }
    clickedDot = cast(mouse, currentCamera, scene, boxes, true);
    if (clickedDot) {
      orbit.enabled = false;
    }
    console.log(clickedDot)
    
  }

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (mouse.x !== mousePrev[0] && mouse.y !== mousePrev[1]) {
      mousePrev = [mouse.x, mouse.y];
      dragging = true;
    }
    // console.log(clickedDot)
    if (clickedDot) {
      // console.log(clickedDot);
      // clickedDot.position.setXYZ(mouse.x, mouse.y, 0);
      const target = castExceptDot(mouse, currentCamera, scene, boxes);
      console.log(target);
      target && clickedDot.position.set(target.point.x, target.point.y, target.point.z);
      target && (clickedDot.position.needsUpdate = true);
    }
    if (drawingLine) {
      intersects = cast(mouse, currentCamera, scene, boxes);
      if (intersects) {
        const positions = creating.segment.line.geometry.attributes.position.array;
        const v0 = new THREE.Vector3(
            positions[0],
            positions[1],
            positions[2]
        );
        const v1 = new THREE.Vector3(
            intersects.point.x,
            intersects.point.y,
            intersects.point.z
        );
        positions[3] = intersects.point.x;
        positions[4] = intersects.point.y;
        positions[5] = intersects.point.z;
        creating.segment.line.geometry.attributes.position.needsUpdate = true;
        const distance = v0.distanceTo(v1);
        creating.segment.label.element.innerText = distance.toFixed(2) + 'm';
        creating.segment.label.position.lerpVectors(v0, v1, 0.5);
      }
    }
  }

  stats = Stats();
  document.body.appendChild(stats.dom);

  // RULER END

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
  orbit.update();
  stats.update();
  labelRenderer.render(scene, currentCamera);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, currentCamera);
  render();
}

animate();