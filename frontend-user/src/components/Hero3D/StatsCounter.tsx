import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

const stats: Stat[] = [
  { value: 48290, label: "CREDITS MINTED", suffix: "+" },
  { value: 1240, label: "TONNES OFFSET" },
  { value: 8730, label: "ACTIVE USERS", suffix: "+" },
];

const StatItem = ({ stat }: { stat: Stat }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animation = animate(count, stat.value, {
      duration: 2,
      ease: [0.25, 1, 0.5, 1] // cubic-bezier easeOut
    });
    
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    
    return () => {
        animation.stop();
        unsubscribe();
    };
  }, [count, stat.value, rounded]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '28px', fontWeight: 500, color: '#6ee7b7' }}>
        {stat.prefix}{displayValue.toLocaleString()}{stat.suffix}
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(110,231,183,0.5)', letterSpacing: '2px', marginTop: '4px' }}>
        {stat.label}
      </div>
    </div>
  );
};

export const StatsCounter = () => {
  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '32px',
            marginTop: '40px' 
        }}
        className="stats-row"
    >
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          <StatItem stat={stat} />
          {i < stats.length - 1 && (
            <div style={{ width: '1px', height: '40px', background: 'rgba(74,222,128,0.2)' }} />
          )}
        </React.Fragment>
      ))}
    </motion.div>
  );
};
