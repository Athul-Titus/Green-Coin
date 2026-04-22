import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { creditsApi, actionsApi, advisorApi, type BalanceResponse, type GreenAction, type Recommendation } from '../api/greencoin'
import { Bike, Leaf, Zap, TrendingUp, Wallet, Lightbulb, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react'

const ACTION_ICONS: Record<string, string> = {
  cycling_commute: '🚴', public_transport: '🚌', plant_based_meal: '🥗',
  solar_energy: '☀️', composting: '♻️', ev_charging: '⚡', led_switch: '💡', no_flight: '✈️',
}

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const step = value / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <span className="credit-counter">{display.toLocaleString()}</span>
}

function SkeletonCard() {
  return <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
}

export default function Dashboard() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [history, setHistory] = useState<GreenAction[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bal, hist, plan] = await Promise.all([
          creditsApi.getBalance(),
          actionsApi.getHistory(0, 10),
          advisorApi.getPlan(),
        ])
        setBalance(bal.data)
        setHistory(hist.data)
        setRecommendations(plan.data.recommendations.slice(0, 3))

        // Build chart data from history
        const grouped: Record<string, number> = {}
        hist.data.forEach(a => {
          const day = a.timestamp.slice(0, 10)
          grouped[day] = (grouped[day] || 0) + a.credits_earned
        })
        const chart = Object.entries(grouped).slice(-14).map(([date, credits]) => ({
          date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          credits,
        }))
        setChartData(chart)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const statusIcon = (s: string) => {
    if (s === 'verified') return <CheckCircle size={14} color="#15803d"/>
    if (s === 'rejected') return <XCircle size={14} color="#dc2626"/>
    return <Clock size={14} color="#d97706"/>
  }
  const statusClass = (s: string) => s === 'verified' ? 'badge badge-verified' : s === 'rejected' ? 'badge badge-rejected' : 'badge badge-pending'

  return (
    <div style={{ padding: '0' }}>
      {/* ── Hero Balance Card ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg,#1a472a 0%,#2d6a4f 60%,#40916c 100%)',
          borderRadius: '20px', padding: '32px', color: 'white', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px',
          background: 'rgba(82,183,136,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '60%', width: '150px', height: '150px',
          background: 'rgba(183,228,199,0.08)', borderRadius: '50%' }} />
        <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '8px' }}>💚 Available Credits</p>
        <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
          {loading ? '—' : <AnimatedCounter value={Math.round(balance?.available_credits || 0)} />}
        </div>
        <p style={{ opacity: 0.7, marginTop: '4px' }}>
          ≈ ₹{loading ? '—' : (balance?.inr_value || 0).toLocaleString('en-IN')}
        </p>
        <div style={{ display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{balance?.total_credits.toFixed(0) || '—'}</div>
            <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>Total earned</div></div>
          <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{balance?.sold_credits.toFixed(0) || '0'}</div>
            <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>Credits sold</div></div>
          <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{balance?.tonnes_equivalent.toFixed(2) || '—'}</div>
            <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>Tonnes offset</div></div>
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Log Action',   icon: '➕', to: '/log',     color: '#1a472a' },
          { label: 'Wallet',       icon: '💳', to: '/wallet',  color: '#2d6a4f' },
          { label: 'Get Advice',   icon: '🤖', to: '/advisor', color: '#40916c' },
        ].map(q => (
          <Link key={q.to} to={q.to} style={{ flex: 1, textDecoration: 'none' }}>
            <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: q.color, borderRadius: '14px', padding: '16px 12px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '1.5rem' }}>{q.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>{q.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* ── Earnings Chart ── */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1/-1' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>📈 14-Day Credit Earnings</h3>
          {loading ? <div className="skeleton" style={{ height: '180px' }} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52b788" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#52b788" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6c757d' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6c757d' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #b7e4c7', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="credits" stroke="#2d6a4f" strokeWidth={2}
                  fill="url(#creditGrad)" dot={{ fill: '#2d6a4f', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Recommended Actions ── */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1/-1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>🎯 Today's Recommendations</h3>
            <Link to="/advisor" style={{ color: '#2d6a4f', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>See all →</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', flex: 1 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
              {recommendations.map((r, i) => (
                <motion.div key={r.action_type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} whileHover={{ y: -3 }}
                  style={{ background: '#f0faf4', borderRadius: '12px', padding: '16px', border: '1px solid #b7e4c7' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{ACTION_ICONS[r.action_type] || '🌿'}</div>
                  <div style={{ fontWeight: 600, color: '#1a472a', fontSize: '0.9rem' }}>
                    {r.action_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  <div style={{ color: '#2d6a4f', fontWeight: 700, fontSize: '0.85rem', marginTop: '4px' }}>
                    +{r.projected_monthly_credits.toFixed(0)} credits/mo
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Activity ── */}
        <div className="glass" style={{ padding: '24px', gridColumn: '1/-1' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>🕐 Recent Activity</h3>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '56px', marginBottom: '8px' }} />)
          ) : history.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', padding: '24px' }}>No actions yet. <Link to="/log">Log your first action →</Link></p>
          ) : (
            <div>
              {history.slice(0, 6).map(a => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e8f5e9' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{ACTION_ICONS[a.action_type] || '🌿'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1a472a', fontSize: '0.9rem' }}>
                      {a.action_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                      {new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#2d6a4f', fontWeight: 700 }}>+{a.credits_earned.toFixed(1)}</div>
                    <span className={statusClass(a.verification_status)} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {statusIcon(a.verification_status)} {a.verification_status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
