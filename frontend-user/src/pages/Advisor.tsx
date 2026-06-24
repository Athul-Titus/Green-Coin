import React from 'react';
import { Link } from 'react-router-dom';

const Advisor: React.FC = () => {
  return (
    <div className="gc-app">
      <div className="gc-grid-bg" />

      {/* ── Nav ── */}
      <header className="gc-nav">
        <div className="gc-nav-inner">
          <div className="gc-brand">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
            GreenCoin
          </div>
          <nav className="gc-nav-links">
            <Link className="gc-nav-link" to="/dashboard">Dashboard</Link>
            <Link className="gc-nav-link" to="/log-action">Log Action</Link>
            <Link className="gc-nav-link" to="/wallet">Wallet</Link>
            <a className="gc-nav-link gc-nav-link--active" href="#">Advisor</a>
            <a className="gc-nav-link" href="#">Corporate</a>
          </nav>
          <div className="gc-nav-trail">
            <span style={{ color: 'var(--gc-secondary)', fontFamily: 'Space Grotesk', fontSize: 12 }}>Trust Score: 98</span>
            <div className="gc-avatar">
              <img
                alt="User"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHNe-bPXjnXb_zTCaQI5Czz4Inujyh8tBviG8ifyXEBSZ2N0zsfpwB5bLAyJx3yzvS4MjeYjH_D7sOhAwWkrjqvWa0LhKCF_ReG0NFB5umWKoXvU9wjrczNsFkRZtanQDLjGbnmjLA3Bn-2O7Cvb8S54fOAgimG1r9YGEKuX6sbtsi6QeyRp10I0Acb7v_miyRn3pfMTf8xWoHnACjpJzsQhMUphgTqfnvFF7h1NYzsJztAgMGBXRvfKIFizGRsa5CoINMmG_7KSEq"
              />
              <div className="gc-avatar-dot" />
            </div>
          </div>
        </div>
      </header>

      <main className="gc-main" style={{ gap: 64 }}>
        {/* ── Hero ── */}
        <section className="gc-advisor-hero">
          <div className="gc-advisor-hero-left">
            <div>
              <h1 className="gc-h1">Your GreenAdvisor</h1>
              <p className="gc-body-lg gc-text-variant" style={{ marginTop: 16, maxWidth: 480 }}>
                AI-driven insights to maximize your environmental impact and GreenCoin earnings. Here's your personalized roadmap for the month.
              </p>
            </div>
            <div className="gc-green-glass" style={{ borderRadius: 12, padding: 32, maxWidth: 400 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="material-symbols-outlined gc-text-primary">trending_up</span>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, color: 'var(--gc-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Projected Earnings</span>
              </div>
              <div className="gc-h1" style={{ fontSize: 48, lineHeight: 1.1 }}>
                ₹1,400 <span style={{ color: 'var(--gc-outline)', fontSize: 24, margin: '0 8px' }}>–</span> ₹2,200
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gc-on-surface-variant)', fontFamily: 'Space Grotesk', fontSize: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gc-primary)', animation: 'gc-pulse 2s infinite', flexShrink: 0 }} />
                Based on your typical activity patterns
              </div>
            </div>
          </div>
          <div className="gc-advisor-hero-right">
            <div className="gc-advisor-glow" />
            <img
              alt="Neural AI Brain visualization"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqn6K3UbRXn2ELVTkIWwlMMz6-1_638oKqBdYZ_zMJ-jdl8NYWVHl-z_Mqep9xzL2fbW88nRbPR6g7GYLKuCMa9Pw6KGwy_lQd_f7bGURJ4cS3nLM81uGVSGwjabCNA7JNUK8WDlNlCwJHKOMuHlyoPq-uYxLZ2UxstvycjzCk3Ith5QAck_yiBiMPV8_NfpPYBJAt2gpM5hWnEH4nyhwiqWQdB3GlLU0ADrlXwCwuxePddkDi5Id3KDMysCBxzokb9y4hxwYg-l6t"
              style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
            />
          </div>
        </section>

        {/* ── Insights Grid ── */}
        <section className="gc-grid-3">
          {[
            { icon: 'calendar_today', label: 'BEST DAY TO LOG', value: 'Weekends', sub: '+15% higher rewards', subColor: 'var(--gc-primary)' },
            { icon: 'directions_bike', label: 'BEST ACTION FOR YOU', value: 'Cycling', sub: 'Earns you 40% of total GC', subColor: 'var(--gc-on-surface-variant)' },
            { icon: 'local_fire_department', label: 'CURRENT STREAK', value: '14 Days', sub: 'Multiplier: 1.2x Active', subColor: 'var(--gc-secondary)', highlight: true },
          ].map((insight) => (
            <div key={insight.label} className={`gc-card gc-card--insight${insight.highlight ? ' gc-card--glow' : ''}`}>
              <div className="gc-insight-icon" style={{ background: insight.highlight ? 'rgba(98,223,125,0.2)' : 'var(--gc-surface-container-high)', color: insight.highlight ? 'var(--gc-primary)' : 'var(--gc-secondary)', border: insight.highlight ? '1px solid rgba(98,223,125,0.3)' : '1px solid rgba(62,74,61,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: insight.highlight ? "'FILL' 1" : "'FILL' 0" }}>{insight.icon}</span>
              </div>
              <div>
                <div className="gc-label-muted" style={{ marginBottom: 4 }}>{insight.label}</div>
                <div className="gc-h3">{insight.value}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: insight.subColor, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {insight.sub.startsWith('+') && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_upward</span>}
                  {insight.sub}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── Main Dashboard Area ── */}
        <div className="gc-grid-12">
          {/* Action Plan */}
          <section className="gc-col-7" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="gc-h2">Action Plan</h2>
              <p className="gc-text-variant" style={{ marginTop: 4 }}>Prioritized by highest impact/effort ratio.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: 'train', label: 'Take Public Transit', sub: 'Replace 3 car commutes this week', pts: '+120', unit: 'GC / MO', priority: '#1 Priority', primaryAction: true, borderLeft: true },
                { icon: 'energy_savings_leaf', label: 'Smart Thermostat Setup', sub: 'Connect your home energy data', pts: '+85', unit: 'GC / MO', priority: '#2 Priority', secondaryAction: true },
                { icon: 'eco', label: 'Meatless Monday', sub: 'Log a plant-based meal today', pts: '+45', unit: 'GC / MO', secondaryAction: true },
                { icon: 'recycling', label: 'E-Waste Recycling', sub: 'Drop off at verified partner', pts: '+150', unit: 'GC ONE TIME', ghostAction: true, opacity: 0.75 },
                { icon: 'shopping_bag', label: 'Reusable Bags', sub: 'Consistent use over 30 days', pts: '+30', unit: 'GC / MO', ghostAction: true, opacity: 0.75 },
              ].map((item) => (
                <div key={item.label} className="gc-advisor-action" style={{ opacity: item.opacity ?? 1 }}>
                  {item.borderLeft && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--gc-primary)', borderRadius: '12px 0 0 12px' }} />}
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0, background: 'var(--gc-surface-container-highest)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(62,74,61,0.3)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--gc-secondary)' }}>{item.icon}</span>
                      {item.priority && <div style={{ position: 'absolute', top: -8, right: -8, background: item.primaryAction ? 'var(--gc-primary)' : 'var(--gc-surface-variant)', color: item.primaryAction ? 'var(--gc-on-primary)' : 'var(--gc-on-surface)', fontFamily: 'Space Grotesk', fontSize: 10, padding: '2px 6px', borderRadius: 999, border: item.primaryAction ? 'none' : '1px solid rgba(62,74,61,0.3)' }}>{item.priority}</div>}
                    </div>
                    <div>
                      <h3 className="gc-h3">{item.label}</h3>
                      <p style={{ color: 'var(--gc-on-surface-variant)', fontFamily: 'Space Grotesk', fontSize: 14, marginTop: 4 }}>{item.sub}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, borderLeft: '1px solid rgba(62,74,61,0.2)', paddingLeft: 24, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="gc-h3 gc-text-primary">{item.pts}</div>
                      <div className="gc-label-muted">{item.unit}</div>
                    </div>
                    {item.primaryAction && <button className="gc-btn-primary" style={{ whiteSpace: 'nowrap' }}>Log Action</button>}
                    {item.secondaryAction && <button className="gc-btn-outline" style={{ whiteSpace: 'nowrap' }}>{item.label.includes('Setup') ? 'Connect' : 'Log Action'}</button>}
                    {item.ghostAction && <button style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(135,148,133,0.3)', color: 'var(--gc-on-surface)', background: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 12, whiteSpace: 'nowrap' }}>{item.label.includes('Recycling') ? 'Find Location' : 'Log Action'}</button>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Peer + Forecast */}
          <section className="gc-col-5" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Peer Comparison */}
            <div className="gc-card" style={{ flex: 1 }}>
              <h3 className="gc-h3" style={{ marginBottom: 24 }}>How You Compare</h3>
              <div style={{ position: 'relative', height: 192, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 16, paddingBottom: 32, borderBottom: '1px solid rgba(62,74,61,0.3)' }}>
                {[
                  { label: 'Avg User', value: 320, height: 40, color: '#313632', border: '1px solid rgba(62,74,61,0.3)' },
                  { label: 'You', value: 580, height: 72.5, color: '#62df7d', isYou: true },
                  { label: 'Top 10%', value: 710, height: 88.75, color: '#313632', border: '1px solid rgba(62,74,61,0.3)' },
                ].map((bar) => (
                  <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 64, zIndex: 10 }}>
                    {bar.isYou && <div style={{ position: 'absolute', top: 0, background: 'rgba(98,223,125,0.2)', color: 'var(--gc-primary)', fontFamily: 'Space Grotesk', fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(98,223,125,0.3)' }}>Top 15%</div>}
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: bar.isYou ? 'var(--gc-primary)' : 'var(--gc-on-surface-variant)', fontWeight: bar.isYou ? 700 : 400 }}>{bar.value}</div>
                    <div style={{ width: 48, background: bar.color, border: bar.border, borderRadius: '4px 4px 0 0', height: `${bar.height}%`, boxShadow: bar.isYou ? '0 0 20px rgba(98,223,125,0.3)' : 'none' }} />
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, color: bar.isYou ? 'var(--gc-on-surface)' : 'var(--gc-on-surface-variant)', textAlign: 'center' }}>{bar.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: 'var(--gc-on-surface-variant)', marginTop: 16, textAlign: 'center' }}>
                You are earning <span className="gc-text-primary" style={{ fontWeight: 700 }}>81% more</span> than average users in your region.
              </p>
            </div>

            {/* Earnings Forecast */}
            <div className="gc-card">
              <div className="gc-card-header" style={{ marginBottom: 24 }}>
                <h3 className="gc-h3">Earnings Forecast</h3>
                <select style={{ background: 'var(--gc-surface-container-highest)', border: '1px solid rgba(62,74,61,0.3)', color: 'var(--gc-on-surface)', fontFamily: 'Space Grotesk', fontSize: 12, borderRadius: 8, padding: '4px 8px' }}>
                  <option>Next 3 Months</option>
                  <option>Next 6 Months</option>
                  <option>Next Year</option>
                </select>
              </div>
              <div style={{ position: 'relative', height: 192, width: '100%' }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#62df7d" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#62df7d" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,100 L0,70 Q25,60 50,50 T100,30 L100,100 Z" fill="url(#forecastGrad)" />
                  <path d="M0,70 Q25,60 50,50 T100,30" fill="none" stroke="#4de082" strokeDasharray="4 4" strokeWidth="1.5" opacity="0.5" />
                  <path d="M0,70 Q25,40 50,20 T100,5" fill="none" stroke="#62df7d" strokeWidth="2" />
                  <circle cx="0" cy="70" fill="#62df7d" r="2" />
                  <circle cx="50" cy="20" fill="#62df7d" r="2" />
                  <circle cx="100" cy="5" fill="#62df7d" r="2" />
                </svg>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <span style={{ background: 'var(--gc-surface-container-highest)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'Space Grotesk', color: 'var(--gc-primary)', border: '1px solid rgba(98,223,125,0.3)' }}>Optimal Plan (+45%)</span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Grotesk', fontSize: 10, color: 'var(--gc-on-surface-variant)' }}>
                  <span>Current</span><span>Month +1</span><span>Month +3</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="gc-footer">
        <div className="gc-footer-inner">
          <div className="gc-brand">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
            GreenCoin
          </div>
          <div className="gc-footer-links">
            <a href="#">Privacy Policy</a><a href="#">Terms of Service</a>
            <a href="#">ESG Methodology</a><a href="#">Support</a>
          </div>
          <div style={{ color: 'var(--gc-tertiary)', fontSize: 12, fontFamily: 'Space Grotesk' }}>© 2024 GreenCoin AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Advisor;
