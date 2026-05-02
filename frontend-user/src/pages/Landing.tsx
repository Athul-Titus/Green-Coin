import React from 'react';
import Hero3D from '../components/Hero3D/Hero3D';
import HeroContent from '../components/Hero3D/HeroContent';
import FlowCanvas from '../components/FlowCanvas/FlowCanvas';
import FlowTimeline from '../components/FlowTimeline/FlowTimeline';
import ActionCards3D from '../components/ActionCards3D/ActionCards3D';
import CorporateShowcase from '../components/CorporateShowcase/CorporateShowcase';
import FooterGlow from '../components/FooterGlow/FooterGlow';
import '../styles/landing.css';

export default function Landing() {
  return (
    <div className="landing-page">
      {/* ── Persistent particle flow background ── */}
      <FlowCanvas />

      {/* ── 3D Hero Section (unchanged) ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Hero3D />
        <HeroContent />
      </div>

      {/* ── Sections below the hero ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* How It Works — flowing timeline */}
        <FlowTimeline />

        <div className="section-divider" />

        {/* Every Action Counts — 3D floating cards */}
        <ActionCards3D />

        <div className="section-divider" />

        {/* Corporate Showcase — parallax + holo dashboard */}
        <CorporateShowcase />

        {/* Footer — glow convergence */}
        <FooterGlow />
      </div>
    </div>
  );
}
