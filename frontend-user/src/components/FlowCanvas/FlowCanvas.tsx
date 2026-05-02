import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * FlowCanvas — A persistent Three.js particle river background
 * Renders flowing green particles in organic wave patterns behind all sections.
 * Uses scroll position to modulate flow speed for an interactive feel.
 */
const FlowCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    particles: THREE.Points;
    trailParticles: THREE.Points;
    glowMeshes: THREE.Mesh[];
    clock: THREE.Clock;
    reqId: number;
    scrollY: number;
    mouseX: number;
    mouseY: number;
    particleData: { x: number; y: number; z: number; speedX: number; speedY: number; phase: number; amplitude: number }[];
    trailData: { x: number; y: number; z: number; life: number; maxLife: number; speedX: number; speedY: number }[];
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Setup
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 30;

    const clock = new THREE.Clock();

    // ── Main flow particles ──
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 120 : 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    const particleData: typeof sceneRef.current extends null ? never : NonNullable<typeof sceneRef.current>['particleData'] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 20;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      opacities[i] = 0.2 + Math.random() * 0.6;
      sizes[i] = 1.0 + Math.random() * 2.5;
      particleData.push({
        x, y, z,
        speedX: (Math.random() - 0.3) * 0.02,
        speedY: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.5 + Math.random() * 2.0
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x4ade80) },
        color2: { value: new THREE.Color(0x065f46) },
        scrollInfluence: { value: 0 }
      },
      vertexShader: `
        attribute float aOpacity;
        attribute float aSize;
        varying float vOpacity;
        varying float vDepth;
        uniform float time;
        uniform float scrollInfluence;
        void main() {
          vOpacity = aOpacity;
          vec3 pos = position;
          pos.x += sin(time * 0.3 + position.y * 0.1) * 2.0;
          pos.y += scrollInfluence * 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vDepth = -mvPosition.z;
          gl_PointSize = aSize * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float time;
        varying float vOpacity;
        varying float vDepth;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = 1.0 - dist * 2.0;
          glow = pow(glow, 2.0);
          float depthMix = clamp(vDepth / 30.0, 0.0, 1.0);
          vec3 color = mix(color1, color2, depthMix);
          float pulse = sin(time * 1.5 + vDepth * 0.5) * 0.15 + 0.85;
          gl_FragColor = vec4(color, vOpacity * glow * pulse);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Trail particles (smaller, faster, create motion streaks) ──
    const trailCount = isMobile ? 60 : 150;
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(trailCount * 3);
    const trailOpacities = new Float32Array(trailCount);
    const trailData: typeof sceneRef.current extends null ? never : NonNullable<typeof sceneRef.current>['trailData'] = [];

    for (let i = 0; i < trailCount; i++) {
      trailPos[i * 3] = (Math.random() - 0.5) * 50;
      trailPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      trailPos[i * 3 + 2] = (Math.random() - 0.5) * 15;
      trailOpacities[i] = 0;
      trailData.push({
        x: trailPos[i * 3], y: trailPos[i * 3 + 1], z: trailPos[i * 3 + 2],
        life: Math.random() * 3, maxLife: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.08,
        speedY: 0.03 + Math.random() * 0.06
      });
    }

    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute('aOpacity', new THREE.BufferAttribute(trailOpacities, 1));

    const trailMat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0xa8f5c8) } },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 1.5 * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = 1.0 - dist * 2.0;
          gl_FragColor = vec4(color, vOpacity * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const trailParticles = new THREE.Points(trailGeo, trailMat);
    scene.add(trailParticles);

    // ── Ambient glow orbs ──
    const glowMeshes: THREE.Mesh[] = [];
    const glowPositions = [
      { x: -15, y: -10, z: -5 },
      { x: 12, y: 5, z: -8 },
      { x: -8, y: 20, z: -6 },
      { x: 18, y: -20, z: -10 }
    ];

    glowPositions.forEach(pos => {
      const glowGeo = new THREE.SphereGeometry(3, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x166534,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(pos.x, pos.y, pos.z);
      glow.scale.setScalar(2);
      scene.add(glow);
      glowMeshes.push(glow);
    });

    // Store refs
    sceneRef.current = {
      renderer, scene, camera, particles, trailParticles, glowMeshes,
      clock, reqId: 0, scrollY: 0, mouseX: 0, mouseY: 0,
      particleData, trailData
    };

    // ── Animation loop ──
    const animate = () => {
      const s = sceneRef.current;
      if (!s) return;
      s.reqId = requestAnimationFrame(animate);

      const time = s.clock.getElapsedTime();
      const delta = s.clock.getDelta();

      // Update shader uniforms
      if (s.particles.material instanceof THREE.ShaderMaterial) {
        s.particles.material.uniforms.time.value = time;
        s.particles.material.uniforms.scrollInfluence.value = s.scrollY * 0.001;
      }

      // Animate main particles
      const pos = s.particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < s.particleData.length; i++) {
        const d = s.particleData[i];
        d.y += d.speedY;
        d.x += Math.sin(time * 0.5 + d.phase) * d.amplitude * 0.005;

        if (d.y > 40) { d.y = -40; d.x = (Math.random() - 0.5) * 60; }
        if (d.y < -40) { d.y = 40; }

        pos[i * 3] = d.x + Math.sin(time * 0.2 + d.phase) * d.amplitude;
        pos[i * 3 + 1] = d.y;
        pos[i * 3 + 2] = d.z;
      }
      s.particles.geometry.attributes.position.needsUpdate = true;

      // Animate trail particles
      const tPos = s.trailParticles.geometry.attributes.position.array as Float32Array;
      const tOp = s.trailParticles.geometry.attributes.aOpacity.array as Float32Array;
      for (let i = 0; i < s.trailData.length; i++) {
        const d = s.trailData[i];
        d.life += 0.016;
        d.y += d.speedY;
        d.x += d.speedX + Math.sin(time + i) * 0.01;

        const progress = d.life / d.maxLife;
        tOp[i] = progress < 0.2 ? progress * 5 : progress > 0.8 ? (1 - progress) * 5 : 1;
        tOp[i] *= 0.4;

        if (d.life >= d.maxLife) {
          d.life = 0;
          d.x = (Math.random() - 0.5) * 50;
          d.y = (Math.random() - 0.5) * 80;
          d.z = (Math.random() - 0.5) * 15;
        }

        tPos[i * 3] = d.x;
        tPos[i * 3 + 1] = d.y;
        tPos[i * 3 + 2] = d.z;
      }
      s.trailParticles.geometry.attributes.position.needsUpdate = true;
      s.trailParticles.geometry.attributes.aOpacity.needsUpdate = true;

      // Animate glow orbs
      s.glowMeshes.forEach((mesh, i) => {
        mesh.scale.setScalar(2 + Math.sin(time * 0.5 + i * 1.5) * 0.3);
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = 0.04 + Math.sin(time * 0.3 + i) * 0.02;
        }
      });

      // Mouse parallax
      s.scene.position.x += (s.mouseX * 2 - s.scene.position.x) * 0.02;
      s.scene.position.y += (s.mouseY * 1 - s.scene.position.y) * 0.02;

      s.renderer.render(s.scene, s.camera);
    };

    animate();

    // ── Event handlers ──
    const onScroll = () => {
      if (sceneRef.current) sceneRef.current.scrollY = window.scrollY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (sceneRef.current) {
        sceneRef.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        sceneRef.current.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      }
    };
    const onResize = () => {
      if (!sceneRef.current) return;
      sceneRef.current.camera.aspect = window.innerWidth / window.innerHeight;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.reqId);
        sceneRef.current.renderer.dispose();
        sceneRef.current.particles.geometry.dispose();
        (sceneRef.current.particles.material as THREE.Material).dispose();
        sceneRef.current.trailParticles.geometry.dispose();
        (sceneRef.current.trailParticles.material as THREE.Material).dispose();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default FlowCanvas;
