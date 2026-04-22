import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { authApi, advisorApi } from '../api/greencoin'
import toast from 'react-hot-toast'
import { MapPin, Bike, Leaf, Zap, CheckSquare, ChevronRight, ChevronLeft, Sprout } from 'lucide-react'

const steps = [
  { id: 1, title: 'Your Location',    icon: MapPin,      subtitle: 'Help us personalize your plan' },
  { id: 2, title: 'Daily Commute',    icon: Bike,        subtitle: 'How do you get around?' },
  { id: 3, title: 'Your Diet',        icon: Leaf,        subtitle: 'Food choices matter a lot' },
  { id: 4, title: 'Home Energy',      icon: Zap,         subtitle: 'Your energy source affects credits' },
  { id: 5, title: 'Current Habits',   icon: CheckSquare, subtitle: 'What are you already doing?' },
]

type Profile = {
  city: string; neighborhood_type: string;
  commute: string; diet: string; energy: string;
  habits: string[];
}

const COMMUTES = [
  { value: 'walk',             label: 'Walk',            icon: '🚶' },
  { value: 'cycling',          label: 'Cycling',         icon: '🚲' },
  { value: 'public_transport', label: 'Public Transit',  icon: '🚌' },
  { value: 'car',              label: 'Car',             icon: '🚗' },
  { value: 'wfh',             label: 'Work From Home',   icon: '🏠' },
]

const DIETS = [
  { value: 'vegan',        label: 'Vegan',        icon: '🌱', desc: 'Plant-only' },
  { value: 'vegetarian',   label: 'Vegetarian',   icon: '🥗', desc: 'No meat/fish' },
  { value: 'flexitarian',  label: 'Flexitarian',  icon: '🥦', desc: 'Mostly plants' },
  { value: 'omnivore',     label: 'Omnivore',     icon: '🍖', desc: 'Everything' },
]

const ENERGIES = [
  { value: 'solar',         label: 'Full Solar',     icon: '☀️', desc: '100% solar panels' },
  { value: 'partial_solar', label: 'Partial Solar',  icon: '🌤️', desc: 'Solar + grid' },
  { value: 'grid',          label: 'Grid Only',      icon: '⚡', desc: 'Regular electricity' },
]

