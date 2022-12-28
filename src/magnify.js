import * as THREE from "three";

export default class Magnify {
  constructor(options) {
    this.renderer = options.renderer;
    this.radius = options.raduis;
    this.scene = options.scene;
    this.circle = new THREE.Shape();
    const x = 0;
    const y = 0;
    this.circle.absarc(x, y, this.radius);

    const segments = 100;
    const geometry = new THREE.ShapeGeometry(this.circle, segments / 2);

    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    this.scene.add(mesh);
  }
  render() {
    
  }
}