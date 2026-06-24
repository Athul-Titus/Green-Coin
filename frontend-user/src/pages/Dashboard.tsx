import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="gc-app">
      {/* ── Global background ── */}
      <div className="gc-grid-bg" />

      {/* ── Top Nav ── */}
      <header className="gc-nav">
        <div className="gc-nav-inner">
          <div className="gc-brand">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            GreenCoin
          </div>
          <nav className="gc-nav-links">
            <a className="gc-nav-link gc-nav-link--active" href="#">Dashboard</a>
            <Link className="gc-nav-link" to="/log-action">Log Action</Link>
            <Link className="gc-nav-link" to="/wallet">Wallet</Link>
            <Link className="gc-nav-link" to="/advisor">Advisor</Link>
            <a className="gc-nav-link" href="#">Corporate</a>
          </nav>
          <div className="gc-nav-trail">
            <div className="gc-trust-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
              Trust Score: 98
            </div>
            <div className="gc-avatar">
              <img
                alt="User profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWT_sMgrtmfn6Ov7-B-gukA4_ZMyd7HbzdV516VPwnUOHV7UnnYFn79azOFt8BJ8qq5g_1rCUAR3azFNLHTJbAUxEZFGbvw3EimNmgBo7uCndb7i2zZyYSfITrD18gpO-tEoJN5duhHWFdFXsEwEaoh2rmsgi8xnri4c7nAGNi0oHTFlIfwp3s-ljYHH6mqvHgmuf359navkg9WzHHzE1vERVd0434Z-yWZFKrXClWIlDGcQNOl5uedDRGL4yc6S4dMC2mfb7S2DBt"
              />
              <div className="gc-avatar-dot" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="gc-main">
        {/* Header Row */}
        <div className="gc-page-header">
          <div>
            <h1 className="gc-h2">Command Center</h1>
            <p className="gc-body-variant">Real-time ecological impact &amp; tokenomics tracking.</p>
          </div>
          <Link to="/log-action" className="gc-btn-primary">
            <span className="material-symbols-outlined">add</span>
            LOG NEW ACTION
          </Link>
        </div>

        {/* ── Stat Cards ── */}
        <div className="gc-grid-4">
          {/* Total Credits */}
          <div className="gc-card gc-card--relative">
            <div className="gc-label-muted">Total Credits</div>
            <div className="gc-stat-number gc-glow-text">2,847</div>
            <div className="gc-stat-footer gc-text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>account_balance_wallet</span>
              Available Balance
            </div>
          </div>
          {/* Earned This Month */}
          <div className="gc-card">
            <div className="gc-label-muted">Earned This Month</div>
            <div className="gc-stat-number gc-text-primary">
              +340 <span style={{ fontSize: 24, color: 'var(--gc-tertiary)' }}>GCN</span>
            </div>
            <div className="gc-stat-footer" style={{ color: 'var(--gc-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_up</span>
              ↑ 23% vs last month
            </div>
          </div>
          {/* CO2 Offset */}
          <div className="gc-card gc-card--relative">
            <div className="gc-label-muted">CO2 Offset</div>
            <div className="gc-stat-number">1.2<span className="gc-label-muted" style={{ fontSize: 20 }}>t</span></div>
            <div className="gc-stat-footer gc-text-muted">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>co2</span>
              Verified metric tons
            </div>
          </div>
          {/* Trust Score */}
          <div className="gc-card">
            <div className="gc-label-muted">Trust Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="gc-stat-number">87</div>
              <div style={{ position: 'relative', width: 64, height: 64 }}>
                <svg width="64" height="64" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path className="gc-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#313632" strokeDasharray="100, 100" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#62df7d" strokeDasharray="87, 100" strokeLinecap="round" strokeWidth="3" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--gc-primary)', fontFamily: 'Space Grotesk' }}>High</div>
              </div>
            </div>
            <div className="gc-stat-footer gc-text-muted">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shield</span>
              Institutional Grade
            </div>
          </div>
        </div>

        {/* ── Middle Row ── */}
        <div className="gc-grid-12">
          {/* Credit Genesis Chart */}
          <div className="gc-card gc-col-5">
            <div className="gc-card-header">
              <h3 className="gc-h3">Credit Genesis</h3>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, fontFamily: 'Space Grotesk' }}>
                <button className="gc-tab">1W</button>
                <button className="gc-tab gc-tab--active">1M</button>
                <button className="gc-tab">YTD</button>
              </div>
            </div>
            <div className="gc-chart-area">
              <svg width="100%" height="180" viewBox="0 0 400 200" preserveAspectRatio="none" overflow="visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#62df7d" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#62df7d" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur result="coloredBlur" stdDeviation="4" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path d="M0,180 L0,140 C40,120 80,150 120,130 C160,110 200,80 240,90 C280,100 320,50 360,60 L400,40 L400,180 Z" fill="url(#chartGradient)" />
                <path d="M0,140 C40,120 80,150 120,130 C160,110 200,80 240,90 C280,100 320,50 360,60 L400,40" fill="none" filter="url(#glow)" stroke="#62df7d" strokeWidth="3" />
                <circle cx="120" cy="130" fill="#0A0F0C" r="4" stroke="#62df7d" strokeWidth="2" />
                <circle cx="240" cy="90" fill="#0A0F0C" r="4" stroke="#62df7d" strokeWidth="2" />
                <circle cx="400" cy="40" fill="#62df7d" filter="url(#glow)" r="4" />
              </svg>
              <div className="gc-chart-labels">
                <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
              </div>
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="gc-card gc-col-4 gc-card--green">
            <div className="gc-card-header">
              <span className="material-symbols-outlined gc-text-primary">auto_awesome</span>
              <h3 className="gc-h3">Suggested Actions</h3>
            </div>
            <div className="gc-action-list">
              {[
                { icon: 'pedal_bike', label: 'Cycle to work', sub: 'Zero emission commute', pts: '+40', color: 'var(--gc-primary)' },
                { icon: 'restaurant', label: 'Plant-based lunch', sub: 'Low carbon meal', pts: '+15', color: 'var(--gc-tertiary)' },
                { icon: 'compost', label: 'Compost waste', sub: 'Organic recycling', pts: '+10', color: 'var(--gc-secondary)' },
              ].map((a) => (
                <div key={a.icon} className="gc-action-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="gc-action-icon">
                      <span className="material-symbols-outlined" style={{ color: a.color, fontSize: 20 }}>{a.icon}</span>
                    </div>
                    <div>
                      <div style={{ color: 'var(--gc-on-surface)', fontSize: 16 }}>{a.label}</div>
                      <div style={{ color: 'var(--gc-outline)', fontSize: 10, fontFamily: 'Space Grotesk' }}>{a.sub}</div>
                    </div>
                  </div>
                  <div style={{ color: a.color, background: `${a.color}1a`, padding: '2px 8px', borderRadius: 4, fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700 }}>{a.pts}</div>
                </div>
              ))}
            </div>
            <button className="gc-btn-outline" style={{ marginTop: 16 }}>
              VIEW ALL PROTOCOLS
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </div>

          {/* Live Network Status */}
          <div className="gc-card gc-col-3 gc-card--center gc-card--relative">
            <div className="gc-glow-orb" />
            <div className="gc-network-badge">
              <div className="gc-pulse-dot" />
              Consensus Active
            </div>
            <div className="gc-label-muted" style={{ textAlign: 'center', marginTop: 8, letterSpacing: '0.1em' }}>LIVE NETWORK STATUS</div>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="gc-grid-12">
          {/* Ledger Activity */}
          <div className="gc-card gc-col-7">
            <div className="gc-card-header">
              <h3 className="gc-h3">Ledger Activity</h3>
              <button style={{ color: 'var(--gc-outline)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
            <div className="gc-feed">
              {[
                { icon: 'directions_car', title: 'EV Charging Session', time: 'Today, 14:32', tx: 'Tx: 0x8f...3b9a', amount: '+12.5 GCN', badge: 'Verified', badgeClass: 'gc-badge--primary' },
                { icon: 'solar_power', title: 'Solar Panel Generation', time: 'Today, 09:15', tx: 'Oracle: Node_74', amount: '+85.0 GCN', badge: 'Pending', badgeClass: 'gc-badge--muted' },
                { icon: 'receipt_long', title: 'Flight Offset Purchase', time: 'Yesterday', tx: 'Ref: AX-9921', amount: '+120.0 GCN', badge: 'Audit', badgeClass: 'gc-badge--tertiary' },
                { icon: 'recycling', title: 'Unverified Claim', time: 'Oct 12', tx: 'Validation Failed', amount: '+15.0 GCN', badge: 'Rejected', badgeClass: 'gc-badge--error', strike: true },
              ].map((item) => (
                <div key={item.title} className="gc-feed-item">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
                    <div className="gc-feed-icon">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <div style={{ color: 'var(--gc-on-surface)', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gc-outline)', fontSize: 11, fontFamily: 'Space Grotesk' }}>
                        <span>{item.time}</span><span>•</span><span>{item.tx}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ fontFamily: 'Space Grotesk', color: item.strike ? 'var(--gc-outline)' : 'var(--gc-on-surface)', textDecoration: item.strike ? 'line-through' : 'none' }}>{item.amount}</div>
                    <div className={`gc-badge ${item.badgeClass}`}>{item.badge}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="gc-card gc-col-5">
            <h3 className="gc-h3" style={{ marginBottom: 24 }}>Source Breakdown</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 192, height: 192 }}>
                <svg width="192" height="192" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" fill="none" r="40" stroke="#62df7d" strokeDasharray="113.1 251.2" strokeDashoffset="0" strokeWidth="15" />
                  <circle cx="50" cy="50" fill="none" r="40" stroke="#4de082" strokeDasharray="75.4 251.2" strokeDashoffset="-113.1" strokeWidth="15" />
                  <circle cx="50" cy="50" fill="none" r="40" stroke="#96d5a3" strokeDasharray="37.7 251.2" strokeDashoffset="-188.5" strokeWidth="15" />
                  <circle cx="50" cy="50" fill="none" r="40" stroke="#313632" strokeDasharray="25.1 251.2" strokeDashoffset="-226.2" strokeWidth="15" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--gc-outline)', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Source</span>
                  <span className="material-symbols-outlined gc-text-primary" style={{ fontSize: 24, marginTop: 4 }}>directions_car</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Transport', pct: '45%', color: '#62df7d' },
                  { label: 'Energy', pct: '30%', color: '#4de082' },
                  { label: 'Lifestyle', pct: '15%', color: '#96d5a3' },
                  { label: 'Other', pct: '10%', color: '#313632' },
                ].map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: s.color }} />
                      <span style={{ color: 'var(--gc-on-surface)', fontSize: 14 }}>{s.label}</span>
                    </div>
                    <span style={{ color: 'var(--gc-outline)', fontFamily: 'Space Grotesk', fontSize: 14 }}>{s.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="gc-footer">
        <div className="gc-footer-inner">
          <div className="gc-brand">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            GreenCoin
          </div>
          <div className="gc-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">ESG Methodology</a>
            <a href="#">Support</a>
          </div>
          <div style={{ color: 'var(--gc-outline)', fontSize: 12, fontFamily: 'Space Grotesk' }}>© 2024 GreenCoin AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
