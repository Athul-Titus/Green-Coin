import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { actionsApi, verificationApi, type ActionType } from '../api/greencoin'
import toast from 'react-hot-toast'
import { VerificationStatus } from '../components/Verification/VerificationStatus'
import { VideoSelfie } from '../components/Verification/VideoSelfie'

const ACTION_ICONS: Record<string, string> = {
  cycling_commute: '🚴', public_transport: '🚌', plant_based_meal: '🥗',
  solar_energy: '☀️', composting: '♻️', ev_charging: '⚡', led_switch: '💡', no_flight: '✈️',
}

const CATEGORY_COLORS: Record<string, string> = {
  transport: '#d8f3dc', diet: '#fff3cd', energy: '#fff9db', waste: '#e0f7fa',
}

export default function LogAction() {
  const [types, setTypes] = useState<ActionType[]>([])
  const [selected, setSelected] = useState<ActionType | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [proofData, setProofData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  
  // Verification states
  const [step, setStep] = useState<'select' | 'proof' | 'verifying' | 'audit' | 'done'>('select')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [activeAuditType, setActiveAuditType] = useState<string | null>(null)
  const [trustPreview, setTrustPreview] = useState<number | null>(null)

  useEffect(() => { actionsApi.getTypes().then(r => setTypes(r.data)) }, [])

  // Simple live trust score simulation
  useEffect(() => {
    if (!selected || quantity <= 0) return setTrustPreview(null)
    const base = 85
    const feasible = quantity <= (selected.max_daily_claim / 2) ? 10 : -15
    const score = Math.min(100, Math.max(30, base + feasible + Math.round(Math.random() * 5)))
    const t = setTimeout(() => setTrustPreview(score), 300)
    return () => clearTimeout(t)
  }, [selected, quantity])

  const handleSubmit = async () => {
    if (!selected) return
    setStep('verifying')
    
    // Simulate getting a device token from a native app or browser fingerprint
    const dummyDeviceToken = localStorage.getItem('gc_device_token') || 'dummy_token'
    
    // Build the GreenActionSubmission payload for the new Verification Pipeline
    const userStr = localStorage.getItem('gc_user')
    let userId = 'test_user_001'
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr)
        if (parsed.id) userId = parsed.id
      } catch (e) {}
    }
    
    const submissionData = {
      action_id: crypto.randomUUID(),
      user_id: userId,
      action_type: selected.code,
      claimed_credits: Math.round(quantity * selected.credits_per_unit),
      timestamp: new Date().toISOString(),
      device_fingerprint: {
        imei_hash: "browser_hash",
        mac_hash: "browser_hash",
        os_version: navigator.userAgent,
        screen_resolution: `${window.innerWidth}x${window.innerHeight}`,
        cpu_cores: navigator.hardwareConcurrency || 4,
        installed_apps_hash: "web_app",
        sim_hash: "none",
        carrier: "wifi",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      battery_start_pct: 85,
      battery_end_pct: 82,
      // Pass the demo proof data through
      receipt_image_b64: proofData.demo_receipt ? "demo_base64_string" : null,
      meter_reading: proofData.meter_reading ? parseFloat(proofData.meter_reading) : null
    }

    try {
      const res = await verificationApi.submitAction(submissionData, dummyDeviceToken)
      setVerificationResult(res.data)
      
      // Also log it to the legacy API for dashboard history
      await actionsApi.log({
        action_type: selected.code,
        quantity,
        proof_data: proofData,
      })
      
    } catch (e: any) {
      let errorMsg = 'Verification pipeline failed to respond';
      if (e.response?.data?.detail) {
        if (typeof e.response.data.detail === 'string') {
          errorMsg = e.response.data.detail;
        } else if (Array.isArray(e.response.data.detail)) {
          errorMsg = e.response.data.detail.map((err: any) => `${err.loc?.join('.')} ${err.msg}`).join(', ') || 'Validation Error';
        }
      }
      toast.error(errorMsg)
      setStep('proof')
    }
  }

  const handleAuditSubmit = async (base64Media: string) => {
    if (!verificationResult || !activeAuditType) return
    try {
      const userStr = localStorage.getItem('gc_user')
      const userId = userStr ? JSON.parse(userStr).id : 'demo_user'
      
      await verificationApi.auditRespond({
        audit_id: 'dummy_audit_id', // In a real app we'd get this from the backend
        user_id: userId,
        audit_type: activeAuditType,
        video_b64: activeAuditType === 'VIDEO_SELFIE' ? base64Media : undefined,
      })
      
      toast.success('Audit submitted successfully. Credits released!')
      setStep('done')
      setActiveAuditType(null)
    } catch (e: any) {
      toast.error('Failed to submit audit.')
    }
  }

  const renderProofInput = () => {
    if (!selected) return null
    switch (selected.code) {
      case 'cycling_commute':
      case 'public_transport':
        return (
          <div>
            <p style={{ color: '#6c757d', marginBottom: '16px', fontSize: '0.9rem' }}>
              🗺️ In production, this uses live GPS tracking. For demo, enter the distance.
            </p>
            <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px' }}>
              Distance (km)
            </label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={0.1} step={0.1}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', fontSize: '1.1rem' }} />
            <div style={{ marginTop: '12px', padding: '12px', background: '#f0faf4', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                📍 Mock GPS trace: Bangalore City Centre → Koramangala (4.2 km)
              </div>
            </div>
          </div>
        )
      case 'plant_based_meal':
        return (
          <div>
            <p style={{ color: '#6c757d', marginBottom: '16px', fontSize: '0.9rem' }}>
              📸 In production, you'd upload a receipt for OCR verification. For demo:
            </p>
            <div style={{ border: '2px dashed #b7e4c7', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer',
              background: '#f0faf4' }} onClick={() => setProofData({ demo_receipt: true, items: ['Tofu Buddha Bowl', 'Dal'] })}>
              {proofData.demo_receipt ? (
                <div>✅ <strong>Demo receipt loaded:</strong> Tofu Buddha Bowl, Dal Tadka</div>
              ) : (
                <div>📷 Tap to upload receipt (demo: click to use sample)</div>
              )}
            </div>
            <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px', marginTop: '16px' }}>
              Number of plant-based meals
            </label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} max={5}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', fontSize: '1.1rem' }} />
          </div>
        )
      case 'solar_energy':
      case 'ev_charging':
        return (
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px' }}>
              Energy (kWh)
            </label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={0.1} step={0.1}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', fontSize: '1.1rem' }} />
            <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px', marginTop: '16px' }}>
              Meter reading or charger log (optional)
            </label>
            <input type="text" placeholder="e.g. 1234.5 kWh"
              onChange={e => setProofData(p => ({ ...p, meter_reading: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', fontSize: '1rem' }} />
          </div>
        )
      case 'composting':
        return (
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px' }}>Weight composted (kg)</label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={0.1} step={0.1}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', fontSize: '1.1rem' }} />
          </div>
        )
      default:
        return (
          <div>
            <p style={{ color: '#6c757d', marginBottom: '16px' }}>Confirm you completed: <strong>{selected.display_name}</strong></p>
            <div style={{ padding: '12px', background: '#f0faf4', borderRadius: '10px', color: '#2d6a4f', fontWeight: 600 }}>
              This is a one-time action worth <strong>{selected.credits_per_unit} credits</strong>.
            </div>
          </div>
        )
    }
  }

  const estimatedCredits = selected ? quantity * selected.credits_per_unit * ((trustPreview || 80) / 100 + 0.5) : 0

  return (
    <div className="max-w-2xl mx-auto">
      <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', marginBottom: '8px', fontSize: '1.5rem' }}>
        ➕ Log a Green Action
      </h2>
      <p style={{ color: '#6c757d', marginBottom: '24px' }}>Every action passes through our 5-Layer Trust Pipeline.</p>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Select Action ── */}
        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '12px' }}>
              {types.map(t => (
                <motion.button key={t.code} whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelected(t); setStep('proof') }}
                  style={{ background: CATEGORY_COLORS[t.category] || '#f0faf4',
                    border: '2px solid transparent', borderRadius: '14px', padding: '20px 12px',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{ACTION_ICONS[t.code] || '🌿'}</div>
                  <div style={{ fontWeight: 700, color: '#1a472a', fontSize: '0.85rem', lineHeight: 1.3 }}>{t.display_name}</div>
                  <div style={{ color: '#2d6a4f', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>
                    +{t.credits_per_unit} / {t.unit}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Proof Collection ── */}
        {step === 'proof' && selected && (
          <motion.div key="proof" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}>
            <div className="glass" style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem' }}>{ACTION_ICONS[selected.code]}</span>
                <div>
                  <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>{selected.display_name}</h3>
                  <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>{selected.description}</p>
                </div>
              </div>
              {renderProofInput()}
            </div>

            {/* Trust Score Preview */}
            {trustPreview !== null && (
              <motion.div className="glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>🤖 Trust Score Preview</p>
                  <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.8rem', fontWeight: 700,
                    color: trustPreview >= 80 ? '#15803d' : trustPreview >= 60 ? '#d97706' : '#dc2626' }}>
                    {trustPreview}/100
                  </div>
                </div>
                <div style={{ flex: 1, height: '8px', background: '#e8f5e9', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${trustPreview}%` }} transition={{ duration: 0.5 }}
                    style={{ height: '100%', background: trustPreview >= 80 ? '#15803d' : trustPreview >= 60 ? '#f59e0b' : '#ef4444',
                      borderRadius: '4px' }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#6c757d', fontSize: '0.8rem' }}>Est. credits</p>
                  <p style={{ fontWeight: 700, color: '#2d6a4f', fontSize: '1.2rem' }}>+{estimatedCredits.toFixed(1)}</p>
                </div>
              </motion.div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setStep('select')}>← Back</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? '⏳ Verifying...' : `🌱 Run ML Verification (+${estimatedCredits.toFixed(0)} credits)`}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Verifying Status ── */}
        {step === 'verifying' && (
           <motion.div key="verifying" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <VerificationStatus 
                actionId="new_action" 
                result={verificationResult} 
                onAuditStart={(type) => {
                  setActiveAuditType(type);
                  setStep('audit');
                }}
              />
              
              {verificationResult && !verificationResult.audit_required && (
                <div className="mt-8 flex justify-center space-x-4">
                  <button className="btn-secondary px-6 py-2" onClick={() => { setStep('select'); setSelected(null); setVerificationResult(null) }}>
                    Log Another
                  </button>
                  <button className="btn-primary px-6 py-2" onClick={() => window.location.href = '/dashboard'}>
                    View Dashboard
                  </button>
                </div>
              )}
           </motion.div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass" style={{ padding: '48px', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              style={{ fontSize: '4rem', marginBottom: '16px' }}>🌿</motion.div>
            <h3 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', fontSize: '1.5rem', marginBottom: '8px' }}>
              Action Verified & Logged!
            </h3>
            <p style={{ color: '#6c757d', marginBottom: '24px' }}>
              Your credits have been added to your wallet.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => { setStep('select'); setSelected(null); setQuantity(1); setProofData({}); setVerificationResult(null) }}>
                Log Another
              </button>
              <button className="btn-primary" onClick={() => window.location.href = '/dashboard'}>
                View Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Modals */}
      {step === 'audit' && activeAuditType === 'VIDEO_SELFIE' && (
        <VideoSelfie 
          auditId="dummy" 
          onClose={() => setStep('verifying')} 
          onSubmit={handleAuditSubmit} 
        />
      )}
    </div>
  )
}