const HABITS = [
  'Composting',  'LED bulbs', 'EV or e-bike', 'Reusable bags',
  'Reduced AC',  'Rainwater harvesting', 'Avoiding single-use plastic',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Profile>({
    city: '', neighborhood_type: 'urban',
    commute: '', diet: '', energy: '',
    habits: [],
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [projected, setProjected] = useState<number | null>(null)

  const totalSteps = 6 // 5 profile + 1 account

  const progress = ((step - 1) / (totalSteps - 1)) * 100

  const toggleHabit = (h: string) => {
    setProfile(p => ({
      ...p,
      habits: p.habits.includes(h) ? p.habits.filter(x => x !== h) : [...p.habits, h],
    }))
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const res = await authApi.register({
        email, password, full_name: name,
        user_type: 'individual', city: profile.city,
      })
      localStorage.setItem('gc_token', res.data.access_token)
      localStorage.setItem('gc_user', JSON.stringify({ email, full_name: name, user_type: 'individual' }))

      // Get advisor plan to show projected earnings
      try {
        const plan = await advisorApi.getPlan()
        setProjected(plan.data.projected_monthly_credits)
      } catch (_) {}

      setStep(7) // Show success
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 40%, #40916c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem' }}>🌱</div>
          <h1 style={{ color: 'white', fontFamily: 'Poppins,sans-serif', fontSize: '1.8rem', fontWeight: 800 }}>GreenCoin</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '4px' }}>Earn carbon credits from your lifestyle</p>
        </motion.div>

        {/* Progress Bar */}
        {step < 7 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#52b788,#b7e4c7)', borderRadius: '3px' }} />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="glass" style={{ padding: '36px', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={1}>
            <motion.div key={step} custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}>

              {/* ── Step 0: Account ── */}
              {step === 0 && (
                <div>
                  <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.5rem', color: '#1a472a', marginBottom: '8px' }}>Create Your Account</h2>
                  <p style={{ color: '#6c757d', marginBottom: '24px' }}>We'll save your progress and unlock full features.</p>
                  {/* Intentionally left blank — account step shown at step 6 */}
                </div>
              )}

              {/* ── Step 1: Location ── */}
              {step === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#d8f3dc', borderRadius: '12px', padding: '10px' }}><MapPin color="#1a472a" size={24}/></div>
                    <div><h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>Your Location</h2>
                    <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>Help us personalize your green action plan</p></div>
                  </div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '8px' }}>City</label>
                  <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Bangalore, Mumbai, Kochi..."
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', fontSize: '1rem', outline: 'none', marginBottom: '20px' }} />
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '12px' }}>Neighborhood Type</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['urban','suburban','rural'].map(n => (
                      <button key={n} onClick={() => setProfile(p => ({ ...p, neighborhood_type: n }))}
                        style={{ flex: 1, padding: '14px', border: `2px solid ${profile.neighborhood_type === n ? '#2d6a4f' : '#b7e4c7'}`,
                          background: profile.neighborhood_type === n ? '#d8f3dc' : 'white',
                          borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#1a472a',
                          textTransform: 'capitalize', transition: 'all 0.2s' }}>
                        {n === 'urban' ? '🏙️' : n === 'suburban' ? '🏘️' : '🌿'}<br />{n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Commute ── */}
              {step === 2 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#d8f3dc', borderRadius: '12px', padding: '10px' }}><Bike color="#1a472a" size={24}/></div>
                    <div><h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>Daily Commute</h2>
                    <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>How do you primarily get around?</p></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {COMMUTES.map(c => (
                      <button key={c.value} onClick={() => setProfile(p => ({ ...p, commute: c.value }))}
                        style={{ padding: '18px 12px', border: `2px solid ${profile.commute === c.value ? '#2d6a4f' : '#e8f5e9'}`,
                          background: profile.commute === c.value ? '#d8f3dc' : 'white',
                          borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{c.icon}</div>
                        <div style={{ fontWeight: 600, color: '#1a472a' }}>{c.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Diet ── */}
              {step === 3 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#d8f3dc', borderRadius: '12px', padding: '10px' }}><Leaf color="#1a472a" size={24}/></div>
                    <div><h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>Your Diet</h2>
                    <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>Food choices significantly impact carbon credits</p></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {DIETS.map(d => (
                      <button key={d.value} onClick={() => setProfile(p => ({ ...p, diet: d.value }))}
                        style={{ padding: '16px 20px', border: `2px solid ${profile.diet === d.value ? '#2d6a4f' : '#e8f5e9'}`,
                          background: profile.diet === d.value ? '#d8f3dc' : 'white',
                          borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '1.8rem' }}>{d.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#1a472a' }}>{d.label}</div>
                          <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>{d.desc}</div>
                        </div>
                        {profile.diet === d.value && <div style={{ marginLeft: 'auto', color: '#2d6a4f', fontWeight: 700 }}>✓</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Energy ── */}
              {step === 4 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#d8f3dc', borderRadius: '12px', padding: '10px' }}><Zap color="#1a472a" size={24}/></div>
                    <div><h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>Home Energy</h2>
                    <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>What powers your home?</p></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {ENERGIES.map(e => (
                      <button key={e.value} onClick={() => setProfile(p => ({ ...p, energy: e.value }))}
                        style={{ padding: '20px', border: `2px solid ${profile.energy === e.value ? '#2d6a4f' : '#e8f5e9'}`,
                          background: profile.energy === e.value ? '#d8f3dc' : 'white',
                          borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '2rem' }}>{e.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#1a472a' }}>{e.label}</div>
                          <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>{e.desc}</div>
                        </div>
                        {profile.energy === e.value && <div style={{ marginLeft: 'auto', color: '#2d6a4f', fontWeight: 700 }}>✓</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 5: Habits ── */}
              {step === 5 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#d8f3dc', borderRadius: '12px', padding: '10px' }}><CheckSquare color="#1a472a" size={24}/></div>
                    <div><h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>Existing Habits</h2>
                    <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>What green habits do you already have?</p></div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {HABITS.map(h => (
                      <button key={h} onClick={() => toggleHabit(h)}
                        style={{ padding: '10px 16px', border: `2px solid ${profile.habits.includes(h) ? '#2d6a4f' : '#e8f5e9'}`,
                          background: profile.habits.includes(h) ? '#d8f3dc' : 'white',
                          borderRadius: '20px', cursor: 'pointer', fontWeight: 600, color: '#1a472a',
                          fontSize: '0.9rem', transition: 'all 0.2s' }}>
                        {profile.habits.includes(h) ? '✓ ' : ''}{h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 6: Account Creation ── */}
              {step === 6 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#d8f3dc', borderRadius: '12px', padding: '10px' }}><Sprout color="#1a472a" size={24}/></div>
                    <div><h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a' }}>Create Account</h2>
                    <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>Start earning carbon credits today</p></div>
                  </div>
                  {[
                    { label: 'Full Name', value: name, set: setName, placeholder: 'Arjun Sharma', type: 'text' },
                    { label: 'Email', value: email, set: setEmail, placeholder: 'arjun@gmail.com', type: 'email' },
                    { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', type: 'password' },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#1a472a', marginBottom: '6px' }}>{f.label}</label>
                      <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} type={f.type}
                        style={{ width: '100%', padding: '12px 16px', border: '2px solid #b7e4c7', borderRadius: '10px', fontSize: '1rem' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Step 7: Success ── */}
              {step === 7 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                    style={{ fontSize: '4rem', marginBottom: '16px' }}>🌿</motion.div>
                  <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#1a472a', fontSize: '1.8rem', marginBottom: '8px' }}>You're all set!</h2>
                  <p style={{ color: '#6c757d', marginBottom: '24px' }}>Based on your lifestyle, you could earn:</p>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ background: 'linear-gradient(135deg,#1a472a,#2d6a4f)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Poppins,sans-serif' }}>
                      {projected ? `${projected.toFixed(0)}` : '~320'} credits
                    </div>
                    <div style={{ opacity: 0.8 }}>≈ ₹{projected ? (projected * 50).toLocaleString() : '16,000'}/month</div>
                  </motion.div>
                  <button className="btn-primary" style={{ width: '100%', padding: '16px' }}
                    onClick={() => navigate('/dashboard')}>
                    Go to Dashboard →
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step < 7 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              {step > 1 && (
                <button className="btn-secondary" onClick={() => setStep(s => s - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ChevronLeft size={16}/> Back
                </button>
              )}
              {step < 6 ? (
                <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => setStep(s => s + 1)}>
                  Continue <ChevronRight size={16}/>
                </button>
              ) : (
                <button className="btn-primary" style={{ flex: 1 }}
                  onClick={handleFinish} disabled={loading || !email || !password || !name}>
                  {loading ? '⏳ Creating...' : '🌱 Create Account'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
