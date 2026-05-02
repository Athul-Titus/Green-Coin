import React from 'react';
import { motion } from 'framer-motion';

/**
 * FooterGlow — Minimal footer with breathing glow effect
 * and animated particle convergence aesthetic.
 */

const FooterGlow: React.FC = () => {
  return (
    <footer className="footer-glow">
      <div className="footer-glow-orb" />
      
      <motion.div
        className="footer-content"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="footer-logo-wrapper">
          <div className="footer-logo-ring">
            <div className="footer-logo-ring-inner" />
          </div>
          <span className="footer-logo-emoji">🌱</span>
        </div>
        
        <h3 className="footer-brand">GreenCoin</h3>
        <p className="footer-tagline">
          Democratizing carbon markets for a sustainable future.
        </p>

        <div className="footer-links">
          <a href="#" className="footer-link">About</a>
          <span className="footer-link-dot">·</span>
          <a href="#" className="footer-link">Documentation</a>
          <span className="footer-link-dot">·</span>
          <a href="#" className="footer-link">GitHub</a>
          <span className="footer-link-dot">·</span>
          <a href="#" className="footer-link">Contact</a>
        </div>

        <div className="footer-bottom">
          <div className="footer-divider" />
          <p className="footer-copy">© 2026 GreenCoin. Built for a greener tomorrow.</p>
        </div>
      </motion.div>
    </footer>
  );
};

export default FooterGlow;
