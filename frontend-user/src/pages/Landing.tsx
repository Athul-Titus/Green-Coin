import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero3D from '../components/Hero3D/Hero3D';
import HeroContent from '../components/Hero3D/HeroContent';
import '../styles/landing.css';

// Lazy-load heavy sections
const FlowTimeline = lazy(() => import('../components/FlowTimeline/FlowTimeline'));
const ActionCards3D = lazy(() => import('../components/ActionCards3D/ActionCards3D'));
const CorporateShowcase = lazy(() => import('../components/CorporateShowcase/CorporateShowcase'));
const FooterGlow = lazy(() => import('../components/FooterGlow/FooterGlow'));

const SectionLoader: React.FC = () => (
  <div className="section-loader">
    <div className="loader-dot" />
    <div className="loader-dot" />
    <div className="loader-dot" />
  </div>
);

/** Animated particle canvas that fills the fixed background */
function ParticlesBackground() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    wrapper.appendChild(canvas);

    let width = 0, height = 0;
    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];

    function resize() {
      width = wrapper!.clientWidth;
      height = wrapper!.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.5,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.fillStyle = `rgba(98, 223, 125, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
      canvas.remove();
    };
  }, []);

  return <div ref={wrapperRef} className="particles-canvas-wrapper" />;
}

/** Top navigation bar matching the Stitch design */
function StitchNavbar() {
  const navigate = useNavigate();

  return (
    <header className="stitch-navbar">
      <div className="stitch-navbar-inner">
        {/* Logo */}
        <a className="stitch-logo" href="#">
          <span className="material-symbols-outlined">eco</span>
          GreenCoin
        </a>

        {/* Nav links */}
        <nav>
          <ul className="stitch-nav-links">
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#actions">Actions</a></li>
            <li><a href="#corporate">Corporate</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/advisor'); }}>AI Advisor</a></li>
          </ul>
        </nav>

        {/* Right side */}
        <div className="stitch-nav-actions">
          <div className="trust-score-badge">
            <span className="dot-pulse" />
            <span>Live Market</span>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              background: 'linear-gradient(135deg, #1ca64d, #4de082)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}

export default function Landing() {
  return (
    <div className="landing-page">
      {/* ── Fixed global backgrounds ── */}
      <div className="bg-grid-overlay" />
      <div className="bg-radial-overlay" />
      <ParticlesBackground />

      {/* ── Navbar ── */}
      <StitchNavbar />

      {/* ── Hero Section (Stitch split layout) ── */}
      <main className="stitch-hero">
        <div className="stitch-hero-inner">
          <HeroContent />
          <Hero3D />
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <span className="material-symbols-outlined">expand_more</span>
        </div>
      </main>

      {/* ── Sections below the hero ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<SectionLoader />}>
          <div id="how-it-works">
            <FlowTimeline />
          </div>

          <div className="section-divider" />

          <div id="actions">
            <ActionCards3D />
          </div>

          <div className="section-divider" />

          <div id="corporate">
            <CorporateShowcase />
          </div>

          <FooterGlow />
        </Suspense>
      </div>
    </div>
  );
}
