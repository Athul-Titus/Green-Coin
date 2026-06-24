import * as THREE from 'three';

// ── Texture URLs ────────────────────────────────────────────────
// Primary: three.js dev branch (GitHub raw)
// Fallback: threejs.org examples
const CDN_BASE  = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets';
const FALL_BASE = 'https://threejs.org/examples/textures/planets';

function url(filename: string, base = CDN_BASE) {
  return `${base}/${filename}`;
}

/**
 * Globe
 * ─────
 * Photorealistic Earth with:
 *   • Day colour map  (satellite colour texture)
 *   • Night emissive map  (city lights on dark side)
 *   • Specular map   (ocean shine vs land matte)
 *   • Normal map     (mountain / terrain bump)
 *   • Cloud layer    (semi-transparent, rotates faster)
 *   • Blue atmospheric rim glow (BackSide sphere)
 *   • Thin green orbit ring (kept from original design)
 *   • Tiny surface nodes   (scaled down so texture shows)
 *
 * The object preserves the same public API as the old Globe:
 *   .group        → THREE.Group  (add to scene)
 *   .getNodes()   → Object3D[]   (for Connections)
 *   .update(dt,t) → void
 */
export class Globe {
  public group: THREE.Group;

  private earth!: THREE.Mesh;
  private clouds!: THREE.Mesh;
  private atmosphere!: THREE.Mesh;
  private outerGlow!: THREE.Mesh;
  private orbitRing!: THREE.Mesh;
  private nodesGroup!: THREE.Group;

  // Placeholder shown while textures load
  private placeholder!: THREE.Mesh;
  private placeholderWireframe!: THREE.Mesh;
  private texturesLoaded = false;

  constructor() {
    this.group = new THREE.Group();

    this.buildPlaceholder();
    this.buildOrbitRing();
    this.buildNodes();
    this.loadTextures();
  }

