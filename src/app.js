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

import cast from "./raycaster.js";
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

  // RULER
  UI.on("rulerEnabled", () => {
    orbit.enabled = false;
    rulerEnabled = true;
  });

  UI.on("rulerCanceled", () => {
    orbit.enabled = true;
    rulerEnabled = false;
    if (pointsCache.length > 1) {
      finishLine();
    } else {
      resetLine();
    }
  });

  UI.on("removeLine", () => {
    orbit.enabled = true;
    rulerEnabled = false;
    removeLine();
  });

  let lineId = 0,
    line,
    drawingLine = false,
    measurementLabels = {},
    mouse = new THREE.Vector2();

  const lines = [];
  // let line = [];
  let pointsCache = [];
  let labelsCache = [];
  let linesCache = [];
  let intersects = null;
  // let drawingLine = false;
  let mousePrev = [];
  let dragging = false;
  // let mouse = new THREE.Vector2();
  
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  labelRenderer.domElement.style.pointerEvents = "none";
  document.body.appendChild(labelRenderer.domElement);

  // window.addEventListener('keyup', function (event) {
  //   if (rulerEnabled) {
  //     if (drawingLine) {
  //       resetLine();
  //     }
  //   }
  // });

  function resetLine() {
    scene.remove(line);
    scene.remove(measurementLabels[lineId]);
    scene.remove(pointsCache.at(0));
    scene.remove(labelsCache.at(0));
    drawingLine = false;
    pointsCache = [];
    labelsCache = [];
    linesCache = [];
  }

  function removeLine() {
    scene.remove(line);
    removeFromScene(pointsCache);
    removeFromScene(labelsCache);
    removeFromScene(linesCache);
  }

  function removeFromScene(arr) {
    arr.forEach((item) => scene.remove(item));
  }

  function finishLine() {
    const positions = line.geometry.attributes.position.array;
    positions[3] = intersects.point.x;
    positions[4] = intersects.point.y;
    positions[5] = intersects.point.z;
    line.geometry.attributes.position.needsUpdate = true;
    lineId++;
    drawingLine = false;
    if (linesCache.length + 1 !== pointsCache.length) {
      scene.remove(linesCache.at(linesCache.length - 1));
      scene.remove(labelsCache.at(labelsCache.length - 1));
    }
    pointsCache = [];
    labelsCache = [];
    linesCache = [];
  }

  renderer.domElement.addEventListener('mouseup', onClick, false);
  function onClick(event) {
    if (dragging || event.which !== 1 || !rulerEnabled) {
      return;
    }
    // if (!rulerEnabled && !clickedObject) {
    //   return;
    // }
    // if (!drawingLine) {
      intersects = cast(mouse, currentCamera, scene, boxes);
      const dotGeometry = new THREE.SphereGeometry(5, 32, 16);
      const dotMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.copy(intersects.point);
      scene.add(dot);
      pointsCache.push(dot);

      const points = [];
      points.push(intersects.point);
      points.push(intersects.point.clone());
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
      linesCache.push(line);
      scene.add(line)

      const measurementDiv = document.createElement(
        'div'
      );
      measurementDiv.className = 'measurementLabel';
      measurementDiv.innerText = '0.0m';
      const measurementLabel = new CSS2DObject(measurementDiv);
      measurementLabel.position.copy(intersects.point);
      measurementLabels[lineId] = measurementLabel;
      labelsCache.push(measurementLabel);
      scene.add(measurementLabels[lineId]);
      drawingLine = true;
    // }

    if (pointsCache.length > 1) {
      console.log(222);
      UI.set("startCreating");
    } else {
      console.log(333);
      UI.set("stopCreating");
    }

  }

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  function onDocumentMouseDown() {
    dragging = false;
  }

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (mouse.x !== mousePrev[0] && mouse.y !== mousePrev[1]) {
      mousePrev = [mouse.x, mouse.y];
      dragging = true;
    }
    if (drawingLine) {
      intersects = cast(mouse, currentCamera, scene, boxes);
      if (intersects) {
        const positions = line.geometry.attributes.position.array;
        const v0 = new THREE.Vector3(
            positions[0],
            positions[1],
            positions[2]
        )
        const v1 = new THREE.Vector3(
            intersects.point.x,
            intersects.point.y,
            intersects.point.z
        )
        positions[3] = intersects.point.x
        positions[4] = intersects.point.y
        positions[5] = intersects.point.z
        line.geometry.attributes.position.needsUpdate = true
        const distance = v0.distanceTo(v1)
        measurementLabels[lineId].element.innerText =
            distance.toFixed(2) + 'm'
        measurementLabels[lineId].position.lerpVectors(v0, v1, 0.5)
      }
    }
  }
  // document.addEventListener('mousemove', onDocumentMouseMove, false);
  // function onDocumentMouseMove(event) {
  //   event.preventDefault();

  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //   if (drawingLine) {
  //     if (clickedObject) {
  //       const positions = line.geometry.attributes.position.array;
  //       const v0 = new THREE.Vector3(
  //           positions[0],
  //           positions[1],
  //           positions[2],
  //       );
  //       const v1 = new THREE.Vector3(
  //           clickedObject.point.x,
  //           clickedObject.point.y,
  //           clickedObject.point.z,
  //       );
  //       positions[3] = clickedObject.point.x;
  //       positions[4] = clickedObject.point.y;
  //       positions[5] = clickedObject.point.z;
  //       line.geometry.attributes.position.needsUpdate = true;
  //       const distance = v0.distanceTo(v1);
  //       measurementLabels[lineId].element.innerText =
  //           distance.toFixed(2) + 'm';
  //       measurementLabels[lineId].position.lerpVectors(v0, v1, 0.5);
  //     }
  //   }
  // }

  stats = Stats();
  document.body.appendChild(stats.dom);

  // RULER END

}

function onWindowResize() {

  const aspect = window.innerWidth / window.innerHeight;

  cameraPersp.aspect = aspect;
  cameraPersp.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  // render();

}

function render() {
  renderer.render(scene, currentCamera);
  stats.update();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, currentCamera);
  orbit.update();
  stats.update();
  labelRenderer.render(scene, currentCamera);
}

animate();