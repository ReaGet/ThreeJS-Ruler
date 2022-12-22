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

import Raycasting from "./raycaster.js";
import UI from "./ui.js";

let cameraPersp, currentCamera;
let scene, renderer, orbit;
let rulerEnabled, labelRenderer, stats;

init();
render();

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

  const texture = new THREE.TextureLoader().load("textures/crate.gif", render);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const cubeGeometry = new THREE.BoxGeometry(200, 200, 200);

  const cubeMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true
  });

  const sphereGeometry = new THREE.SphereGeometry(100, 32, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );

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

    scene.add(car);
    render();
  }, function (xhr) {
  }, function (error) {
      console.log("error")
  })

  orbit = new OrbitControls(currentCamera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.update();
  orbit.addEventListener("change", render);

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

  window.addEventListener("resize", onWindowResize);

  // Передаем в в элементы управления сцену, камеру, рендерер

  let clickedObject = null;

  Raycasting(currentCamera, scene, () => {
    const boxes = [];
    boxes.push(createBox(car));

    return boxes;
  }, 
  (intersation) => {
    if (intersation) {
      clickedObject = intersation;
      return;
    }
    clickedObject = null;
    
    render();
  });

  // RULER
  UI.on("rulerEnabled", () => {
    orbit.enabled = false;
    rulerEnabled = true;
  });

  UI.on("rulerCanceled", () => {
    orbit.enabled = true;
    rulerEnabled = false;
    resetLine();
  });

  let lineId = 0,
    line,
    drawingLine = false,
    measurementLabels = {},
    mouse = new THREE.Vector2();
  
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  labelRenderer.domElement.style.pointerEvents = "none";
  document.body.appendChild(labelRenderer.domElement);

  window.addEventListener('keyup', function (event) {
    if (rulerEnabled) {
      if (drawingLine) {
        resetLine();
      }
    }
  });

  function resetLine() {
    scene.remove(line);
    scene.remove(measurementLabels[lineId]);
    drawingLine = false;
  }

  renderer.domElement.addEventListener('pointerdown', onClick, false);
  function onClick() {
    if (!rulerEnabled || !clickedObject) {
      return;
    }
    console.log(clickedObject);
    if (rulerEnabled) {
      const points = [];
      points.push(clickedObject.point);
      points.push(clickedObject.point.clone());
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points
      );
      line = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.75,
          // depthTest: false,
          // depthWrite: false
        })
      );
      line.frustumCulled = false;
      scene.add(line);

      const measurementDiv = document.createElement(
        'div'
      );
      measurementDiv.className = 'measurementLabel';
      measurementDiv.innerText = '0.0m';
      const measurementLabel = new CSS2DObject(measurementDiv);
      measurementLabel.position.copy(clickedObject.point);
      measurementLabels[lineId] = measurementLabel;
      scene.add(measurementLabels[lineId]);
      drawingLine = true;
    } else {
      const positions = line.geometry.attributes.position.array;
      positions[3] = clickedObject.point.x;
      positions[4] = clickedObject.point.y;
      positions[5] = clickedObject.point.z;
      line.geometry.attributes.position.needsUpdate = true;
      lineId++;
      drawingLine = false;
    }
  }

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  function onDocumentMouseMove(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (drawingLine) {
      if (clickedObject) {
        const positions = line.geometry.attributes.position.array;
        const v0 = new THREE.Vector3(
            positions[0],
            positions[1],
            positions[2],
        );
        const v1 = new THREE.Vector3(
            clickedObject.point.x,
            clickedObject.point.y,
            clickedObject.point.z,
        );
        positions[3] = clickedObject.point.x;
        positions[4] = clickedObject.point.y;
        positions[5] = clickedObject.point.z;
        line.geometry.attributes.position.needsUpdate = true;
        const distance = v0.distanceTo(v1);
        measurementLabels[lineId].element.innerText =
            distance.toFixed(2) + 'm';
        measurementLabels[lineId].position.lerpVectors(v0, v1, 0.5);
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
  stats.update();
  labelRenderer.render(scene, currentCamera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
}

animate();