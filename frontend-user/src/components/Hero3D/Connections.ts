import * as THREE from 'three';

export class Connections {
  public group: THREE.Group;
  private arcs: THREE.Group;
  private pulsesGroup: THREE.Group;
  private burstGroup: THREE.Group;

  private pulses: { mesh: THREE.Mesh, curve: THREE.QuadraticBezierCurve3, t: number, speed: number }[] = [];
  private bursts: { mesh: THREE.Points, pData: {vel: THREE.Vector3}[], lifetime: number, maxLifetime: number }[] = [];

  constructor(nodes: THREE.Object3D[]) {
    this.group = new THREE.Group();
    this.arcs = new THREE.Group();
    this.pulsesGroup = new THREE.Group();
    this.burstGroup = new THREE.Group();

    this.group.add(this.arcs);
    this.group.add(this.pulsesGroup);
    this.group.add(this.burstGroup);

    if (!nodes || nodes.length < 2) return;

    // Create 12 random connection pairs
    const arcCount = 12;
    const arcMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.2 });
    const pulseGeo = new THREE.SphereGeometry(0.018);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x86efac });

    for (let i = 0; i < arcCount; i++) {
      const nodeA = nodes[Math.floor(Math.random() * nodes.length)];
      let nodeB = nodes[Math.floor(Math.random() * nodes.length)];
      while(nodeB === nodeA) nodeB = nodes[Math.floor(Math.random() * nodes.length)];

      const p1 = nodeA.position.clone();
      const p2 = nodeB.position.clone();
      
      // Control point pushed outward to radius 1.5
      const mid = p1.clone().lerp(p2, 0.5).normalize().multiplyScalar(1.5);
      
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.002, 4, false);
      const tube = new THREE.Mesh(tubeGeo, arcMat);
      this.arcs.add(tube);

      // Add animated pulse
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      this.pulsesGroup.add(pulseMesh);
      
      this.pulses.push({
        mesh: pulseMesh,
        curve: curve,
        t: Math.random(), // random start point
        speed: 0.003 + Math.random() * 0.005
      });
    }
  }

  createBurst(position: THREE.Vector3) {
    const burstCount = 5;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(burstCount * 3);
    const pData = [];
    
    for(let i=0; i<burstCount; i++) {
        pos[i*3] = position.x;
        pos[i*3+1] = position.y;
        pos[i*3+2] = position.z;
        pData.push({
            vel: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            ).add(position.clone().normalize().multiplyScalar(0.01))
        });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x86efac, size: 0.04, transparent: true, opacity: 1 });
    const pts = new THREE.Points(geo, mat);
    this.burstGroup.add(pts);
    
    this.bursts.push({
        mesh: pts,
        pData,
        lifetime: 0,
        maxLifetime: 0.5 // seconds
    });
  }

  update(delta: number, time: number) {
    // rotate with earth
    this.group.rotation.y += 0.0015;

    this.pulses.forEach(p => {
        p.t += p.speed;
        if (p.t >= 1) {
            p.t = 0;
            const endPoint = p.curve.getPoint(1);
            this.createBurst(endPoint);
        }
        const point = p.curve.getPoint(p.t);
        p.mesh.position.copy(point);
    });

    // Update bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
        const b = this.bursts[i];
        b.lifetime += delta;
        if (b.lifetime >= b.maxLifetime) {
            this.burstGroup.remove(b.mesh);
            b.mesh.geometry.dispose();
            (b.mesh.material as THREE.Material).dispose();
            this.bursts.splice(i, 1);
            continue;
        }

        const posAttr = b.mesh.geometry.attributes.position;
        const ptsArray = posAttr.array as Float32Array;
        
        for(let j=0; j<5; j++) {
            ptsArray[j*3] += b.pData[j].vel.x;
            ptsArray[j*3+1] += b.pData[j].vel.y;
            ptsArray[j*3+2] += b.pData[j].vel.z;
        }
        posAttr.needsUpdate = true;
        
        const progress = b.lifetime / b.maxLifetime;
        (b.mesh.material as THREE.Material).opacity = 1 - progress;
    }
  }
}
