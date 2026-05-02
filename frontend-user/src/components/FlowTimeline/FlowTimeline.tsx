import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * FlowTimeline — 3D flowing "How It Works" section
 * Vertical timeline with animated SVG connector, glassmorphism cards,
 * and 3D perspective tilt on hover.
 */

interface TimelineStep {
  icon: string;
  title: string;
  description: string;
  detail: string;
}

const steps: TimelineStep[] = [
  {
    icon: '🌱',
    title: 'Log Green Actions',
    description: 'Take eco-friendly actions like cycling, eating plant-based, or using solar power.',
    detail: 'GPS + Image verification'
  },
  {
    icon: '🤖',
    title: 'AI Verifies & Mints',
    description: 'Our ML pipeline instantly verifies your action and mints authentic Carbon Credits.',
    detail: 'Trust score ≥ 85%'
  },
  {
    icon: '🏢',
    title: 'Sell to Corporations',
    description: 'Credits are sold to enterprises needing ESG compliance carbon offsets.',
    detail: '₹50 per credit'
  }
];

const TimelineCard: React.FC<{ step: TimelineStep; index: number; isLeft: boolean }> = ({ step, index, isLeft }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(10px)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
  };

  return (
    <motion.div
      className={`timeline-row ${isLeft ? 'timeline-left' : 'timeline-right'}`}
      initial={{ opacity: 0, x: isLeft ? -80 : 80, scale: 0.9 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay: index * 0.2, ease: [0.25, 1, 0.5, 1] }}
    >
      <div
        ref={cardRef}
        className="timeline-card glass-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="timeline-card-icon">{step.icon}</div>
        <div className="timeline-card-step">STEP {index + 1}</div>
        <h3 className="timeline-card-title">{step.title}</h3>
        <p className="timeline-card-desc">{step.description}</p>
        <div className="timeline-card-badge">{step.detail}</div>
      </div>
    </motion.div>
  );
};

const AnimatedConnector: React.FC = () => {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <svg
      ref={ref}
      className="timeline-connector"
      viewBox="0 0 4 300"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0" />
          <stop offset="20%" stopColor="#4ade80" stopOpacity="1" />
          <stop offset="80%" stopColor="#4ade80" stopOpacity="1" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line
        x1="2" y1="0" x2="2" y2="300"
        stroke="url(#lineGrad)"
        strokeWidth="2"
        filter="url(#glow)"
        strokeDasharray="300"
        strokeDashoffset={isInView ? 0 : 300}
        style={{ transition: 'stroke-dashoffset 2s ease-out' }}
      />
      {/* Pulsing dots at each step */}
      {[50, 150, 250].map((cy, i) => (
        <circle
          key={i}
          cx="2" cy={cy} r="4"
          fill="#4ade80"
          filter="url(#glow)"
          opacity={isInView ? 1 : 0}
          style={{ transition: `opacity 0.5s ease ${0.5 + i * 0.3}s` }}
        >
          <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
        </circle>
      ))}
    </svg>
  );
};

const FlowTimeline: React.FC = () => {
  return (
    <section className="flow-section">
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
      >
        <div className="section-badge">HOW IT WORKS</div>
        <h2 className="section-title-3d">Three Simple Steps</h2>
        <p className="section-subtitle">From green action to carbon credit in minutes</p>
      </motion.div>

      <div className="timeline-container">
        <AnimatedConnector />
        <div className="timeline-steps">
          {steps.map((step, i) => (
            <TimelineCard key={i} step={step} index={i} isLeft={i % 2 === 0} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlowTimeline;
