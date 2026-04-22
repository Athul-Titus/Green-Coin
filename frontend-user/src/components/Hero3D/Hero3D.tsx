import React, { useEffect, useRef } from 'react';
import { EarthScene } from './EarthScene';

interface Hero3DProps {
  className?: string
}

const Hero3D: React.FC<Hero3DProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EarthScene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    try {
        sceneRef.current = new EarthScene(canvasRef.current);
        sceneRef.current.start();
    } catch (err) {
        console.error("Failed to initialize EarthScene:", err);
    }
    
    const handleVisibility = () => {
        // Option to pause when invisible, handled naturally by requestAnimationFrame
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        sceneRef.current?.destroy();
    };
  }, []);

  return (
    <div className={`hero-3d-container ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default Hero3D;
