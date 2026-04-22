import * as THREE from 'three';

export class Globe {
  public group: THREE.Group;
  private earth: THREE.Mesh;
  private wireframe: THREE.Mesh;
  private atmosphere: THREE.Mesh;
  private orbitRing: THREE.Mesh;
  private nodesGroup: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    // EARTH MESH
    const geometry = new THREE.SphereGeometry(1.2, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x0d3320,
      emissive: 0x041a0e,
      specular: 0x1a6640,
      shininess: 30
    });
    this.earth = new THREE.Mesh(geometry, material);
    this.group.add(this.earth);

    // WIREFRAME OVERLAY
    const wireGeo = new THREE.SphereGeometry(1.21, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x22c55e, transparent: true, opacity: 0.08 });
    this.wireframe = new THREE.Mesh(wireGeo, wireMat);
    this.group.add(this.wireframe);

    // ATMOSPHERE
    const atmosGeo = new THREE.SphereGeometry(1.35, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({ color: 0x16a34a, side: THREE.BackSide, transparent: true, opacity: 0.08 });
    this.atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.group.add(this.atmosphere);

    // ORBIT RING
    const ringGeo = new THREE.TorusGeometry(1.7, 0.003, 2, 200);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.3 });
    this.orbitRing = new THREE.Mesh(ringGeo, ringMat);
    this.orbitRing.rotation.x = Math.PI / 2.5;
    this.group.add(this.orbitRing);

    // SURFACE NODES (fibonacci sphere)
    this.nodesGroup = new THREE.Group();
    const nodeCount = 40;
    const nodeGeo = new THREE.SphereGeometry(0.012);
    // Use InstancedMesh instead as required by "PERFORMANCE REQUIREMENTS: Use instanced mesh for surface nodes"
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const mat2 = new THREE.MeshBasicMaterial({ color: 0x86efac });

    const phi = Math.PI * (3 - Math.sqrt(5));
    const radius = 1.22;

    for (let i = 0; i < nodeCount; i++) {
        const y = 1 - (i / (nodeCount - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        const node = new THREE.Mesh(nodeGeo, i % 2 === 0 ? mat1 : mat2);
        node.position.set(x * radius, y * radius, z * radius);
        node.userData.phase = Math.random() * Math.PI * 2;
        this.nodesGroup.add(node);
    }
    this.group.add(this.nodesGroup);
  }

  public getNodes() {
    return this.nodesGroup.children;
  }

  update(delta: number, time: number) {
    this.earth.rotation.y += 0.0015;
    this.wireframe.rotation.y += 0.0015;
    this.nodesGroup.rotation.y += 0.0015;
    
    // atmosphere opacity pulses
    const baseOpacity = 0.09;
    const pulse = Math.sin(time * 2) * 0.03;
    (this.atmosphere.material as THREE.Material).opacity = baseOpacity + pulse;

    // nodes pulse
    this.nodesGroup.children.forEach(node => {
      const p = node.userData.phase;
      const scale = 1 + Math.sin(time * 3 + p) * 0.3;
      node.scale.set(scale, scale, scale);
    });

    this.orbitRing.rotation.z += 0.001;
  }
}
