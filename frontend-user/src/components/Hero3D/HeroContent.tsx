import React from 'react';
import { motion } from 'framer-motion';
import { StatsCounter } from './StatsCounter';
import { useNavigate } from 'react-router-dom';

export default function HeroContent() {
  const navigate = useNavigate();

  return (
    <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    }}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{
            border: '1px solid rgba(74,222,128,0.3)',
            background: 'rgba(74,222,128,0.08)',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '11px',
            color: '#86efac',
            letterSpacing: '2px',
            marginBottom: '24px'
        }}
      >
        DEMOCRATIZING CARBON MARKETS
      </motion.div>

      <motion.h1
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="hero-title"
      >
        GreenCoin
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        style={{
            fontSize: '18px',
            color: 'rgba(168,245,200,0.7)',
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: '40px'
        }}
        className="hero-subtitle"
      >
        Earn carbon credits from your green lifestyle.<br/>
        Sell them to corporations. Save the planet.
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        style={{
            display: 'flex',
            gap: '16px',
            pointerEvents: 'all'
        }}
        className="hero-buttons"
      >
        <button 
          onClick={() => navigate('/onboarding')}
          style={{
            background: '#16a34a',
            color: 'white',
            borderRadius: '8px',
            padding: '14px 28px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
              e.currentTarget.style.background = '#15803d';
              e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
              e.currentTarget.style.background = '#16a34a';
              e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Start Earning Credits
        </button>
        
        <button 
          onClick={() => alert("Redirecting to localhost:5174 Corporate Dashboard...")}
          style={{
            background: 'transparent',
            color: '#86efac',
            borderRadius: '8px',
            padding: '14px 28px',
            border: '1px solid rgba(74,222,128,0.4)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(74,222,128,0.1)';
          }}
          onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
          }}
        >
          Corporate Login →
        </button>
      </motion.div>

      <StatsCounter />
    </div>
  );
}
