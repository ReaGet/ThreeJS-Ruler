import * as THREE from "three";

export default class Magnify {
  constructor(options) {
    this.renderer = options.renderer;
    this.radius = options.raduis || 64;
    this.diameter = this.radius * 2;
    this.scene = options.scene;
    this.camera = options.camera;
    this.cameraM = this.camera.clone();
    this.zoom = options.zoom || 2;
    this.position =  { x: 0, y: 0, };
    
    this.cameraM.setViewOffset(window.innerWidth, window.innerHeight, 0, 0, 64, 64);
    this.renderTarget = new THREE.WebGLRenderTarget(32, 32);
    this.renderer.setRenderTarget(this.renderTarget);
    
    this.renderer.render(options.scene, this.camera);
    this.renderer.setRenderTarget(null);

    this.enabled = false;
  }
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  update(position) {
    this.position = position;
    this.cameraM = this.camera.clone();
  }
  calcY() {
    let check = this.position.y - this.diameter;
    let y = window.innerHeight - (this.position.y - this.radius);
    if (check < this.radius) {
      y = window.innerHeight - (this.position.y + this.diameter + this.radius);
    }
    return y;
  }
  render() {
    if (!this.enabled) {
      return;
    }
    this.renderer.setScissorTest(true);
    const x = this.position.x - this.radius;
    const times = this.zoom; // scale of magnifier
    const y = this.calcY();
    const offsetX = this.position.x - this.radius / times;
    const offsetY = this.position.y - this.radius / times;

    this.cameraM.setViewOffset(
      window.innerWidth,
      window.innerHeight,
      offsetX,
      offsetY,
      this.diameter / times,
      this.diameter / times
    );
    
    this.renderer.setViewport(x, y, this.diameter, this.diameter);
    this.renderer.setScissor(x, y, this.diameter, this.diameter);
    this.renderer.render(this.scene, this.cameraM);
    this.renderer.setScissorTest(false);
  }
}