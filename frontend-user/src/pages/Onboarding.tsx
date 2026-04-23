import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { authApi, advisorApi } from '../api/greencoin'
import toast from 'react-hot-toast'
import { MapPin, Bike, Leaf, Zap, CheckSquare, ChevronRight, ChevronLeft, Sprout } from 'lucide-react'

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
  const [email, setEmail] = useState('arjun@gmail.com')
  const [password, setPassword] = useState('greencoin123')
  const [name, setName] = useState('Arjun Sharma')
  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projected, setProjected] = useState<number | null>(null)

  const totalSteps = 6 // 5 profile + 1 account

  const progress = ((step - 1) / (totalSteps - 1)) * 100
  const currentMeta = useMemo(() => {
    if (step === 1) return { title: 'Your Location', subtitle: 'Help us personalize your green profile' }
    if (step === 2) return { title: 'Daily Commute', subtitle: 'Transportation is a major factor in credits' }
    if (step === 3) return { title: 'Your Diet', subtitle: 'Food choices shape your carbon footprint' }
    if (step === 4) return { title: 'Home Energy', subtitle: 'Tell us how your home is powered' }
    if (step === 5) return { title: 'Current Habits', subtitle: 'Select habits you already practice' }
    if (step === 6) return { title: isLogin ? 'Welcome Back' : 'Create Account', subtitle: isLogin ? 'Sign in and continue your progress' : 'Unlock your carbon credit dashboard' }
    return { title: 'You are all set', subtitle: 'Your earning profile is ready' }
  }, [step, isLogin])

  const toggleHabit = (h: string) => {
    setProfile(p => ({
      ...p,
      habits: p.habits.includes(h) ? p.habits.filter(x => x !== h) : [...p.habits, h],
    }))
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      let res;
      if (isLogin) {
        res = await authApi.login(email, password);
        localStorage.setItem('gc_token', res.data.access_token)
        localStorage.setItem('gc_user', JSON.stringify({ email, full_name: name || 'User', user_type: 'individual' }))
        navigate('/dashboard'); // Go straight to dashboard on login
        return;
      } else {
        res = await authApi.register({
          email, password, full_name: name,
          user_type: 'individual', city: profile.city,
        })
        localStorage.setItem('gc_token', res.data.access_token)
        localStorage.setItem('gc_user', JSON.stringify({ email, full_name: name, user_type: 'individual' }))
      }

      // Get advisor plan to show projected earnings
      try {
        const plan = await advisorApi.getPlan()
        setProjected(plan.data.projected_monthly_credits)
      } catch (_) {}

      setStep(7) // Show success
    } catch (e: any) {
      toast.error(e.response?.data?.detail || (isLogin ? 'Login failed' : 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const slideVariants = {
    enter: { y: 26, opacity: 0, scale: 0.985 },
    center: { y: 0, opacity: 1, scale: 1 },
    exit: { y: -20, opacity: 0, scale: 0.985 },
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'radial-gradient(130% 100% at 20% 0%, #1f7a57 0%, #0d2f21 48%, #081d15 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 20px' }}>
      <motion.div
        aria-hidden
        animate={{ x: [0, 36, -20, 0], y: [0, -22, 16, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-120px', left: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(130,255,186,0.6), rgba(130,255,186,0.02) 72%)', filter: 'blur(12px)' }}
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, -30, 18, 0], y: [0, 18, -28, 0], scale: [1, 0.94, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '-140px', right: '-70px', width: '390px', height: '390px', borderRadius: '50%', background: 'radial-gradient(circle at 55% 50%, rgba(100,201,255,0.42), rgba(100,201,255,0.02) 70%)', filter: 'blur(18px)' }}
      />

      <div style={{ width: '100%', maxWidth: '640px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ fontSize: '2rem', filter: 'drop-shadow(0 8px 24px rgba(124,255,183,0.3))' }}>🌱</div>
          <h1 style={{ color: '#f1fff6', fontFamily: 'Poppins,sans-serif', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.01em' }}>GreenCoin</h1>
          <p style={{ color: 'rgba(222,255,238,0.8)', fontSize: '0.92rem', marginTop: '6px' }}>Fluid onboarding for your carbon credit journey</p>
        </motion.div>

        {step < 7 && (
          <div style={{ marginBottom: '14px', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(205,255,225,0.24)', background: 'rgba(10,41,28,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(223,255,236,0.88)', fontSize: '0.78rem', marginBottom: '10px' }}>
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.14)', borderRadius: '20px', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.42, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#8cffc4,#60f5ff)', boxShadow: '0 0 20px rgba(110,255,224,0.55)' }} />
            </div>
          </div>
        )}

        <div style={{ borderRadius: '28px', border: '1px solid rgba(217,255,232,0.33)', background: 'linear-gradient(130deg, rgba(255,255,255,0.24), rgba(255,255,255,0.08))', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', boxShadow: '0 20px 55px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.28)', padding: '30px', overflow: 'hidden' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.35rem', color: '#f4fff8' }}>{currentMeta.title}</div>
            <div style={{ color: 'rgba(231,255,241,0.82)', fontSize: '0.92rem', marginTop: '4px' }}>{currentMeta.subtitle}</div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

              {/* ── Step 1: Location ── */}
              {step === 1 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e9fff4' }}>
                    <MapPin size={18} />
                    <span style={{ fontSize: '0.9rem' }}>Location Details</span>
                  </div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#ebfff4', marginBottom: '8px', fontSize: '0.9rem' }}>City</label>
                  <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Bangalore, Mumbai, Kochi..."
                    style={{ width: '100%', padding: '13px 14px', border: '1px solid rgba(224,255,238,0.34)', borderRadius: '12px', fontSize: '1rem', outline: 'none', marginBottom: '16px', color: '#f5fff8', background: 'rgba(6,30,20,0.38)' }} />
                  <label style={{ display: 'block', fontWeight: 600, color: '#ebfff4', marginBottom: '12px', fontSize: '0.9rem' }}>Neighborhood Type</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['urban','suburban','rural'].map(n => (
                      <button key={n} onClick={() => setProfile(p => ({ ...p, neighborhood_type: n }))}
                        style={{ flex: 1, padding: '12px 10px', border: `1px solid ${profile.neighborhood_type === n ? 'rgba(115,255,192,0.84)' : 'rgba(224,255,238,0.24)'}`,
                          background: profile.neighborhood_type === n ? 'linear-gradient(130deg, rgba(133,255,202,0.32), rgba(96,245,255,0.26))' : 'rgba(255,255,255,0.06)',
                          borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#ecfff5',
                          textTransform: 'capitalize', transition: 'all 0.22s ease' }}>
                        {n === 'urban' ? '🏙️' : n === 'suburban' ? '🏘️' : '🌿'}<br />{n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Commute ── */}
              {step === 2 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e9fff4' }}><Bike size={18} />Commute Options</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {COMMUTES.map(c => (
                      <button key={c.value} onClick={() => setProfile(p => ({ ...p, commute: c.value }))}
                        style={{ padding: '16px 12px', border: `1px solid ${profile.commute === c.value ? 'rgba(116,255,194,0.85)' : 'rgba(224,255,238,0.22)'}`,
                          background: profile.commute === c.value ? 'linear-gradient(130deg, rgba(133,255,202,0.32), rgba(96,245,255,0.26))' : 'rgba(255,255,255,0.06)',
                          borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', color: '#f1fff7' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{c.icon}</div>
                        <div style={{ fontWeight: 600 }}>{c.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Diet ── */}
              {step === 3 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e9fff4' }}><Leaf size={18} />Diet Profile</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {DIETS.map(d => (
                      <button key={d.value} onClick={() => setProfile(p => ({ ...p, diet: d.value }))}
                        style={{ padding: '15px 16px', border: `1px solid ${profile.diet === d.value ? 'rgba(116,255,194,0.85)' : 'rgba(224,255,238,0.22)'}`,
                          background: profile.diet === d.value ? 'linear-gradient(130deg, rgba(133,255,202,0.32), rgba(96,245,255,0.26))' : 'rgba(255,255,255,0.06)',
                          borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '1.8rem' }}>{d.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#f3fff8' }}>{d.label}</div>
                          <div style={{ color: 'rgba(224,255,237,0.76)', fontSize: '0.85rem' }}>{d.desc}</div>
                        </div>
                        {profile.diet === d.value && <div style={{ marginLeft: 'auto', color: '#dffff0', fontWeight: 700 }}>✓</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Energy ── */}
              {step === 4 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e9fff4' }}><Zap size={18} />Energy Source</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {ENERGIES.map(e => (
                      <button key={e.value} onClick={() => setProfile(p => ({ ...p, energy: e.value }))}
                        style={{ padding: '16px', border: `1px solid ${profile.energy === e.value ? 'rgba(116,255,194,0.85)' : 'rgba(224,255,238,0.22)'}`,
                          background: profile.energy === e.value ? 'linear-gradient(130deg, rgba(133,255,202,0.32), rgba(96,245,255,0.26))' : 'rgba(255,255,255,0.06)',
                          borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '2rem' }}>{e.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#f3fff8' }}>{e.label}</div>
                          <div style={{ color: 'rgba(224,255,237,0.76)', fontSize: '0.85rem' }}>{e.desc}</div>
                        </div>
                        {profile.energy === e.value && <div style={{ marginLeft: 'auto', color: '#dffff0', fontWeight: 700 }}>✓</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 5: Habits ── */}
              {step === 5 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e9fff4' }}><CheckSquare size={18} />Habit Selection</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {HABITS.map(h => (
                      <button key={h} onClick={() => toggleHabit(h)}
                        style={{ padding: '10px 14px', border: `1px solid ${profile.habits.includes(h) ? 'rgba(116,255,194,0.85)' : 'rgba(224,255,238,0.22)'}`,
                          background: profile.habits.includes(h) ? 'linear-gradient(130deg, rgba(133,255,202,0.32), rgba(96,245,255,0.26))' : 'rgba(255,255,255,0.06)',
                          borderRadius: '999px', cursor: 'pointer', fontWeight: 600, color: '#effff6',
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
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e9fff4' }}><Sprout size={18} />Account Access</div>
                  {[
                    !isLogin && { label: 'Full Name', value: name, set: setName, placeholder: 'Arjun Sharma', type: 'text' },
                    { label: 'Email', value: email, set: setEmail, placeholder: 'arjun@gmail.com', type: 'email' },
                    { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', type: 'password' },
                  ].filter(Boolean).map((f: any) => (
                    <div key={f.label} style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#ebfff4', marginBottom: '6px' }}>{f.label}</label>
                      <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} type={f.type}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(224,255,238,0.34)', borderRadius: '12px', fontSize: '1rem', color: '#f5fff8', background: 'rgba(6,30,20,0.38)' }} />
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button style={{ background: 'none', border: 'none', color: '#cbffe1', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setIsLogin(!isLogin)}>
                      {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                    </button>
                    {isLogin && (
                       <button style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: 'rgba(232,255,242,0.8)', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
                         onClick={() => { setEmail('arjun.sharma@demo.greencoin.io'); setPassword('greencoin123'); }}>
                         Use Demo Account
                       </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 7: Success ── */}
              {step === 7 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                    style={{ fontSize: '4rem', marginBottom: '16px' }}>🌿</motion.div>
                  <h2 style={{ fontFamily: 'Poppins,sans-serif', color: '#f4fff8', fontSize: '1.8rem', marginBottom: '8px' }}>You're all set!</h2>
                  <p style={{ color: 'rgba(224,255,237,0.76)', marginBottom: '24px' }}>Based on your lifestyle, you could earn:</p>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ background: 'linear-gradient(135deg, rgba(117,255,194,0.35), rgba(96,245,255,0.26))', border: '1px solid rgba(222,255,236,0.35)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Poppins,sans-serif' }}>
                      {projected ? `${projected.toFixed(0)}` : '~320'} credits
                    </div>
                    <div style={{ opacity: 0.8 }}>≈ ₹{projected ? (projected * 50).toLocaleString() : '16,000'}/month</div>
                  </motion.div>
                  <button className="btn-primary" style={{ width: '100%', padding: '16px', background: 'linear-gradient(130deg,#75ffc2,#62f6ff)', color: '#083727', boxShadow: '0 10px 26px rgba(130,255,200,0.35)' }}
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
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(224,255,238,0.5)', color: '#ecfff5' }}>
                  <ChevronLeft size={16}/> Back
                </button>
              )}
              {step < 6 ? (
                <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(130deg,#75ffc2,#62f6ff)', color: '#083727', boxShadow: '0 10px 26px rgba(130,255,200,0.35)' }}
                  onClick={() => setStep(s => s + 1)}>
                  Continue <ChevronRight size={16}/>
                </button>
              ) : (
                <button className="btn-primary" style={{ flex: 1, background: 'linear-gradient(130deg,#75ffc2,#62f6ff)', color: '#083727', boxShadow: '0 10px 26px rgba(130,255,200,0.35)' }}
                  onClick={handleFinish} disabled={loading || !email || !password || (!name && !isLogin)}>
                  {loading ? '⏳ Processing...' : isLogin ? '🔐 Sign In' : '🌱 Create Account'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
