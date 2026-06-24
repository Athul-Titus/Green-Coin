import React, { useEffect, useRef } from 'react';
import { EarthScene } from './EarthScene';

/**
 * Hero3D — Right-column globe visual for the Stitch landing page design.
 * The globe sits inside .hero-right as a decorative 3D element.
 */
const Hero3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EarthScene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      sceneRef.current = new EarthScene(canvasRef.current);
      sceneRef.current.start();
    } catch (err) {
      console.error('Failed to initialize EarthScene:', err);
    }

    return () => {
      sceneRef.current?.destroy();
    };
  }, []);

  return (
    <div className="hero-right">
      <div className="hero-right-glow" />
      <div className="hero-globe-wrapper">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
};

export default Hero3D;
