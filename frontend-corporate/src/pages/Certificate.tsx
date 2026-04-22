import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { marketApi } from '../api/greencoin'

const SDG_LABELS: Record<number, string> = {
  2: 'Zero Hunger', 3: 'Good Health', 7: 'Clean Energy', 9: 'Industry & Innovation',
  11: 'Sustainable Cities', 12: 'Responsible Consumption', 13: 'Climate Action', 15: 'Life on Land',
}

export default function Certificate() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    marketApi.getCertificate(id).then(r => setCert(r.data)).catch(() => setError('Certificate not found')).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: '400px', maxWidth: '600px', margin: '0 auto' }} />
    </div>
  )

  if (error) return (
    <div className="glass" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <p style={{ color: '#dc2626' }}>{error}</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '24px', fontSize: '1.5rem' }}>
        📜 ESG Certificate
      </h2>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Certificate Card */}
        <div style={{ background: 'linear-gradient(135deg,#1a472a,#2d6a4f)', borderRadius: '20px', padding: '40px', color: 'white', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'rgba(82,183,136,0.1)', borderRadius: '50%' }} />
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🌱</div>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.8rem', fontWeight: 800 }}>GREENCOIN</div>
            <div style={{ opacity: 0.75, fontSize: '0.85rem', letterSpacing: '0.1em' }}>CARBON CREDIT OFFSET CERTIFICATE</div>
            <div style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '6px' }}>No: {cert?.certificate_number}</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ opacity: 0.75, marginBottom: '8px' }}>This certifies that</p>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>
              {cert?.company_name || 'Your Company'}
            </div>
            <p style={{ opacity: 0.75, margin: '12px 0' }}>has successfully offset</p>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '3rem', fontWeight: 800, color: '#95d5b2' }}>
              {cert?.tonnes_offset?.toFixed(2)} t CO₂e
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
              This certificate aligns with <strong>GHG Protocol {cert?.ghg_scope || 'Scope 3'}</strong> — Category 11 (Use of Sold Products).
              All credits verified by GreenCoin's ML-powered trust verification system.
            </p>
          </div>

          {cert?.sdgs_addressed?.length > 0 && (
            <div>
              <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '10px' }}>SDGs ADDRESSED</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {cert.sdgs_addressed.map((sdg: number) => (
                  <span key={sdg} style={{ background: 'rgba(82,183,136,0.25)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                    SDG {sdg}: {SDG_LABELS[sdg] || 'Sustainability'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="glass" style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {cert?.download_url && (
            <a href={cert.download_url} target="_blank" rel="noopener noreferrer" className="btn-corp"
              style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
              📄 Download PDF
            </a>
          )}
          <button onClick={() => navigator.clipboard.writeText(cert?.qr_code || '')}
            style={{ padding: '11px 20px', border: '2px solid #b7e4c7', borderRadius: '10px', background: 'white',
              color: '#1a472a', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            🔗 Copy Verify Link
          </button>
          <button onClick={() => window.print()}
            style={{ padding: '11px 20px', border: '2px solid #b7e4c7', borderRadius: '10px', background: 'white',
              color: '#1a472a', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            🖨️ Print / Share
          </button>
        </div>
      </motion.div>
    </div>
  )
}
