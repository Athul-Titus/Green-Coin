import React from 'react';
import { Link } from 'react-router-dom';

const Wallet: React.FC = () => {
  return (
    <div className="gc-app">
      <div className="gc-grid-bg" />

      {/* Radial glow overlays */}
      <div className="gc-radial-glow" style={{ top: '-5%', left: '-5%' }} />
      <div className="gc-radial-glow" style={{ bottom: '10%', right: '-5%', opacity: 0.6 }} />

      {/* ── Nav ── */}
      <header className="gc-nav">
        <div className="gc-nav-inner">
          <div className="gc-brand">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            GreenCoin
          </div>
          <nav className="gc-nav-links">
            <Link className="gc-nav-link" to="/dashboard">Dashboard</Link>
            <Link className="gc-nav-link" to="/log-action">Log Action</Link>
            <a className="gc-nav-link gc-nav-link--active" href="#">Wallet</a>
            <Link className="gc-nav-link" to="/advisor">Advisor</Link>
            <a className="gc-nav-link" href="#">Corporate</a>
          </nav>
          <div className="gc-nav-trail">
            <div className="gc-trust-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>
              Trust Score: 98
            </div>
            <div className="gc-avatar">
              <img
                alt="User profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdmHXhgmOT1D4lyHH8P3sULLJQ2UXGmX42TDwhMhRcR99nVtk2YbHP1ZQKy1PjOy13_jDGOVFckQEBw1wP83qbxUdAqm0qdWnLlytOidzDz1IceFySkPiW1doRZwd2BeY3LCjWqdhbC3lgml9zR8I62n4JWNAMZN4zXZmSi_fqmyP_gKp7XwkrmvdGLXRL0aXCkmi2vuG2IvVDqnykCFVLKcMZg6XfavB2st2CciK3VcbGpEfQePICq_IC6-aBdRnvcaI_k67Tufeu"
              />
              <div className="gc-avatar-dot" />
            </div>
          </div>
        </div>
      </header>

      <main className="gc-main">
        {/* ── Hero Wallet ── */}
        <section className="gc-wallet-hero">
          <div className="gc-wallet-hero-bg" />
          <div className="gc-wallet-hero-content">
            <div>
              <div className="gc-label-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--gc-tertiary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>account_balance_wallet</span>
                TOTAL BALANCE
              </div>
              <div className="gc-wallet-balance">
                2,847 <span className="gc-text-primary" style={{ opacity: 0.8 }}>GRC</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: 'var(--gc-outline)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>≈ ₹2,847 INR</span>
                <span style={{ color: 'var(--gc-secondary)', background: 'rgba(77,224,130,0.1)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>+12.4% this month</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              <button className="gc-btn-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
                Withdraw to Bank
              </button>
              <button className="gc-btn-outline">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
                Transaction History
              </button>
            </div>
          </div>
          <div className="gc-wallet-coin">
            <img
              alt="GreenCoin 3D Asset"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-Q3CEFrKpE4coSUPxpP4b4uV7WJCGTAKLytRnV-wW7UN5TU6L14njbQazKXbl6TdUFfi2P7mwiAdKnBqSQdCyUyUMVZESgKT2VR0q8XmpY6jNxgrCcI_sLBcpNXHCxn_hnLBoQXXZwzrNl4QFbcWI3_AGurKBoXBoCSJAKoYXsSp3nFqNuadPx4KKxmXSWjDgqJIoY7GhSKS_L1xZr3TuvVLlYmNE_OlxtfdLUHhSfq2OPr5gBIAUXHRZzqZP-A5-Ic8M2n3fat5x"
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(98,223,125,0.4))' }}
            />
            <div className="gc-coin-ring" />
          </div>
        </section>

        {/* ── Credit Summary ── */}
        <section className="gc-grid-3">
          {[
            { label: 'Available Credits', value: '1,240', unit: 'GRC', sub: 'Ready to trade or offset', color: 'var(--gc-primary)', borderColor: 'var(--gc-primary)' },
            { label: 'Held in Escrow', value: '450', unit: 'GRC', sub: 'Pending verification', color: '#FACC15', borderColor: '#FACC15' },
            { label: 'Total Lifetime Earned', value: '8,924', unit: 'GRC', sub: 'Since Jan 2023', color: '#dfe4de', borderColor: '#dfe4de' },
          ].map((card) => (
            <div key={card.label} className="gc-card" style={{ borderTop: `2px solid ${card.borderColor}50` }}>
              <div className="gc-label-muted">{card.label}</div>
              <div className="gc-h2" style={{ marginTop: 16 }}>
                {card.value} <span style={{ fontSize: 14, color: 'var(--gc-outline)' }}>{card.unit}</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: card.color, marginTop: 4 }}>{card.sub}</div>
            </div>
          ))}
        </section>

        {/* ── Transaction Table ── */}
        <section className="gc-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--gc-outline-variant-30)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(49,54,50,0.3)' }}>
            <h3 className="gc-h3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined gc-text-primary">receipt_long</span>
              Recent Transactions
            </h3>
            <button style={{ color: 'var(--gc-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="gc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: 'Oct 24, 2024', icon: 'directions_walk', title: 'Daily Commute Log', sub: 'Verified walk - 4.2km', status: 'Completed', statusType: 'primary', amount: '+ 12 GRC', amountColor: 'var(--gc-primary)' },
                  { date: 'Oct 22, 2024', icon: 'shopping_cart', title: 'Eco-Store Purchase', sub: 'Reusable Water Bottle', status: 'Completed', statusType: 'primary', amount: '- 450 GRC', amountColor: 'var(--gc-on-surface)' },
                  { date: 'Oct 18, 2024', icon: 'solar_power', title: 'Solar Panel Investment', sub: 'Community Project Alpha', status: 'Pending', statusType: 'yellow', amount: '- 1,200 GRC', amountColor: 'var(--gc-on-surface-variant)' },
                  { date: 'Oct 15, 2024', icon: 'recycling', title: 'Recycling Drop-off', sub: 'City Center Hub', status: 'Completed', statusType: 'primary', amount: '+ 25 GRC', amountColor: 'var(--gc-primary)' },
                ].map((row) => (
                  <tr key={row.date + row.title}>
                    <td style={{ fontFamily: 'Space Grotesk', fontSize: 14, color: 'var(--gc-on-surface-variant)', whiteSpace: 'nowrap' }}>{row.date}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: row.statusType === 'yellow' ? 'rgba(250,204,21,0.1)' : 'rgba(98,223,125,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.statusType === 'yellow' ? '#FACC15' : 'var(--gc-primary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>{row.icon}</span>
                        </div>
                        <div>
                          <div style={{ color: 'var(--gc-on-surface)', fontWeight: 500 }}>{row.title}</div>
                          <div style={{ color: 'var(--gc-outline)', fontSize: 12 }}>{row.sub}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={row.statusType === 'yellow' ? 'gc-badge gc-badge--yellow' : 'gc-badge gc-badge--primary'}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: row.amountColor }}>{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

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
          <div style={{ color: 'var(--gc-tertiary)', fontSize: 12, fontFamily: 'Space Grotesk' }}>© 2024 GreenCoin AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Wallet;
