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

  // Smooth mouse parallax targets
  private targetX: number = 0;
  private targetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    // ── Scene ──────────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    // Transparent — landing page CSS background shows through
    this.scene.background = null;

    this.sceneGroup = new THREE.Group();
    this.scene.add(this.sceneGroup);

    // ── Renderer (photorealistic settings) ────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,           // transparent background
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

    // Tone mapping & colour space for photorealistic output
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Camera ─────────────────────────────────────────────────────
    const w = canvas.clientWidth  || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 4.2);

    // ── Orbit Controls ─────────────────────────────────────────────
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping   = true;
    this.controls.dampingFactor   = 0.05;
    this.controls.enableZoom      = false;
    this.controls.enablePan       = false;
    this.controls.autoRotate      = false;    // Manual rotation in Globe.update()
    this.controls.minPolarAngle   = Math.PI / 3;
    this.controls.maxPolarAngle   = Math.PI / 1.5;

    // ── Lighting (photorealistic sun + fill + ambient) ─────────────
    // Primary sun — bright directional, simulates star light
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 3, 5);
    this.sceneGroup.add(sunLight);

    // Soft fill from dark side (deep-space bounce light)
    const fillLight = new THREE.DirectionalLight(0x112244, 0.35);
    fillLight.position.set(-5, -3, -5);
    this.sceneGroup.add(fillLight);

    // Very dim ambient — space is almost completely dark
    const ambientLight = new THREE.AmbientLight(0x111111, 0.5);
    this.sceneGroup.add(ambientLight);

    // ── Globe, Particles, Connections ──────────────────────────────
    this.globe = new Globe();
    this.sceneGroup.add(this.globe.group);

    this.particles = new Particles();
    this.sceneGroup.add(this.particles.group);

    this.connections = new Connections(this.globe.getNodes());
    this.sceneGroup.add(this.connections.group);

    this.clock = new THREE.Clock();

    // ── Event listeners ────────────────────────────────────────────
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  // ── Resize handler ─────────────────────────────────────────────
  private onResize = () => {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth  || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ── Smooth parallax from mouse ─────────────────────────────────
  private onMouseMove = (event: MouseEvent) => {
    this.targetX = (event.clientX / window.innerWidth  - 0.5) * 0.5;
    this.targetY = (event.clientY / window.innerHeight - 0.5) * 0.3;
  }

  // ── Animation loop ─────────────────────────────────────────────
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
    const time  = this.clock.getElapsedTime();

    this.controls.update();

    // Smooth mouse parallax — moves the whole scene group gently
    this.sceneGroup.position.x += (this.targetX * 0.6 - this.sceneGroup.position.x) * 0.04;
    this.sceneGroup.position.y += (-this.targetY * 0.4 - this.sceneGroup.position.y) * 0.04;

    this.globe.update(delta, time);
    this.particles.update(delta, time);
    this.connections.update(delta, time);
  }

  // ── Cleanup ────────────────────────────────────────────────────
  public destroy() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
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
