import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface CounterState {
  current: number;
  target: number;
  el: HTMLSpanElement;
}

function useCounterAnimation(targets: { selector: string; target: number }[]) {
  useEffect(() => {
    const speed = 200;
    const counters: CounterState[] = [];

    targets.forEach(({ selector, target }) => {
      const el = document.querySelector<HTMLSpanElement>(selector);
      if (el) counters.push({ current: 0, target, el });
    });

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    counters.forEach((counter) => {
      const inc = counter.target / speed;
      const update = () => {
        if (counter.current < counter.target) {
          counter.current = Math.min(counter.current + inc, counter.target);
          counter.el.textContent = Math.ceil(counter.current).toLocaleString();
          const t = setTimeout(update, 15);
          timeouts.push(t);
        } else {
          counter.el.textContent = counter.target.toLocaleString() + '+';
        }
      };
      const t = setTimeout(update, 600);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);
}

export default function HeroContent() {
  const navigate = useNavigate();

  useCounterAnimation([
    { selector: '#counter-credits', target: 48290 },
    { selector: '#counter-tonnes', target: 1240 },
    { selector: '#counter-users', target: 8730 },
  ]);

  return (
    <div className="hero-left">
      {/* Badge */}
      <div className="hero-badge glow-green">
        <span className="dot-pulse" />
        <span className="hero-badge-text">Democratizing Carbon Markets</span>
      </div>

      {/* Headline */}
      <h1 className="hero-headline">
        <span className="hero-headline-line">Earn Green.</span>
        <span className="hero-headline-line accent">Sell Carbon.</span>
        <span className="hero-headline-line">Change Earth.</span>
      </h1>

      {/* Sub-headline */}
      <p className="hero-subheadline">
        Log your green lifestyle choices. GreenCoin verifies and mints carbon credits.
        Corporations buy them for ESG compliance.
      </p>

      {/* CTA Buttons */}
      <div className="hero-cta-row">
        <button
          className="cta-primary"
          onClick={() => navigate('/onboarding')}
        >
          Start Earning Credits
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button
          className="cta-secondary"
          onClick={() => alert('Redirecting to Corporate Dashboard...')}
        >
          Corporate Login
        </button>
      </div>

      {/* Stats Row */}
      <div className="hero-stats-row">
        <div className="hero-stat">
          <span id="counter-credits" className="hero-stat-value">0</span>
          <span className="hero-stat-label">Credits Minted</span>
        </div>
        <div className="hero-stat">
          <span id="counter-tonnes" className="hero-stat-value">0</span>
          <span className="hero-stat-label">Tonnes Offset</span>
        </div>
        <div className="hero-stat">
          <span id="counter-users" className="hero-stat-value">0</span>
          <span className="hero-stat-label">Active Users</span>
        </div>
      </div>
    </div>
  );
}
