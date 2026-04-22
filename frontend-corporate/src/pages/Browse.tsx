import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { marketApi, type CreditBundle } from '../api/greencoin'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#1a472a', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2']
const ACTION_ICONS: Record<string, string> = {
  cycling_commute: '🚴', public_transport: '🚌', plant_based_meal: '🥗',
  solar_energy: '☀️', composting: '♻️', ev_charging: '⚡', led_switch: '💡', no_flight: '✈️',
}

function QualityBadge({ score }: { score: number }) {
  const cls = score >= 85 ? 'quality-high' : score >= 70 ? 'quality-medium' : 'quality-low'
  const label = score >= 85 ? 'Premium' : score >= 70 ? 'Standard' : 'Basic'
  return (
    <span className={cls} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
      {label} {score}/100
    </span>
  )
}

export default function Browse() {
  const [bundles, setBundles] = useState<CreditBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ region: '', min_quality: 0, max_price: 0 })
  const [sortBy, setSortBy] = useState('created_at')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchBundles = () => {
    setLoading(true)
    marketApi.getBundles({
      region: filters.region || undefined,
      min_quality: filters.min_quality || undefined,
      max_price: filters.max_price || undefined,
    }).then(r => setBundles(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchBundles() }, [])

  const sorted = [...bundles].sort((a, b) => {
    if (sortBy === 'price') return a.price_per_tonne - b.price_per_tonne
    if (sortBy === 'quality') return b.quality_score - a.quality_score
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handlePurchase = async (bundle: CreditBundle) => {
    setPurchasing(bundle.id)
    try {
      const res = await marketApi.purchase(bundle.id)
      toast.success(`✅ Purchase successful! Certificate: ${res.data.certificate_id?.slice(0,8)}...`)
      navigate(`/certificate/${res.data.certificate_id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Purchase failed')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '8px', fontSize: '1.5rem' }}>
        🌍 Carbon Credit Marketplace
      </h2>
      <p style={{ color: '#6c757d', marginBottom: '24px' }}>Browse verified carbon credit bundles from real individual contributors.</p>

      {/* ── Filters ── */}
      <div className="glass" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', marginBottom: '4px', fontWeight: 600 }}>Region</label>
          <input value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}
            placeholder="e.g. Kerala" style={{ padding: '8px 12px', border: '2px solid #b7e4c7', borderRadius: '8px', fontSize: '0.9rem' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', marginBottom: '4px', fontWeight: 600 }}>Min Quality</label>
          <select value={filters.min_quality} onChange={e => setFilters(f => ({ ...f, min_quality: Number(e.target.value) }))}
            style={{ padding: '8px 12px', border: '2px solid #b7e4c7', borderRadius: '8px', fontSize: '0.9rem' }}>
            <option value={0}>Any</option>
            <option value={70}>70+ Standard</option>
            <option value={85}>85+ Premium</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', marginBottom: '4px', fontWeight: 600 }}>Sort By</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', border: '2px solid #b7e4c7', borderRadius: '8px', fontSize: '0.9rem' }}>
            <option value="created_at">Newest</option>
            <option value="quality">Highest Quality</option>
            <option value="price">Lowest Price</option>
          </select>
        </div>
        <button className="btn-corp" onClick={fetchBundles} style={{ padding: '9px 20px' }}>Apply Filters</button>
      </div>

      {/* ── Bundle Cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '20px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '380px' }} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center', color: '#6c757d' }}>
          No bundles match your filters. <button onClick={() => setFilters({ region: '', min_quality: 0, max_price: 0 })}
            style={{ color: '#2d6a4f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '20px' }}>
          {sorted.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', fontSize: '1rem' }}>{b.name}</h3>
                  <p style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '2px' }}>{b.region || 'India'}</p>
                </div>
                <QualityBadge score={b.quality_score} />
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Tonnes', value: b.total_tonnes.toFixed(1) },
                  { label: 'Contributors', value: b.total_users.toLocaleString() },
                  { label: '₹/tonne', value: b.price_per_tonne.toLocaleString() },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f0faf4', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#1a472a', fontSize: '1rem' }}>{s.value}</div>
                    <div style={{ color: '#6c757d', fontSize: '0.72rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Action Type Breakdown Pie */}
              {b.action_types && b.action_types.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 600, marginBottom: '6px' }}>Action Breakdown</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {b.action_types.map(at => (
                      <span key={at.type} style={{ background: '#d8f3dc', color: '#1a472a', padding: '3px 10px',
                        borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {ACTION_ICONS[at.type] || '🌿'} {at.pct}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px', background: '#f8faf8', borderRadius: '10px', marginTop: 'auto' }}>
                <div>
                  <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#1a472a' }}>
                    ₹{b.total_price.toLocaleString()}
                  </span>
                  <span style={{ color: '#6c757d', fontSize: '0.8rem' }}> total</span>
                </div>
                <button className="btn-corp" onClick={() => handlePurchase(b)}
                  disabled={purchasing === b.id || b.status !== 'available'}
                  style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                  {purchasing === b.id ? '⏳...' : b.status === 'available' ? 'Purchase →' : 'Sold Out'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
