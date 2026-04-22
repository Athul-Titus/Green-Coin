import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { advisorApi, type AdvisorPlan, type ForecastResponse } from '../api/greencoin'

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy:   { bg: '#d1fae5', text: '#065f46' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  hard:   { bg: '#fee2e2', text: '#991b1b' },
}

const ACTION_ICONS: Record<string, string> = {
  cycling_commute: '🚴', public_transport: '🚌', plant_based_meal: '🥗',
  solar_energy: '☀️', composting: '♻️', ev_charging: '⚡', led_switch: '💡', no_flight: '✈️',
}

export default function Advisor() {
  const [plan, setPlan] = useState<AdvisorPlan | null>(null)
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [peers, setPeers] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      advisorApi.getPlan(),
      advisorApi.getForecast(),
      advisorApi.getPeers(),
    ]).then(([p, f, pe]) => {
      setPlan(p.data)
      setForecast(f.data)
      setPeers(pe.data)
    }).finally(() => setLoading(false))
  }, [])

  const forecastChartData = forecast ? [
    { month: 'This Month', credits: forecast.month_1, inr: forecast.inr_month_1 },
    { month: 'Next Month', credits: forecast.month_2, inr: forecast.inr_month_2 },
    { month: 'Month After', credits: forecast.month_3, inr: forecast.inr_month_3 },
  ] : []

  const greenScore = peers?.your_monthly_credits
    ? Math.min(100, Math.round((peers.your_monthly_credits / (peers.top_earner_monthly_credits || 1)) * 100))
    : 42

  return (
    <div>
      <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '8px', fontSize: '1.5rem' }}>
        🤖 GreenAdvisor
      </h2>
      <p style={{ color: '#6c757d', marginBottom: '24px' }}>
        AI-powered recommendations personalized for your lifestyle.
      </p>

      {/* ── Green Score ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg,#1a472a,#2d6a4f)', borderRadius: '20px', padding: '28px',
          color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#52b788" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 42 * greenScore / 100} ${2 * Math.PI * 42 * (1 - greenScore/100)}`}
              strokeLinecap="round" transform="rotate(-90 50 50)"/>
            <text x="50" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{greenScore}</text>
          </svg>
        </div>
        <div>
          <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '4px' }}>Your Green Score</p>
          <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>
            {greenScore >= 80 ? '🏆 Excellent' : greenScore >= 60 ? '⭐ Good' : greenScore >= 40 ? '🌱 Growing' : '🌿 Just Starting'}
          </div>
          <p style={{ opacity: 0.7, marginTop: '6px', fontSize: '0.9rem' }}>
            Cluster: {plan?.cluster?.replace(/_/g, ' ') || '—'}
          </p>
        </div>
      </motion.div>

      {/* ── Peer Comparison ── */}
      {peers && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '2rem' }}>👥</span>
          <div>
            <p style={{ color: '#1a472a', fontWeight: 600 }}>{peers.message}</p>
            <p style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '4px' }}>
              You're at the <strong>{peers.your_percentile}th percentile</strong> in your cluster.
              Your earnings: <strong>₹{peers.your_monthly_inr?.toLocaleString() || 0}/mo</strong>
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Recommendations ── */}
      <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>
          🎯 Your Top 5 Actions
        </h3>
        {loading ? (
          [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px' }} />)
        ) : (
          plan?.recommendations.map((r, i) => (
            <motion.div key={r.action_type} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ display: 'flex', gap: '16px', padding: '16px', background: '#f8faf8',
                borderRadius: '12px', marginBottom: '12px', alignItems: 'flex-start',
                border: i === 0 ? '2px solid #52b788' : '1px solid #e8f5e9' }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{ACTION_ICONS[r.action_type] || '🌿'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#1a472a' }}>
                      {r.action_type.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    {i === 0 && <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#d8f3dc', color: '#2d6a4f', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Top Pick</span>}
                  </div>
                  <span style={{ ...DIFFICULTY_COLORS[r.difficulty_level], padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                    background: DIFFICULTY_COLORS[r.difficulty_level]?.bg, color: DIFFICULTY_COLORS[r.difficulty_level]?.text }}>
                    {r.difficulty_level}
                  </span>
                </div>
                <p style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '4px' }}>{r.getting_started_tip}</p>
                <p style={{ color: '#2d6a4f', fontWeight: 700, fontSize: '0.9rem', marginTop: '6px' }}>
                  +{r.projected_monthly_credits.toFixed(0)} credits / mo · ≈ ₹{r.projected_monthly_inr?.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── 3-Month Forecast ── */}
      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>📈 3-Month Earnings Forecast</h3>
          {forecast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                {forecast.trend === 'up' ? '📈 Trending up' : forecast.trend === 'down' ? '📉 Trending down' : '➡️ Stable'}
              </span>
              <span style={{ fontSize: '0.75rem', background: '#d8f3dc', color: '#2d6a4f', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                {Math.round((forecast.confidence || 0) * 100)}% confidence
              </span>
            </div>
          )}
        </div>
        {loading ? <div className="skeleton" style={{ height: '180px' }} /> : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={forecastChartData}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52b788" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#52b788" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9"/>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6c757d' }}/>
              <YAxis tick={{ fontSize: 12, fill: '#6c757d' }}/>
              <Tooltip formatter={(v: any, name: any) => [
                name === 'credits' ? `${v} credits` : `₹${Number(v)?.toLocaleString()}`, name
              ]} contentStyle={{ borderRadius: '10px', border: '1px solid #b7e4c7' }}/>
              <Area type="monotone" dataKey="credits" name="credits" stroke="#2d6a4f" strokeWidth={2.5}
                fill="url(#forecastGrad)" dot={{ fill: '#2d6a4f', r: 5 }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
        {forecast && (
          <p style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '12px', textAlign: 'center' }}>
            Method: {forecast.method === 'lstm' ? 'LSTM Neural Network' : 'Cluster Average Baseline'}
          </p>
        )}
      </div>
    </div>
  )
}
