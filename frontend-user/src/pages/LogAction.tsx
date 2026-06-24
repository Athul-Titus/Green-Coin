import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LogAction: React.FC = () => {
  const [stage, setStage] = useState<'select' | 'recording' | 'verifying' | 'done'>('select');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const actions = [
    { id: 'cycling', icon: 'directions_bike', label: 'Cycling', reward: '+2.5 GC / km' },
    { id: 'plant-meal', icon: 'local_dining', label: 'Plant Meal', reward: '+15 GC / meal' },
    { id: 'solar', icon: 'solar_power', label: 'Solar Energy', reward: '+0.5 GC / kWh' },
    { id: 'transit', icon: 'directions_transit', label: 'Public Transit', reward: '+1.8 GC / km' },
    { id: 'compost', icon: 'compost', label: 'Composting', reward: '+5 GC / kg' },
    { id: 'ev', icon: 'ev_station', label: 'EV Charging', reward: '+12 GC / session' },
  ];

  const handleSelectAction = (id: string) => {
    setSelectedAction(id);
    setStage('recording');
    setTimeout(() => window.scrollBy({ top: 400, behavior: 'smooth' }), 100);
  };

  const handleFinish = () => {
    setStage('verifying');
    setTimeout(() => setStage('done'), 3000);
  };

  const handleReset = () => {
    setStage('select');
    setSelectedAction(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="gc-app">
      <div className="gc-grid-bg" />
      <div className="gc-glow-orb" style={{ top: '-10%', left: '-10%' }} />
      <div className="gc-glow-orb" style={{ bottom: '20%', right: '-10%' }} />

      {/* ── Nav ── */}
      <header className="gc-nav">
        <div className="gc-nav-inner">
          <div className="gc-brand">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            GreenCoin
          </div>
          <nav className="gc-nav-links">
            <Link className="gc-nav-link" to="/dashboard">Dashboard</Link>
            <a className="gc-nav-link gc-nav-link--active" href="#">Log Action</a>
            <Link className="gc-nav-link" to="/wallet">Wallet</Link>
            <Link className="gc-nav-link" to="/advisor">Advisor</Link>
            <a className="gc-nav-link" href="#">Corporate</a>
          </nav>
          <div className="gc-nav-trail">
            <div className="gc-trust-badge">Trust Score: 98</div>
            <div className="gc-avatar">
              <img
                alt="User"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWyp9lcDjGO4g5aWJ33AV_ragd0xZE4Tsy5DAYocNpETTZS257bPiw05Cmr-8NyhHmjsR26wz8ssToa5lZbXKqkOQrKIenHIwFL5aba_ZbV367RHZLuN-xVHeaZxyGtETiJ5beRo5dOjN-wR32yk_MtFsYR1NBJEXVAzWibMCVhZ0nMU5heQPe8ad4Zk4inYBQK6P8igvrEzNjO70If1LihOBmUhwiLXvKq2IUsLhfSnJRZLx9fQEkno2SrtqJyCLKFYa1ZEo5Ck9X"
              />
              <div className="gc-avatar-dot" />
            </div>
          </div>
        </div>
      </header>

      <main className="gc-main">
        {/* ── Header ── */}
        <header style={{ textAlign: 'center', marginBottom: 64, maxWidth: 700, margin: '0 auto 64px' }}>
          <h1 className="gc-h1">Log a Green Action</h1>
          <p className="gc-body-lg gc-text-variant" style={{ marginTop: 16 }}>Every action verified. Every credit real.</p>
        </header>

        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
          {/* ── Step 1: Select Action ── */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="gc-h3">1. Select Action Type</h2>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, color: 'var(--gc-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(98,223,125,0.1)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(98,223,125,0.3)' }}>Select One</span>
            </div>
            <div className="gc-action-grid">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className={`gc-action-card${selectedAction === action.id ? ' gc-action-card--active' : ''}`}
                  onClick={() => handleSelectAction(action.id)}
                >
                  <div className="gc-action-card-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--gc-on-surface)', fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600 }}>{action.label}</h3>
                    <p className="gc-text-primary" style={{ fontFamily: 'Space Grotesk', fontSize: 14, marginTop: 4 }}>{action.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Step 2: Recording ── */}
          {(stage === 'recording' || stage === 'verifying') && (
            <section>
              {stage === 'recording' && (
                <div className="gc-card" style={{ overflow: 'hidden', padding: 0, border: '1px solid rgba(98,223,125,0.5)', boxShadow: '0 0 30px rgba(98,223,125,0.1)' }}>
                  <div style={{ background: 'var(--gc-surface-container-highest)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(62,74,61,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="gc-status-pulse" />
                      <span style={{ color: 'var(--gc-on-surface)', fontWeight: 600 }}>Recording Route...</span>
                    </div>
                    <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: 'var(--gc-on-surface-variant)' }}>GPS Accuracy: <span className="gc-text-primary">High (3m)</span></span>
                  </div>
                  <div style={{ position: 'relative', height: 256, background: 'var(--gc-surface-container-lowest)', overflow: 'hidden' }}>
                    <img
                      alt="Route map"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ65_jZ0Dm4TqzruYL0CGECgbyJ7WbMlNIW74RdErhzu8xpKWFRG90PuUR1g86XV6ZY9gNI-1_n9ICqQ3MwtjBkM7jb3VAb4e392ML_yotQZbDgiDkggFmnkyHCypXg9D_p9MVmwoI3tSl1bkDBgcw-lbP7jJDnFGZM73IZeBB6R0r4xqtKk1Dqi9rYuLwH-L82Sv4Z5dq5dEo1ygocdqVAfh_iFbFZVQ3tYJAHKy75E2xuxefYyUyNHp36zKzki9Z3JHAOAoaUdZ0"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                    />
                    <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', gap: 16 }}>
                      {[
                        { label: 'Distance', value: '12.4 km', color: 'var(--gc-on-surface)' },
                        { label: 'Est. Credits', value: '~31.0 GC', color: 'var(--gc-primary)', highlight: true },
                        { label: 'Speed', value: '22 km/h', color: 'var(--gc-on-surface)' },
                      ].map((s) => (
                        <div key={s.label} className="gc-card" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, color: s.highlight ? 'var(--gc-primary)' : 'var(--gc-on-surface-variant)', textTransform: 'uppercase' }}>{s.label}</div>
                          <div style={{ fontFamily: 'Space Grotesk', fontSize: 20, color: s.color, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: 24, background: 'var(--gc-surface-container)' }}>
                    <button className="gc-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }} onClick={handleFinish}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop_circle</span>
                      Complete &amp; Verify Session
                    </button>
                  </div>
                </div>
              )}

              {stage === 'verifying' && (
                <div className="gc-card" style={{ border: '1px solid rgba(98,223,125,0.2)' }}>
                  <h2 className="gc-h3" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-outlined gc-text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                    Verification Pipeline
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {[
                      { icon: 'smartphone', label: 'Device Telemetry Check', sub: 'Validating accelerometer and GPS hardware signatures.', done: true },
                      { icon: 'fingerprint', label: 'Biometric Pacing', sub: 'Matching speed variance with human physical limits.', done: true },
                      { icon: 'refresh', label: 'Signal Fusion', sub: 'Cross-referencing altitude data with local topological maps.', loading: true },
                      { icon: 'hub', label: 'Graph Analysis', sub: 'Checking against known fraudulent route patterns.', pending: true },
                      { icon: 'fact_check', label: 'Zero-Knowledge Audit', sub: 'Generating final cryptographic proof for minting.', pending: true },
                    ].map((step) => (
                      <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, opacity: step.pending ? 0.5 : 1 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `1px solid ${step.done ? 'var(--gc-primary)' : 'var(--gc-outline)'}`, background: step.done ? 'rgba(98,223,125,0.2)' : 'var(--gc-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.done ? 'var(--gc-primary)' : 'var(--gc-on-surface-variant)', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ animation: step.loading ? 'spin 1s linear infinite' : 'none' }}>{step.icon}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--gc-on-surface)', fontWeight: 600 }}>{step.label}</div>
                          <div style={{ color: 'var(--gc-on-surface-variant)', fontSize: 14, marginTop: 4 }}>{step.sub}</div>
                        </div>
                        {step.done && <span className="material-symbols-outlined gc-text-primary" style={{ marginTop: 8 }}>check_circle</span>}
                        {step.loading && <span style={{ color: 'var(--gc-on-surface-variant)', fontFamily: 'Space Grotesk', fontSize: 14, marginTop: 8 }}>Processing...</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Step 3: Done ── */}
          {stage === 'done' && (
            <section className="gc-card" style={{ textAlign: 'center', padding: 64, border: '1px solid rgba(98,223,125,0.5)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(98,223,125,0.15), transparent)', pointerEvents: 'none' }} />
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(98,223,125,0.1)', border: '2px solid rgba(98,223,125,0.5)', boxShadow: '0 0 40px rgba(98,223,125,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <span className="material-symbols-outlined gc-text-primary" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <h2 className="gc-h2" style={{ marginBottom: 8 }}>31 Credits Minted! 🎉</h2>
              <p className="gc-text-primary" style={{ fontFamily: 'Space Grotesk', marginBottom: 32 }}>Tx Hash: 0x8a9f...e4d2</p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/wallet" className="gc-btn-outline">View in Wallet</Link>
                <button className="gc-btn-primary" onClick={handleReset}>Log Another Action</button>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="gc-footer">
        <div className="gc-footer-inner">
          <div className="gc-brand">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            GreenCoin
          </div>
          <div className="gc-footer-links">
            <a href="#">Privacy Policy</a><a href="#">Terms of Service</a>
            <a href="#">ESG Methodology</a><a href="#">Support</a>
          </div>
          <div style={{ color: 'var(--gc-on-surface-variant)', fontSize: 12, fontFamily: 'Space Grotesk' }}>© 2024 GreenCoin AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LogAction;