  // ── Placeholder (shows immediately while textures download) ──────
  private buildPlaceholder() {
    const geo = new THREE.SphereGeometry(1.2, 64, 64);

    const mat = new THREE.MeshPhongMaterial({
      color: 0x0d3320,
      emissive: 0x041a0e,
      specular: 0x1a6640,
      shininess: 30,
    });
    this.placeholder = new THREE.Mesh(geo, mat);
    this.group.add(this.placeholder);

    const wireGeo = new THREE.SphereGeometry(1.21, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0x22c55e,
      transparent: true,
      opacity: 0.1,
    });
    this.placeholderWireframe = new THREE.Mesh(wireGeo, wireMat);
    this.group.add(this.placeholderWireframe);
  }

  // ── Green orbit ring (kept from original design) ─────────────────
  private buildOrbitRing() {
    const ringGeo = new THREE.TorusGeometry(1.7, 0.003, 2, 200);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.3,
    });
    this.orbitRing = new THREE.Mesh(ringGeo, ringMat);
    this.orbitRing.rotation.x = Math.PI / 2.5;
    this.group.add(this.orbitRing);
  }

  // ── Surface nodes (tiny — texture shows geography now) ───────────
  private buildNodes() {
    this.nodesGroup = new THREE.Group();
    const nodeCount = 40;
    // Very small radius so they don't obscure the texture map
    const nodeGeo = new THREE.SphereGeometry(0.008);
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const mat2 = new THREE.MeshBasicMaterial({ color: 0x86efac });

    const phi = Math.PI * (3 - Math.sqrt(5));
    const radius = 1.22;

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const node = new THREE.Mesh(nodeGeo, i % 2 === 0 ? mat1 : mat2);
      node.position.set(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius
      );
      node.userData.phase = Math.random() * Math.PI * 2;
      this.nodesGroup.add(node);
    }
    this.group.add(this.nodesGroup);
  }

  // ── Texture loading ──────────────────────────────────────────────
  private loadTextures() {
    const manager = new THREE.LoadingManager();

    manager.onLoad = () => {
      this.onTexturesReady();
    };

    manager.onError = (url) => {
      console.warn(`[Globe] Texture failed to load: ${url}`);
    };

    const loader = new THREE.TextureLoader(manager);

    const dayMap     = loader.load(url('earth_atmos_2048.jpg'));
    const nightMap   = loader.load(url('earth_lights_2048.png'));
    const specMap    = loader.load(url('earth_specular_2048.jpg'));
    const normalMap  = loader.load(url('earth_normal_2048.jpg'));
    const cloudMap   = loader.load(url('earth_clouds_1024.png'));

    // sRGB for colour textures, Linear for data maps
    dayMap.colorSpace   = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    // specMap and normalMap stay LinearSRGBColorSpace (default)

    // Build real Earth objects using the loaded textures.
    // They start invisible and are faded in inside onTexturesReady().
    this.buildEarth(dayMap, nightMap, specMap, normalMap);
    this.buildClouds(cloudMap);
    this.buildAtmosphere();
  }

  // ── Earth sphere ─────────────────────────────────────────────────
  private buildEarth(
    dayMap: THREE.Texture,
    nightMap: THREE.Texture,
    specMap: THREE.Texture,
    normalMap: THREE.Texture
  ) {
    const geo = new THREE.SphereGeometry(1.2, 64, 64);
    const mat = new THREE.MeshPhongMaterial({
      map:              dayMap,
      specularMap:      specMap,
      normalMap:        normalMap,
      normalScale:      new THREE.Vector2(0.85, 0.85),
      specular:         new THREE.Color(0x4488aa),
      shininess:        25,
      emissiveMap:      nightMap,
      emissive:         new THREE.Color(0x221100),
      emissiveIntensity: 0.6,
      transparent:      true,
      opacity:          0,          // faded in once loaded
    });
    this.earth = new THREE.Mesh(geo, mat);
    this.group.add(this.earth);
  }

  // ── Cloud layer ───────────────────────────────────────────────────
  private buildClouds(cloudMap: THREE.Texture) {
    const geo = new THREE.SphereGeometry(1.225, 64, 64);
    const mat = new THREE.MeshPhongMaterial({
      map:        cloudMap,
      transparent: true,
      opacity:    0,              // faded in once loaded
      depthWrite: false,
      blending:   THREE.AdditiveBlending,
    });
    this.clouds = new THREE.Mesh(geo, mat);
    this.group.add(this.clouds);
  }

  // ── Atmospheric glow layers ──────────────────────────────────────
  private buildAtmosphere() {
    // Inner blue rim — backside sphere, simulates Rayleigh scattering
    const atmosGeo = new THREE.SphereGeometry(1.29, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({
      color:      new THREE.Color(0x0044ff),
      transparent: true,
      opacity:    0.07,
      side:       THREE.BackSide,
      blending:   THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.group.add(this.atmosphere);

    // Outer diffuse glow halo
    const outerGeo = new THREE.SphereGeometry(1.44, 32, 32);
    const outerMat = new THREE.MeshPhongMaterial({
      color:      new THREE.Color(0x0033aa),
      transparent: true,
      opacity:    0.035,
      side:       THREE.BackSide,
      blending:   THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.outerGlow = new THREE.Mesh(outerGeo, outerMat);
    this.group.add(this.outerGlow);
  }

  // ── Called when all textures are downloaded ──────────────────────
  private onTexturesReady() {
    this.texturesLoaded = true;

    // Fade out placeholder
    const pmMat  = this.placeholder.material as THREE.MeshPhongMaterial;
    const pwMat  = this.placeholderWireframe.material as THREE.MeshBasicMaterial;

    // Fade in real Earth — simple step-based fade over ~60 frames
    let frame = 0;
    const totalFrames = 60;
    const fade = () => {
      frame++;
      const t = Math.min(frame / totalFrames, 1);

      (this.earth.material  as THREE.MeshPhongMaterial).opacity = t;
      (this.clouds.material as THREE.MeshPhongMaterial).opacity = t * 0.35;
      pmMat.opacity  = 1 - t;
      pwMat.opacity  = 0.1 * (1 - t);

      if (t < 1) requestAnimationFrame(fade);
      else {
        // Remove placeholder meshes once fully faded
        this.group.remove(this.placeholder);
        this.group.remove(this.placeholderWireframe);
        (this.placeholder.material as THREE.Material).dispose();
        (this.placeholderWireframe.material as THREE.Material).dispose();
        this.placeholder.geometry.dispose();
        this.placeholderWireframe.geometry.dispose();
      }
    };
    requestAnimationFrame(fade);
  }

  // ── Public API ───────────────────────────────────────────────────
  public getNodes(): THREE.Object3D[] {
    return this.nodesGroup.children;
  }

  public update(delta: number, time: number) {
    if (!this.texturesLoaded) {
      // Spin placeholder until real Earth is ready
      if (this.placeholder) this.placeholder.rotation.y += 0.0015;
      if (this.placeholderWireframe) this.placeholderWireframe.rotation.y += 0.0015;
    } else {
      // Real Earth rotates West → East
      this.earth.rotation.y  += 0.0008;
      // Clouds rotate slightly faster than the surface
      this.clouds.rotation.y += 0.0011;
    }

    // Nodes always co-rotate with Earth speed
    this.nodesGroup.rotation.y += 0.0008;

    // Atmosphere opacity breathes gently
    const baseOpacity = 0.07;
    const pulse = Math.sin(time * 1.5) * 0.015;
    if (this.atmosphere?.material) {
      (this.atmosphere.material as THREE.MeshPhongMaterial).opacity = baseOpacity + pulse;
    }

    // Nodes pulse in size
    this.nodesGroup.children.forEach(node => {
      const p = node.userData.phase as number;
      const scale = 1 + Math.sin(time * 3 + p) * 0.3;
      node.scale.set(scale, scale, scale);
    });

    // Orbit ring slow spin
    this.orbitRing.rotation.z += 0.001;
  }
}
