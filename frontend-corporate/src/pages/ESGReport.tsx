import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

// Static demo data for ESG report
const MONTHLY_DATA = [
  { month: 'Oct', tonnes: 12 }, { month: 'Nov', tonnes: 18 }, { month: 'Dec', tonnes: 25 },
  { month: 'Jan', tonnes: 22 }, { month: 'Feb', tonnes: 30 }, { month: 'Mar', tonnes: 50 },
]

const ACTION_PIE = [
  { name: 'Cycling', value: 35 }, { name: 'Public Transport', value: 25 },
  { name: 'Solar Energy', value: 20 }, { name: 'Plant-Based Meals', value: 12 },
  { name: 'Composting', value: 8 },
]

const SDGS = [
  { num: 7, label: 'Clean Energy', icon: '⚡', color: '#fbbf24' },
  { num: 11, label: 'Sustainable Cities', icon: '🏙️', color: '#60a5fa' },
  { num: 12, label: 'Responsible Consumption', icon: '♻️', color: '#34d399' },
  { num: 13, label: 'Climate Action', icon: '🌍', color: '#f87171' },
  { num: 15, label: 'Life on Land', icon: '🌿', color: '#4ade80' },
]

const COLORS = ['#1a472a','#2d6a4f','#40916c','#52b788','#74c69d']

export default function ESGReport() {
  const user = JSON.parse(localStorage.getItem('gc_corp_user') || '{"company_name":"Your Company"}')
  const [exporting, setExporting] = useState(false)

  const handleExport = async (type: string) => {
    setExporting(true)
    setTimeout(() => {
      if (type === 'pdf') window.print()
      setExporting(false)
    }, 1000)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', fontSize: '1.5rem' }}>📊 ESG Impact Report</h2>
          <p style={{ color: '#6c757d', marginTop: '4px' }}>{user.company_name} · FY 2023-24</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-corp" onClick={() => handleExport('pdf')} disabled={exporting} style={{ fontSize: '0.85rem', padding: '10px 18px' }}>
            {exporting ? '⏳ Exporting...' : '📄 Export PDF'}
          </button>
          <button onClick={() => handleExport('csv')} style={{ padding: '9px 18px', border: '2px solid #b7e4c7', borderRadius: '10px', background: 'white', color: '#1a472a', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'All-Time Offset',      value: '157.5 t',  sub: 'Tonnes CO₂e',    icon: '🌍', color: '#1a472a' },
          { label: 'This Year',            value: '82.0 t',   sub: 'FY 2023-24',     icon: '📅', color: '#2d6a4f' },
          { label: 'This Quarter',         value: '50.0 t',   sub: 'Q4 2023-24',     icon: '📈', color: '#40916c' },
          { label: 'Green Score',          value: '88/100',   sub: 'Portfolio quality',icon: '⭐', color: '#52b788' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ background: k.color, borderRadius: '14px', padding: '20px', color: 'white' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{k.icon}</div>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.7rem', fontWeight: 700 }}>{k.value}</div>
            <div style={{ opacity: 0.7, fontSize: '0.8rem', marginTop: '2px' }}>{k.label}</div>
            <div style={{ opacity: 0.55, fontSize: '0.72rem' }}>{k.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* ── Monthly Trend ── */}
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>📈 Monthly Offset Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_DATA} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9"/>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6c757d' }}/>
              <YAxis tick={{ fontSize: 12, fill: '#6c757d' }}/>
              <Tooltip formatter={(v: any) => [`${v} tonnes`, 'CO₂e Offset']} contentStyle={{ borderRadius: '10px', border: '1px solid #b7e4c7' }}/>
              <Bar dataKey="tonnes" fill="#2d6a4f" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Action Portfolio ── */}
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>🥧 Action Portfolio</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ACTION_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {ACTION_PIE.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`, '']} contentStyle={{ borderRadius: '8px' }}/>
              <Legend wrapperStyle={{ fontSize: '0.75rem' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SDG Impact ── */}
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>🎯 SDG Impact Mapping</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
          {SDGS.map(sdg => (
            <div key={sdg.num} style={{ background: '#f0faf4', borderRadius: '12px', padding: '16px',
              border: `2px solid ${sdg.color}22` }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{sdg.icon}</div>
              <div style={{ fontWeight: 700, color: '#1a472a', fontSize: '0.9rem' }}>SDG {sdg.num}</div>
              <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>{sdg.label}</div>
              <div style={{ marginTop: '8px', height: '4px', background: '#e8f5e9', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: sdg.color, width: `${60 + sdg.num * 3}%`, borderRadius: '2px' }}/>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '16px' }}>
          ℹ️ Impact levels based on proportion of credits from each action type's primary SDG alignment. Full methodology available in GreenCoin verification documentation.
        </p>
      </div>
    </div>
  )
}
