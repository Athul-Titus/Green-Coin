import * as THREE from 'three';

export class Particles {
  public group: THREE.Group;
  private orbitalGeo: THREE.BufferGeometry;
  private emissionGeo: THREE.BufferGeometry;
  private starGeo: THREE.BufferGeometry;

  private orbitalPoints: THREE.Points;
  private emissionPoints: THREE.Points;
  private stars: THREE.Points;

  private orbitalData: { angle: number; speed: number; radius: number }[] = [];
  private emissionData: { x: number; y: number; z: number; r: number; maxR: number; opacity: number }[] = [];

  // Shared circular-disc GLSL snippet
  // gl_PointCoord goes 0→1 across the point quad.
  // Discard fragments outside the unit circle to get a round dot.
  private static CIRCLE_FRAG = `
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    if (dot(cxy, cxy) > 1.0) discard;
  `;

  constructor() {
    this.group = new THREE.Group();

    // ── STAR FIELD ──────────────────────────────────────────────
    const starCount = 1200;
    this.starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starOpacities  = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3]     = (Math.random() - 0.5) * 80;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      starOpacities[i] = 0.3 + Math.random() * 0.3;
    }
    this.starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starGeo.setAttribute('aOpacity', new THREE.BufferAttribute(starOpacities, 1));

    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        time:  { value: 0 },
        color: { value: new THREE.Color(0x4ade80) },
      },
      vertexShader: `
        attribute float aOpacity;
        varying   float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Fixed tiny point size — stars are distant, stay small
          gl_PointSize = 1.5;
          gl_Position  = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3  color;
        varying float vOpacity;
        void main() {
          // Round disc
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          if (dot(cxy, cxy) > 1.0) discard;
          float pulse = (sin(time * 2.0 + vOpacity * 100.0) * 0.5 + 0.5) * 0.25;
          gl_FragColor = vec4(color, vOpacity + pulse);
        }
      `,
      transparent: true,
      depthWrite:  false,
    });
    this.stars = new THREE.Points(this.starGeo, starMat);
    this.group.add(this.stars);

    // ── ORBITAL PARTICLES ────────────────────────────────────────
    const isMobile    = window.innerWidth < 768;
    const orbitalCount = isMobile ? 40 : 80;
    this.orbitalGeo   = new THREE.BufferGeometry();
    const orbitalPositions = new Float32Array(orbitalCount * 3);

    for (let i = 0; i < orbitalCount; i++) {
      this.orbitalData.push({
        angle:  Math.random() * Math.PI * 2,
        speed:  0.004 + Math.random() * 0.003,
        radius: 1.6 + Math.random() * 0.15,
      });
    }
    this.orbitalGeo.setAttribute('position', new THREE.BufferAttribute(orbitalPositions, 3));

    // Shader-based so we get circular dots
    const orbitalMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x86efac) },
      },
      vertexShader: `
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Small fixed size — these are delicate orbital trails
          gl_PointSize = 2.5;
          gl_Position  = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          if (dot(cxy, cxy) > 1.0) discard;
          // Soft edge
          float alpha = 1.0 - smoothstep(0.6, 1.0, dot(cxy, cxy));
          gl_FragColor = vec4(color, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite:  false,
    });
    this.orbitalPoints = new THREE.Points(this.orbitalGeo, orbitalMat);
    this.orbitalPoints.rotation.x = Math.PI / 2.5;
    this.group.add(this.orbitalPoints);

    // ── EMISSION PARTICLES (green sparks rising off the surface) ─
    const emissionCount = isMobile ? 15 : 30;
    this.emissionGeo    = new THREE.BufferGeometry();
    const emissionPositions = new Float32Array(emissionCount * 3);
    const emissionOpacities = new Float32Array(emissionCount);

    for (let i = 0; i < emissionCount; i++) {
      this.resetEmissionParticle(i);
      emissionPositions[i * 3]     = this.emissionData[i].x;
      emissionPositions[i * 3 + 1] = this.emissionData[i].y;
      emissionPositions[i * 3 + 2] = this.emissionData[i].z;
      emissionOpacities[i] = this.emissionData[i].opacity;
    }
    this.emissionGeo.setAttribute('position', new THREE.BufferAttribute(emissionPositions, 3));
    this.emissionGeo.setAttribute('aOpacity', new THREE.BufferAttribute(emissionOpacities, 1));

    const emissionMat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0x4ade80) } },
      vertexShader: `
        attribute float aOpacity;
        varying   float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0;
          gl_Position  = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3  color;
        varying float vOpacity;
        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          if (dot(cxy, cxy) > 1.0) discard;
          float alpha = 1.0 - smoothstep(0.5, 1.0, dot(cxy, cxy));
          gl_FragColor = vec4(color, vOpacity * alpha);
        }
      `,
      transparent: true,
      depthWrite:  false,
    });
    this.emissionPoints = new THREE.Points(this.emissionGeo, emissionMat);
    this.group.add(this.emissionPoints);
  }

  resetEmissionParticle(index: number) {
    const phi   = Math.acos(-1 + 2 * Math.random());
    const theta = Math.sqrt(30 * Math.PI) * phi;
    const nx = Math.cos(theta) * Math.sin(phi);
    const ny = Math.sin(theta) * Math.sin(phi);
    const nz = Math.cos(phi);

    this.emissionData[index] = {
      x: nx, y: ny, z: nz,
      r: 1.2,
      maxR: 1.8 + Math.random() * 0.4,
      opacity: 1.0,
    };
  }

  update(delta: number, time: number) {
    // Stars — pass time uniform for twinkling
    if (this.stars.material instanceof THREE.ShaderMaterial) {
      this.stars.material.uniforms.time.value = time;
    }

    // Orbital particles
    const orbitalPos = this.orbitalGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < this.orbitalData.length; i++) {
      const d = this.orbitalData[i];
      d.angle += d.speed;
      orbitalPos[i * 3]     = Math.cos(d.angle) * d.radius;
      orbitalPos[i * 3 + 1] = Math.sin(d.angle) * d.radius * 0.3;
      orbitalPos[i * 3 + 2] = Math.sin(d.angle) * d.radius * 0.6;
    }
    this.orbitalGeo.attributes.position.needsUpdate = true;
    this.orbitalPoints.rotation.z += 0.001;

    // Emission sparks
    const emissionPos = this.emissionGeo.attributes.position.array as Float32Array;
    const emissionOpa = this.emissionGeo.attributes.aOpacity.array  as Float32Array;
    this.emissionPoints.rotation.y += 0.0008; // match Earth speed

    for (let i = 0; i < this.emissionData.length; i++) {
      const d = this.emissionData[i];
      d.r += 0.005;
      const progress = (d.r - 1.2) / (d.maxR - 1.2);
      d.opacity = Math.max(0, 1.0 - progress);
      if (d.r >= d.maxR) this.resetEmissionParticle(i);

      emissionPos[i * 3]     = d.x * d.r;
      emissionPos[i * 3 + 1] = d.y * d.r;
      emissionPos[i * 3 + 2] = d.z * d.r;
      emissionOpa[i]         = d.opacity;
    }
    this.emissionGeo.attributes.position.needsUpdate = true;
    this.emissionGeo.attributes.aOpacity.needsUpdate  = true;
  }
}
