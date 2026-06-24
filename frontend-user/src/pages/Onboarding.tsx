import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type NeighborhoodType = 'urban' | 'suburban' | 'rural' | 'peri' | null;

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState<NeighborhoodType>(null);

  const neighborhoods = [
    { id: 'urban', icon: 'apartment', label: 'Urban' },
    { id: 'suburban', icon: 'home', label: 'Suburban' },
    { id: 'rural', icon: 'agriculture', label: 'Rural' },
    { id: 'peri', icon: 'nature_people', label: 'Peri-urban' },
  ] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="gc-onboarding">
      {/* ── Left Panel ── */}
      <section className="gc-onboarding-left">
        <div className="gc-onboarding-left-grid" />
        <div className="gc-onboarding-glow" />

        {/* Logo */}
        <div className="gc-brand" style={{ position: 'relative', zIndex: 10 }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          GreenCoin
        </div>

        {/* Animation centerpiece */}
        <div className="gc-onboarding-visual">
          {/* Animated rings */}
          <div className="gc-ring gc-ring-1" />
          <div className="gc-ring gc-ring-2" />
          <div className="gc-ring gc-ring-3" />
          {/* Leaf icon center */}
          <div className="gc-ring-center">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--gc-primary)', fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
        </div>

        {/* Footer progress + quote */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Step indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 200 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gc-primary)', boxShadow: '0 0 8px rgba(98,223,125,0.6)', flexShrink: 0 }} />
              {[1, 2, 3, 4].map((i) => (
                <React.Fragment key={i}>
                  <div style={{ flex: 1, height: 1, background: i === 0 ? 'rgba(98,223,125,0.3)' : 'rgba(62,74,61,0.5)' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gc-surface-variant)', flexShrink: 0 }} />
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 200, fontFamily: 'Space Grotesk', fontSize: 12 }}>
              <span className="gc-text-primary">Step 1</span>
              <span className="gc-text-muted">Step 5</span>
            </div>
          </div>
          {/* Quote */}
          <blockquote className="gc-h3" style={{ maxWidth: 320, lineHeight: 1.4 }}>
            "Your journey to net zero begins with a single step."
          </blockquote>
        </div>
      </section>

      {/* ── Right Panel ── */}
      <section className="gc-onboarding-right">
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
          <h1 className="gc-h2" style={{ color: 'var(--gc-inverse-on-surface)', marginBottom: 32 }}>
            Where are you based?
          </h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* City Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="city" className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>CITY</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gc-outline)' }}>location_city</span>
                <input
                  id="city"
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="gc-input"
                  style={{ paddingLeft: 48 }}
                />
              </div>
            </div>

            {/* Neighborhood Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>NEIGHBORHOOD TYPE</label>
              <div className="gc-neighborhood-grid">
                {neighborhoods.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`gc-neighborhood-card${neighborhood === n.id ? ' gc-neighborhood-card--active' : ''}`}
                    onClick={() => setNeighborhood(n.id as NeighborhoodType)}
                  >
                    <div className={`gc-neighborhood-icon${neighborhood === n.id ? ' gc-neighborhood-icon--active' : ''}`}>
                      <span className="material-symbols-outlined">{n.icon}</span>
                    </div>
                    <span className={neighborhood === n.id ? 'gc-text-primary' : ''} style={{ fontFamily: 'Space Grotesk', fontSize: 16, color: neighborhood === n.id ? 'var(--gc-primary)' : 'var(--gc-on-surface)' }}>
                      {n.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="gc-btn-primary" style={{ justifyContent: 'center', padding: '16px 24px' }}>
              Continue
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Onboarding;
