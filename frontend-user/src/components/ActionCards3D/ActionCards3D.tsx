import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Bike, Leaf, Zap, Sun } from 'lucide-react';

/**
 * ActionCards3D — Floating 3D action cards with mouse-tracking tilt,
 * glowing animated borders, and staggered scroll reveal.
 */

interface ActionItem {
  icon: React.ReactNode;
  name: string;
  rate: string;
  credits: string;
  color: string;
}

const actions: ActionItem[] = [
  { icon: <Bike size={28} />, name: 'Cycling Commute', rate: '4 credits / km', credits: '~160/mo', color: '#4ade80' },
  { icon: <Leaf size={28} />, name: 'Plant-based Meal', rate: '5 credits / meal', credits: '~150/mo', color: '#34d399' },
  { icon: <Zap size={28} />, name: 'Solar Energy', rate: '10 credits / kWh', credits: '~300/mo', color: '#6ee7b7' },
  { icon: <Sun size={28} />, name: 'LED Switch', rate: '20 credits / switch', credits: '~20/mo', color: '#a8f5c8' },
];

const ActionCard: React.FC<{ action: ActionItem; index: number }> = ({ action, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(600px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) translateZ(20px) translateY(-5px)`;
    
    // Move the glow highlight
    const glowEl = cardRef.current.querySelector('.card-glow-spot') as HTMLDivElement;
    if (glowEl) {
      glowEl.style.left = `${e.clientX - rect.left}px`;
      glowEl.style.top = `${e.clientY - rect.top}px`;
      glowEl.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) translateZ(0px) translateY(0px)';
    const glowEl = cardRef.current.querySelector('.card-glow-spot') as HTMLDivElement;
    if (glowEl) glowEl.style.opacity = '0';
  };

  return (
    <motion.div
      className="action3d-card-wrapper"
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.25, 1, 0.5, 1] }}
    >
      <div
        ref={cardRef}
        className="action3d-card glass-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-glow-spot" />
        <div className="action3d-glow-border" style={{ '--glow-color': action.color } as React.CSSProperties} />
        
        <div className="action3d-icon-ring" style={{ borderColor: `${action.color}40` }}>
          <div className="action3d-icon" style={{ color: action.color }}>
            {action.icon}
          </div>
        </div>
        
        <h3 className="action3d-name">{action.name}</h3>
        <div className="action3d-rate">{action.rate}</div>
        
        <div className="action3d-divider" />
        
        <div className="action3d-footer">
          <span className="action3d-est-label">Est. monthly</span>
          <span className="action3d-est-value">{action.credits}</span>
        </div>
      </div>
    </motion.div>
  );
};

const ActionCards3D: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section className="flow-section" ref={sectionRef}>
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
      >
        <div className="section-badge">EARN CREDITS</div>
        <h2 className="section-title-3d">Every Action Counts</h2>
        <p className="section-subtitle">Turn your daily eco-friendly choices into real carbon credits</p>
      </motion.div>

      <div className="action3d-grid">
        {actions.map((action, i) => (
          <ActionCard key={i} action={action} index={i} />
        ))}
      </div>
    </section>
  );
};

export default ActionCards3D;
