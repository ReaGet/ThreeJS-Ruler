import * as THREE from "three";

import {
  OrbitControls
} from "three/addons/OrbitControls.js";


const raycaster = new THREE.Raycaster();

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createBox } from "./utils.js";

import ui from "./ui.js";

import Ruler from "./ruler.js";

let cameraPersp, currentCamera;
let scene, renderer, orbit;
const boxes = [];
let ruler = null;

init();
// render();

function init() {
  {
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

  ruler = Ruler(scene, currentCamera);
  let mouse, mousePrev = [], dragging;

  ui.on("rulerEnabled", () => {
    ruler.setState("enabled");
  });

  ui.on("rulerCanceled", () => {
    ruler.cancel();
    orbit.enabled = true;
  });

  ui.on("mousedown", (event) => {
    event.stopPropagation();
    ruler.select(
      intersects().at(0),
      () => orbit.enabled = false
    );

    dragging = false;
  });
  
  ui.on("mouseup", (event) => {
    ruler.addPoint(
      intersects().at(0),
      dragging
    );

    orbit.enabled = true;
  });
  
  ui.on("mousemove", (event) => {
    event.stopPropagation();
    mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    if (mouse.x !== mousePrev[0] && mouse.y !== mousePrev[1]) {
      mousePrev = [mouse.x, mouse.y];
      dragging = true;
    }

    ruler.handleMovement(
      intersects()
    );
  });

  function intersects() {
    raycaster.setFromCamera(mouse, currentCamera);
    return raycaster.intersectObjects(scene.children);
  }

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      ruler.cancel();
      orbit.enabled = true;
    }
    if (event.key === "Delete") {
      ruler.removeSelected();
    }
    if (event.key === "z") {
      console.log("undo");
      ruler.undo();
    }
    if (event.key === "y") {
      console.log("redo");
      ruler.redo();
    }
  });
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
  ruler.update();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, currentCamera);
  render();
}

animate();