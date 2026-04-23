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
  const glassPanel: React.CSSProperties = {
    borderRadius: '22px',
    border: '1px solid rgba(207,255,226,0.35)',
    background: 'linear-gradient(130deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.28)',
  }

  return (
    <div style={{ padding: '0', position: 'relative' }}>
      <motion.div
        aria-hidden
        animate={{ x: [0, 25, -18, 0], y: [0, -18, 14, 0], scale: [1, 1.06, 0.96, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'fixed', top: '70px', right: '-120px', width: '330px', height: '330px', pointerEvents: 'none', borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(120,255,196,0.36), rgba(120,255,196,0.01) 72%)', filter: 'blur(16px)', zIndex: -1 }}
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, -22, 12, 0], y: [0, 18, -15, 0], scale: [1, 0.95, 1.04, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'fixed', bottom: '-120px', left: '220px', width: '320px', height: '320px', pointerEvents: 'none', borderRadius: '50%', background: 'radial-gradient(circle at 60% 50%, rgba(95,235,255,0.3), rgba(95,235,255,0.01) 70%)', filter: 'blur(20px)', zIndex: -1 }}
      />

      {/* ── Hero Balance Card ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...glassPanel, background: 'linear-gradient(135deg, rgba(92,255,181,0.24), rgba(98,244,255,0.18))', padding: '32px', color: 'white', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px',
          background: 'rgba(82,183,136,0.2)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '60%', width: '150px', height: '150px',
          background: 'rgba(120,244,255,0.14)', borderRadius: '50%' }} />
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
          { label: 'Log Action',   icon: '➕', to: '/log' },
          { label: 'Wallet',       icon: '💳', to: '/wallet' },
          { label: 'Get Advice',   icon: '🤖', to: '/advisor' },
        ].map(q => (
          <Link key={q.to} to={q.to} style={{ flex: 1, textDecoration: 'none' }}>
            <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ ...glassPanel, borderRadius: '14px', padding: '16px 12px', textAlign: 'center', color: '#edfff6', background: 'linear-gradient(130deg, rgba(133,255,202,0.3), rgba(96,245,255,0.2))' }}>
              <div style={{ fontSize: '1.5rem' }}>{q.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>{q.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* ── Earnings Chart ── */}
        <div style={{ ...glassPanel, padding: '24px', gridColumn: '1/-1' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#f4fff8', marginBottom: '16px' }}>📈 14-Day Credit Earnings</h3>
          {loading ? <div className="skeleton" style={{ height: '180px' }} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#83ffd2" stopOpacity={0.48}/>
                    <stop offset="95%" stopColor="#83ffd2" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(228,255,240,0.22)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(237,255,245,0.78)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(237,255,245,0.78)' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid rgba(190,255,221,0.42)', background: 'rgba(11,44,31,0.9)', color: '#effff7', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }} />
                <Area type="monotone" dataKey="credits" stroke="#8affd3" strokeWidth={2}
                  fill="url(#creditGrad)" dot={{ fill: '#8affd3', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Recommended Actions ── */}
        <div style={{ ...glassPanel, padding: '24px', gridColumn: '1/-1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#f4fff8' }}>🎯 Today's Recommendations</h3>
            <Link to="/advisor" style={{ color: '#c6ffe2', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>See all →</Link>
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
                  style={{ background: 'linear-gradient(130deg, rgba(133,255,202,0.28), rgba(96,245,255,0.2))', borderRadius: '12px', padding: '16px', border: '1px solid rgba(210,255,228,0.35)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{ACTION_ICONS[r.action_type] || '🌿'}</div>
                  <div style={{ fontWeight: 600, color: '#f4fff8', fontSize: '0.9rem' }}>
                    {r.action_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  <div style={{ color: '#d8ffee', fontWeight: 700, fontSize: '0.85rem', marginTop: '4px' }}>
                    +{r.projected_monthly_credits.toFixed(0)} credits/mo
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Activity ── */}
        <div style={{ ...glassPanel, padding: '24px', gridColumn: '1/-1' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#f4fff8', marginBottom: '16px' }}>🕐 Recent Activity</h3>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '56px', marginBottom: '8px' }} />)
          ) : history.length === 0 ? (
            <p style={{ color: 'rgba(229,255,240,0.78)', textAlign: 'center', padding: '24px' }}>No actions yet. <Link to="/log" style={{ color: '#c9ffe4' }}>Log your first action →</Link></p>
          ) : (
            <div>
              {history.slice(0, 6).map(a => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(226,255,238,0.18)' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{ACTION_ICONS[a.action_type] || '🌿'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#f3fff8', fontSize: '0.9rem' }}>
                      {a.action_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div style={{ color: 'rgba(229,255,240,0.68)', fontSize: '0.8rem' }}>
                      {new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#b9ffdc', fontWeight: 700 }}>+{a.credits_earned.toFixed(1)}</div>
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
