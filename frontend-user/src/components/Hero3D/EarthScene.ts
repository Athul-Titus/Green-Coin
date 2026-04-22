import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Globe } from './Globe';
import { Particles } from './Particles';
import { Connections } from './Connections';

export class EarthScene {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private sceneGroup: THREE.Group;
  private controls: OrbitControls;
  
  private globe: Globe;
  private particles: Particles;
  private connections: Connections;

  private reqId: number = 0;
  private clock: THREE.Clock;
  private pointLight: THREE.PointLight;
  
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020c06);

    // Group to hold everything to allow mouse parallax without fighting OrbitControls target
    this.sceneGroup = new THREE.Group();
    this.scene.add(this.sceneGroup);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 4.5);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.minPolarAngle = Math.PI / 3;
    this.controls.maxPolarAngle = Math.PI / 1.5;

    // Lighting
    const ambient = new THREE.AmbientLight(0x0d3320, 2);
    this.sceneGroup.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0x4ade80, 1.5);
    dirLight1.position.set(5, 3, 5);
    this.sceneGroup.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x166534, 0.8);
    dirLight2.position.set(-5, -3, -5);
    this.sceneGroup.add(dirLight2);

    this.pointLight = new THREE.PointLight(0x22c55e, 0.5);
    this.sceneGroup.add(this.pointLight);

    // Objects
    this.globe = new Globe();
    this.sceneGroup.add(this.globe.group);

    this.particles = new Particles();
    this.sceneGroup.add(this.particles.group);

    this.connections = new Connections(this.globe.getNodes());
    this.sceneGroup.add(this.connections.group);

    this.clock = new THREE.Clock();

    // Resize
    window.addEventListener('resize', this.onResize);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove = (event: MouseEvent) => {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  public start() {
    const loop = () => {
      this.reqId = requestAnimationFrame(loop);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  private update() {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.controls.update();

    // Mouse parallax against the sceneGroup
    this.sceneGroup.position.x += (this.mouseX * 0.5 - this.sceneGroup.position.x) * 0.05;
    this.sceneGroup.position.y += (this.mouseY * 0.3 - this.sceneGroup.position.y) * 0.05;

    // animate point light
    this.pointLight.position.x = Math.sin(time) * 3;
    this.pointLight.position.z = Math.cos(time) * 3;
    this.pointLight.position.y = Math.sin(time * 0.5) * 2;

    this.globe.update(delta, time);
    this.particles.update(delta, time);
    this.connections.update(delta, time);
  }

  public destroy() {
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('mousemove', this.onMouseMove);
    cancelAnimationFrame(this.reqId);
    
    this.sceneGroup.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      }
    });
    this.renderer.dispose();
  }
}
