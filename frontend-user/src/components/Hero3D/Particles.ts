import * as THREE from 'three';

export class Particles {
  public group: THREE.Group;
  private orbitalGeo: THREE.BufferGeometry;
  private emissionGeo: THREE.BufferGeometry;
  private starGeo: THREE.BufferGeometry;
  
  private orbitalPoints: THREE.Points;
  private emissionPoints: THREE.Points;
  private stars: THREE.Points;

  private orbitalData: { angle: number, speed: number, radius: number }[] = [];
  private emissionData: { x: number, y: number, z: number, r: number, maxR: number, opacity: number }[] = [];

  constructor() {
    this.group = new THREE.Group();

    // STAR FIELD (1200 points)
    const starCount = 1200;
    this.starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starOpacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        starPositions[i*3] = (Math.random() - 0.5) * 80;
        starPositions[i*3+1] = (Math.random() - 0.5) * 80;
        starPositions[i*3+2] = (Math.random() - 0.5) * 80;
        starOpacities[i] = 0.4 + Math.random() * 0.1;
    }
    this.starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starGeo.setAttribute('aOpacity', new THREE.BufferAttribute(starOpacities, 1));

    // Custom shader for opacity
    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x4ade80) }
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0 * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          float pulse = (sin(time * 2.0 + vOpacity * 100.0) * 0.5 + 0.5) * 0.3;
          gl_FragColor = vec4(color, vOpacity + pulse);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.stars = new THREE.Points(this.starGeo, starMat);
    this.group.add(this.stars);

    // ORBITAL PARTICLES
    const isMobile = window.innerWidth < 768;
    const orbitalCount = isMobile ? 40 : 80;
    this.orbitalGeo = new THREE.BufferGeometry();
    const orbitalPositions = new Float32Array(orbitalCount * 3);
    for (let i = 0; i < orbitalCount; i++) {
      this.orbitalData.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.003,
        radius: 1.6 + Math.random() * 0.15
      });
    }
    this.orbitalGeo.setAttribute('position', new THREE.BufferAttribute(orbitalPositions, 3));
    const orbitalMat = new THREE.PointsMaterial({ color: 0x86efac, size: 0.05, transparent: true, opacity: 0.8 });
    this.orbitalPoints = new THREE.Points(this.orbitalGeo, orbitalMat);
    this.orbitalPoints.rotation.x = Math.PI / 2.5;
    this.group.add(this.orbitalPoints);

    // EMISSION PARTICLES
    const emissionCount = isMobile ? 15 : 30;
    this.emissionGeo = new THREE.BufferGeometry();
    const emissionPositions = new Float32Array(emissionCount * 3);
    const emissionOpacities = new Float32Array(emissionCount);
    for(let i=0; i<emissionCount; i++) {
      this.resetEmissionParticle(i);
      emissionPositions[i*3] = this.emissionData[i].x;
      emissionPositions[i*3+1] = this.emissionData[i].y;
      emissionPositions[i*3+2] = this.emissionData[i].z;
      emissionOpacities[i] = this.emissionData[i].opacity;
    }
    this.emissionGeo.setAttribute('position', new THREE.BufferAttribute(emissionPositions, 3));
    this.emissionGeo.setAttribute('aOpacity', new THREE.BufferAttribute(emissionOpacities, 1));
    const emissionMat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0x4ade80) } },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0 * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(color, vOpacity);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.emissionPoints = new THREE.Points(this.emissionGeo, emissionMat);
    this.group.add(this.emissionPoints);
  }

  resetEmissionParticle(index: number) {
    const phi = Math.acos(-1 + (2 * Math.random()));
    const theta = Math.sqrt(30 * Math.PI) * phi;
    const radius = 1.2;
    const nx = Math.cos(theta) * Math.sin(phi);
    const ny = Math.sin(theta) * Math.sin(phi);
    const nz = Math.cos(phi);
    
    this.emissionData[index] = {
      x: nx, y: ny, z: nz, r: radius,
      maxR: 1.8 + Math.random() * 0.4,
      opacity: 1.0
    };
  }

  update(delta: number, time: number) {
    // Stars
    if (this.stars.material instanceof THREE.ShaderMaterial) {
      this.stars.material.uniforms.time.value = time;
    }

    // Orbital
    const orbitalPos = this.orbitalGeo.attributes.position.array as Float32Array;
    for(let i=0; i<this.orbitalData.length; i++) {
        const d = this.orbitalData[i];
        d.angle += d.speed;
        orbitalPos[i*3] = Math.cos(d.angle) * d.radius;
        orbitalPos[i*3+1] = Math.sin(d.angle) * d.radius * 0.3;
        orbitalPos[i*3+2] = Math.sin(d.angle) * d.radius * 0.6;
    }
    this.orbitalGeo.attributes.position.needsUpdate = true;
    
    this.orbitalPoints.rotation.z += 0.001; // slow rotate

    // Emission
    const emissionPos = this.emissionGeo.attributes.position.array as Float32Array;
    const emissionOpacities = this.emissionGeo.attributes.aOpacity.array as Float32Array;
    this.emissionPoints.rotation.y += 0.0015; // match earth
    
    for(let i=0; i<this.emissionData.length; i++) {
      const d = this.emissionData[i];
      d.r += 0.005; // rise up
      
      const progress = (d.r - 1.2) / (d.maxR - 1.2);
      d.opacity = Math.max(0, 1.0 - progress);

      if (d.r >= d.maxR) {
        this.resetEmissionParticle(i);
      }

      emissionPos[i*3] = d.x * d.r;
      emissionPos[i*3+1] = d.y * d.r;
      emissionPos[i*3+2] = d.z * d.r;
      emissionOpacities[i] = d.opacity;
    }
    this.emissionGeo.attributes.position.needsUpdate = true;
    this.emissionGeo.attributes.aOpacity.needsUpdate = true;
  }
}
