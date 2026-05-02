import React, { Suspense, lazy } from 'react';
import Hero3D from '../components/Hero3D/Hero3D';
import HeroContent from '../components/Hero3D/HeroContent';
import '../styles/landing.css';

// Lazy-load heavy sections (Three.js canvas, 3D components)
const FlowCanvas = lazy(() => import('../components/FlowCanvas/FlowCanvas'));
const FlowTimeline = lazy(() => import('../components/FlowTimeline/FlowTimeline'));
const ActionCards3D = lazy(() => import('../components/ActionCards3D/ActionCards3D'));
const CorporateShowcase = lazy(() => import('../components/CorporateShowcase/CorporateShowcase'));
const FooterGlow = lazy(() => import('../components/FooterGlow/FooterGlow'));

const SectionLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    color: 'rgba(168, 245, 200, 0.3)',
    fontSize: '14px',
    letterSpacing: '2px',
  }}>
    <div className="section-loader">
      <div className="loader-dot" />
      <div className="loader-dot" />
      <div className="loader-dot" />
    </div>
  </div>
);

export default function Landing() {
  return (
    <div className="landing-page">
      {/* ── Persistent particle flow background ── */}
      <Suspense fallback={null}>
        <FlowCanvas />
      </Suspense>

      {/* ── 3D Hero Section (unchanged) ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Hero3D />
        <HeroContent />
      </div>

      {/* ── Sections below the hero ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<SectionLoader />}>
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
        </Suspense>
      </div>
    </div>
  );
}
