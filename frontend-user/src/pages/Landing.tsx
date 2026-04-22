import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Leaf, Bike, Zap, ShoppingBag } from 'lucide-react';
import Hero3D from '../components/Hero3D/Hero3D';
import HeroContent from '../components/Hero3D/HeroContent';
import '../styles/landing.css';

export default function Landing() {
  const scrollVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="landing-page">
      {/* 3D Hero Section */}
      <div style={{ position: 'relative' }}>
        <Hero3D />
        <HeroContent />
      </div>

      {/* How it Works Section */}
      <section className="landing-section">
        <motion.h2 
            className="section-title"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={scrollVariant}
        >
          How it Works
        </motion.h2>
        
        <motion.div 
            className="how-it-works-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
        >
          <motion.div className="how-card" variants={scrollVariant}>
            <div className="how-icon">🌱</div>
            <h3 className="how-title">Log Green Actions</h3>
            <p className="how-desc">Take eco-friendly actions like cycling to work, eating plant-based, or using solar power. Submit proof through our simple app interface.</p>
          </motion.div>

          <motion.div className="how-card" variants={scrollVariant}>
            <div className="how-icon">🤖</div>
            <h3 className="how-title">AI Verifies & Mints</h3>
            <p className="how-desc">Our machine learning pipeline instantly verifies your action using GPS, image recognition, and heuristics to mint authentic Carbon Credits.</p>
          </motion.div>

          <motion.div className="how-card" variants={scrollVariant}>
            <div className="how-icon">🏢</div>
            <h3 className="how-title">Sell to Corporations</h3>
            <p className="how-desc">Your credits are aggregated and sold seamlessly to enterprise companies needing to offset their emissions and reach ESG compliance.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Green Actions Grid */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <motion.h2 
            className="section-title"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={scrollVariant}
        >
          Every Action Counts
        </motion.h2>
        
        <motion.div 
            className="actions-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
        >
          {[
            { icon: <Bike color="#4ade80" />, name: 'Cycling Commute', rate: '4 credits / km', est: '~160/mo' },
            { icon: <Leaf color="#4ade80" />, name: 'Plant-based Meal', rate: '5 credits / meal', est: '~150/mo' },
            { icon: <Zap color="#4ade80" />, name: 'Solar Energy', rate: '10 credits / kWh', est: '~300/mo' },
            { icon: <ShoppingBag color="#4ade80" />, name: 'Reusable Bag', rate: '1 credit / trip', est: '~15/mo' },
          ].map((action, i) => (
            <motion.div key={i} className="action-card" variants={scrollVariant}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(74,222,128,0.1)', padding: '10px', borderRadius: '10px' }}>
                  {action.icon}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>{action.name}</div>
              </div>
              <div style={{ color: '#86efac', fontWeight: 500, marginBottom: '8px' }}>{action.rate}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Est. {action.est}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Corporate Section */}
      <section className="corporate-section">
        <div className="corporate-content">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={scrollVariant}
          >
            <div style={{ display: 'inline-block', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)', borderRadius: '20px', padding: '6px 16px', fontSize: '11px', color: '#86efac', letterSpacing: '2px', marginBottom: '24px' }}>
              FOR BUSINESSES
            </div>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '24px' }}>
              Seamless ESG Compliance
            </h2>
            <p style={{ color: 'rgba(168,245,200,0.7)', fontSize: '18px', lineHeight: 1.6, marginBottom: '32px' }}>
              Source high-quality, AI-verified retail carbon credits instantly. Monitor your ESG impact through our enterprise dashboard and generate automated sustainability reports.
            </p>
            
            <div className="corp-feature">
              <CheckCircle2 className="corp-feature-icon" size={20} />
              <div>
                <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '4px', fontSize: '16px' }}>Verified Offsets</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.5 }}>Every credit is cryptographically linked to a verified physical user action.</p>
              </div>
            </div>
            
            <div className="corp-feature">
              <CheckCircle2 className="corp-feature-icon" size={20} />
              <div>
                <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '4px', fontSize: '16px' }}>Audit Trail</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.5 }}>Downloadable ESG certificates ready for regulatory compliance reporting.</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="corp-mockup"
            initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            {/* Minimal abstract dashboard mockup */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ height: '40px', background: 'rgba(74,222,128,0.1)', borderRadius: '8px', marginBottom: '16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ height: '80px', background: 'rgba(74,222,128,0.05)', borderRadius: '8px' }} />
              <div style={{ height: '80px', background: 'rgba(74,222,128,0.05)', borderRadius: '8px' }} />
            </div>
            <div style={{ height: '120px', background: 'rgba(74,222,128,0.05)', borderRadius: '8px' }} />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌱</div>
        <div style={{ color: 'white', fontWeight: 600, fontSize: '18px', marginBottom: '16px', fontFamily: 'Poppins, sans-serif' }}>GreenCoin</div>
        <div style={{ color: 'rgba(110,231,183,0.4)', fontSize: '14px' }}>
          Democratizing carbon markets for a sustainable future.
        </div>
      </footer>
    </div>
  )
}
