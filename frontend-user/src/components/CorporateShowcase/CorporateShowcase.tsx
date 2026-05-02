import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, Shield, FileText, TrendingUp } from 'lucide-react';

/**
 * CorporateShowcase — Parallax corporate section with a 3D floating
 * holographic dashboard mockup and animated feature list.
 */

const features = [
  {
    icon: <Shield size={20} />,
    title: 'Verified Offsets',
    desc: 'Every credit is cryptographically linked to a verified physical user action.'
  },
  {
    icon: <FileText size={20} />,
    title: 'Audit Trail',
    desc: 'Downloadable ESG certificates ready for regulatory compliance reporting.'
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Impact Analytics',
    desc: 'Real-time dashboards tracking your environmental impact and ROI.'
  }
];

const HoloDashboard: React.FC = () => {
  const dashRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dashRef.current) return;
    const rect = dashRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    dashRef.current.style.transform = `perspective(1000px) rotateY(${x * 10 + 8}deg) rotateX(${-y * 8}deg)`;
  };

  const handleMouseLeave = () => {
    if (!dashRef.current) return;
    dashRef.current.style.transform = 'perspective(1000px) rotateY(8deg) rotateX(0deg)';
  };

  return (
    <div
      ref={dashRef}
      className="holo-dashboard"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scan line animation */}
      <div className="holo-scanline" />
      
      {/* Window chrome */}
      <div className="holo-chrome">
        <div className="holo-dot" style={{ background: '#ff5f56' }} />
        <div className="holo-dot" style={{ background: '#ffbd2e' }} />
        <div className="holo-dot" style={{ background: '#27c93f' }} />
        <div className="holo-chrome-title">ESG Dashboard</div>
      </div>

      {/* Dashboard content */}
      <div className="holo-content">
        {/* Top stat cards */}
        <div className="holo-stats-row">
          <div className="holo-stat-card">
            <div className="holo-stat-value">2,450</div>
            <div className="holo-stat-label">Credits Purchased</div>
            <div className="holo-stat-bar">
              <div className="holo-stat-bar-fill" style={{ width: '78%' }} />
            </div>
          </div>
          <div className="holo-stat-card">
            <div className="holo-stat-value">24.5t</div>
            <div className="holo-stat-label">CO₂ Offset</div>
            <div className="holo-stat-bar">
              <div className="holo-stat-bar-fill" style={{ width: '62%' }} />
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="holo-chart">
          <svg viewBox="0 0 200 60" className="holo-chart-svg">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 Q20,45 40,40 T80,30 T120,25 T160,15 T200,8"
              fill="none"
              stroke="#4ade80"
              strokeWidth="1.5"
              className="holo-chart-line"
            />
            <path
              d="M0,50 Q20,45 40,40 T80,30 T120,25 T160,15 T200,8 L200,60 L0,60 Z"
              fill="url(#chartGrad)"
              className="holo-chart-area"
            />
          </svg>
          <div className="holo-chart-label">Monthly Carbon Offset Trend</div>
        </div>

        {/* Bottom row */}
        <div className="holo-bottom-row">
          <div className="holo-tag">ESG Score: A+</div>
          <div className="holo-tag">Compliance: ✓</div>
          <div className="holo-tag">Next Audit: 30d</div>
        </div>
      </div>
    </div>
  );
};

const CorporateShowcase: React.FC = () => {
  return (
    <section className="corporate-section-3d">
      <div className="corporate-3d-content">
        <motion.div
          className="corporate-text-col"
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="section-badge">FOR BUSINESSES</div>
          <h2 className="section-title-3d" style={{ textAlign: 'left' }}>
            Seamless ESG<br />Compliance
          </h2>
          <p className="corporate-desc">
            Source high-quality, AI-verified retail carbon credits instantly.
            Monitor your ESG impact through our enterprise dashboard.
          </p>

          <div className="corporate-features">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                className="corporate-feature-3d"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              >
                <div className="corporate-feature-icon-3d">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="corporate-feature-title">{feat.title}</h4>
                  <p className="corporate-feature-desc">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="corporate-mockup-col"
          initial={{ opacity: 0, x: 80, rotateY: -15 }}
          whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.0, ease: [0.25, 1, 0.5, 1] }}
        >
          <HoloDashboard />
        </motion.div>
      </div>
    </section>
  );
};

export default CorporateShowcase;
