import * as THREE from 'three';

import {
  OrbitControls
} from 'three/addons/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createBox } from './utils.js';

import Raycasting from "./raycaster.js";

let cameraPersp, currentCamera;
let scene, renderer, orbit;

init();
render();

function init() {

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

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

  const texture = new THREE.TextureLoader().load('textures/crate.gif', render);
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
      console.log('error')
  })

  orbit = new OrbitControls(currentCamera, renderer.domElement);
  orbit.update();
  orbit.addEventListener('change', render);

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

  window.addEventListener('resize', onWindowResize);

  // Передаем в в элементы управления сцену, камеру, рендерер

  let clickedObject = null;

  Raycasting(currentCamera, scene, () => {
    const boxes = [];
    boxes.push(createBox(car));

    return boxes;
  }, 
  (intersation) => {
    if (intersation) {
      console.log(intersation)
      return;
    }
    clickedObject = null;
    
    render();
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
  // Box3Helper.update();

}