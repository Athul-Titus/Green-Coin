import React, { useEffect, useRef } from 'react';
import { EarthScene } from './EarthScene';

/**
 * Hero3D
 * ──────
 * Right-column photorealistic Earth for the Stitch landing page.
 * The canvas fills its container div (.hero-right / .hero-globe-wrapper)
 * and the EarthScene renders against a transparent background so the
 * dark landing page shows through.
 */
const Hero3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const sceneRef     = useRef<EarthScene | null>(null);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Size canvas to match its CSS container before creating the scene
    canvas.width  = container.clientWidth;
    canvas.height = container.clientHeight;

    try {
      sceneRef.current = new EarthScene(canvas);
      sceneRef.current.start();
    } catch (err) {
      console.error('Failed to initialize EarthScene:', err);
    }

    // Keep canvas sized to container on window resize
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width  = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sceneRef.current?.destroy();
    };
  }, []);

  return (
    <div className="hero-right">
      <div className="hero-right-glow" />
      <div
        ref={containerRef}
        className="hero-globe-wrapper"
        style={{ pointerEvents: 'none' }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </div>
  );
};

export default Hero3D;
