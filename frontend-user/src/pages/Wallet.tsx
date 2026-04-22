import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { creditsApi, type BalanceResponse } from '../api/greencoin'
import toast from 'react-hot-toast'

const COLORS = ['#1a472a', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7']

const ACTION_ICONS: Record<string, string> = {
  cycling_commute: '🚴', public_transport: '🚌', plant_based_meal: '🥗',
  solar_energy: '☀️', composting: '♻️', ev_charging: '⚡', led_switch: '💡', no_flight: '✈️',
}

export default function Wallet() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')

  useEffect(() => {
    Promise.all([creditsApi.getBalance(), creditsApi.getHistory()]).then(([b, h]) => {
      setBalance(b.data)
      setHistory(h.data)
    }).finally(() => setLoading(false))
  }, [])

  // Build pie chart data from credit history
  const pieData = React.useMemo(() => {
    const byType: Record<string, number> = {}
    history.forEach(h => {
      const k = h.action_type || 'other'
      byType[k] = (byType[k] || 0) + h.amount
    })
    return Object.entries(byType).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: Math.round(value),
    }))
  }, [history])

  const handleWithdraw = async () => {
    try {
      await creditsApi.withdraw(Number(withdrawAmount), bankAccount)
      toast.success(`💸 ₹${(Number(withdrawAmount) * 50).toLocaleString()} withdrawal requested!`)
      setShowWithdraw(false)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Withdrawal failed')
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '24px', fontSize: '1.5rem' }}>
        💳 My Wallet
      </h2>

      {/* ── Balance Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Available Credits', value: balance?.available_credits.toFixed(0) || '—', sub: `≈ ₹${((balance?.available_credits || 0) * 50).toLocaleString()}`, color: '#1a472a', icon: '💚' },
          { label: 'Total Earned',      value: balance?.total_credits.toFixed(0) || '—', sub: 'All time', color: '#2d6a4f', icon: '🌿' },
          { label: 'CO₂ Offset',        value: `${(balance?.tonnes_equivalent || 0).toFixed(2)} t`, sub: 'Tonnes equivalent', color: '#40916c', icon: '🌍' },
          { label: 'Credits Sold',      value: balance?.sold_credits.toFixed(0) || '0', sub: 'To corporates', color: '#52b788', icon: '🤝' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ background: c.color, borderRadius: '16px', padding: '20px', color: 'white' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{c.icon}</div>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.8rem', fontWeight: 700 }}>{loading ? '—' : c.value}</div>
            <div style={{ opacity: 0.75, fontSize: '0.8rem' }}>{c.label}</div>
            <div style={{ opacity: 0.6, fontSize: '0.75rem', marginTop: '2px' }}>{c.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* ── Credit History ── */}
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>📜 Credit History</h3>
          {loading ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '8px' }} />) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Credits</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>₹ Value</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} style={{ borderTop: '1px solid #e8f5e9', fontSize: '0.85rem' }}>
                      <td style={{ padding: '10px 8px', color: '#6c757d' }}>
                        {new Date(h.minted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {ACTION_ICONS[h.action_type] || '🌿'} {h.action_type?.replace(/_/g,' ') || '—'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#2d6a4f', fontWeight: 700 }}>
                        +{h.amount?.toFixed(1)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#6c757d' }}>
                        ₹{(h.amount * 50).toFixed(0)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span className={`badge badge-${h.status === 'available' ? 'verified' : 'pending'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pie Chart ── */}
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '16px' }}>📊 Earnings Breakdown</h3>
          {loading ? <div className="skeleton" style={{ height: '220px' }} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} credits`, '']} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Withdraw Button ── */}
      <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>💸 Withdraw Credits</h3>
          <p style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '4px' }}>
            Convert credits to INR (1 credit = ₹50). Settlement in 2-3 business days.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowWithdraw(true)}>
          Withdraw →
        </button>
      </div>

      {/* ── Withdraw Modal ── */}
      {showWithdraw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass" style={{ padding: '32px', width: '100%', maxWidth: '420px', margin: '24px' }}>
            <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '24px' }}>Withdraw Credits</h3>
            <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px' }}>Credits to withdraw</label>
            <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
              placeholder={`Max: ${balance?.available_credits.toFixed(0) || 0}`}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', marginBottom: '16px', fontSize: '1rem' }} />
            {withdrawAmount && <p style={{ color: '#2d6a4f', fontWeight: 600, marginBottom: '16px' }}>
              = ₹{(Number(withdrawAmount) * 50).toLocaleString()}
            </p>}
            <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px' }}>Bank Account Number</label>
            <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)}
              placeholder="Enter bank account number"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', marginBottom: '24px', fontSize: '1rem' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setShowWithdraw(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleWithdraw}
                disabled={!withdrawAmount || !bankAccount}>
                Confirm Withdrawal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
