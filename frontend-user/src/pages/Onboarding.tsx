import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { toast } from 'react-hot-toast';

type NeighborhoodType = 'urban' | 'suburban' | 'rural' | 'peri';
type CommuteType = 'cycling' | 'walking' | 'public_transport' | 'driving' | 'ev';
type DietType = 'vegan' | 'vegetarian' | 'flexitarian' | 'meat_heavy';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState<NeighborhoodType | null>(null);
  const [commute, setCommute] = useState<CommuteType | null>(null);
  const [diet, setDiet] = useState<DietType | null>(null);

  // Utilities
  const [hasSolar, setHasSolar] = useState(false);
  const [hasLed, setHasLed] = useState(false);
  const [hasSmartMeter, setHasSmartMeter] = useState(false);
  const [hasEvCharger, setHasEvCharger] = useState(false);

  // Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('individual');

  const handleNext = () => {
    if (step === 1 && (!city || !neighborhood)) {
      toast.error('Please specify your city and neighborhood type.');
      return;
    }
    if (step === 2 && !commute) {
      toast.error('Please select your primary commute type.');
      return;
    }
    if (step === 3 && !diet) {
      toast.error('Please select your primary diet type.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        full_name: fullName,
        email: email,
        password: password,
        user_type: userType,
        location: city,
        neighborhood_type: neighborhood || undefined,
        commute_type: commute || undefined,
        diet_type: diet || undefined,
        has_solar: hasSolar,
        has_led: hasLed,
        has_smart_meter: hasSmartMeter,
        has_ev_charger: hasEvCharger,
      });
      toast.success('Registration successful! Welcome to GreenCoin.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const neighborhoods = [
    { id: 'urban', icon: 'apartment', label: 'Urban' },
    { id: 'suburban', icon: 'home', label: 'Suburban' },
    { id: 'rural', icon: 'agriculture', label: 'Rural' },
    { id: 'peri', icon: 'nature_people', label: 'Peri-urban' },
  ] as const;

  const commutes = [
    { id: 'cycling', icon: 'directions_bike', label: 'Cycling' },
    { id: 'walking', icon: 'directions_walk', label: 'Walking' },
    { id: 'public_transport', icon: 'directions_bus', label: 'Public Transit' },
    { id: 'driving', icon: 'directions_car', label: 'Driving (Fuel)' },
    { id: 'ev', icon: 'electric_car', label: 'Driving (EV)' },
  ] as const;

  const diets = [
    { id: 'vegan', icon: 'eco', label: 'Vegan' },
    { id: 'vegetarian', icon: 'nutrition', label: 'Vegetarian' },
    { id: 'flexitarian', icon: 'restaurant_menu', label: 'Flexitarian' },
    { id: 'meat_heavy', icon: 'kebab_dining', label: 'Meat-heavy' },
  ] as const;

  const quotes = [
    '"Your journey to net zero begins with a single step."',
    '"Low-carbon commute routes are the pathways to our future."',
    '"Every meal is an opportunity to nourish yourself and the planet."',
    '"Smart utilities create smarter, cleaner energy networks."',
    '"Join GreenCoin today and start earning rewards for saving Earth."'
  ];

  return (
    <div className="gc-onboarding">
      {/* ── Left Panel ── */}
      <section className="gc-onboarding-left">
        <div className="gc-onboarding-left-grid" />
        <div className="gc-onboarding-glow" />

        {/* Logo */}
        <div className="gc-brand" style={{ position: 'relative', zIndex: 10 }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          GreenCoin
        </div>

        {/* Animation centerpiece */}
        <div className="gc-onboarding-visual">
          {/* Animated rings */}
          <div className="gc-ring gc-ring-1" />
          <div className="gc-ring gc-ring-2" />
          <div className="gc-ring gc-ring-3" />
          {/* Leaf icon center */}
          <div className="gc-ring-center">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--gc-primary)', fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
        </div>

        {/* Footer progress + quote */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Step indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 200 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gc-primary)', boxShadow: '0 0 8px rgba(98,223,125,0.6)', flexShrink: 0 }} />
              {[2, 3, 4, 5].map((i) => (
                <React.Fragment key={i}>
                  <div style={{ flex: 1, height: 1, background: step >= i ? 'var(--gc-primary)' : 'rgba(62,74,61,0.5)' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: step >= i ? 'var(--gc-primary)' : 'var(--gc-surface-variant)', flexShrink: 0 }} />
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 200, fontFamily: 'Space Grotesk', fontSize: 12 }}>
              <span className="gc-text-primary">Step {step}</span>
              <span className="gc-text-muted">Step 5</span>
            </div>
          </div>
          {/* Quote */}
          <blockquote className="gc-h3" style={{ maxWidth: 320, lineHeight: 1.4, height: 80, transition: 'all 0.3s ease' }}>
            {quotes[step - 1]}
          </blockquote>
        </div>
      </section>

      {/* ── Right Panel ── */}
      <section className="gc-onboarding-right" style={{ overflowY: 'auto', padding: '60px 40px' }}>
        <div style={{ width: '100%', maxWidth: 480, margin: 'auto' }}>
          
          {step === 1 && (
            <div>
              <h1 className="gc-h2" style={{ color: 'var(--gc-inverse-on-surface)', marginBottom: 32 }}>
                Where are you based?
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* City Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label htmlFor="city" className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>CITY</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gc-outline)' }}>location_city</span>
                    <input
                      id="city"
                      type="text"
                      placeholder="e.g. San Francisco, CA"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="gc-input"
                      style={{ paddingLeft: 48 }}
                    />
                  </div>
                </div>

                {/* Neighborhood Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>NEIGHBORHOOD TYPE</label>
                  <div className="gc-neighborhood-grid">
                    {neighborhoods.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={`gc-neighborhood-card${neighborhood === n.id ? ' gc-neighborhood-card--active' : ''}`}
                        onClick={() => setNeighborhood(n.id as NeighborhoodType)}
                      >
                        <div className={`gc-neighborhood-icon${neighborhood === n.id ? ' gc-neighborhood-icon--active' : ''}`}>
                          <span className="material-symbols-outlined">{n.icon}</span>
                        </div>
                        <span className={neighborhood === n.id ? 'gc-text-primary' : ''} style={{ fontFamily: 'Space Grotesk', fontSize: 16, color: neighborhood === n.id ? 'var(--gc-primary)' : 'var(--gc-on-surface)' }}>
                          {n.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next */}
                <button onClick={handleNext} className="gc-btn-primary" style={{ justifyContent: 'center', padding: '16px 24px', width: '100%' }}>
                  Continue
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="gc-h2" style={{ color: 'var(--gc-inverse-on-surface)', marginBottom: 32 }}>
                How do you commute?
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Commute Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>COMMUTE METHOD</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {commutes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`gc-neighborhood-card${commute === c.id ? ' gc-neighborhood-card--active' : ''}`}
                        style={{ flexDirection: 'row', gap: 16, justifyContent: 'flex-start', padding: '16px 24px', width: '100%', textAlign: 'left' }}
                        onClick={() => setCommute(c.id as CommuteType)}
                      >
                        <div className={`gc-neighborhood-icon${commute === c.id ? ' gc-neighborhood-icon--active' : ''}`}>
                          <span className="material-symbols-outlined">{c.icon}</span>
                        </div>
                        <span style={{ fontFamily: 'Space Grotesk', fontSize: 16, color: commute === c.id ? 'var(--gc-primary)' : 'var(--gc-on-surface)' }}>
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={handleBack} className="gc-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '16px 24px' }}>
                    Back
                  </button>
                  <button onClick={handleNext} className="gc-btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '16px 24px' }}>
                    Continue
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="gc-h2" style={{ color: 'var(--gc-inverse-on-surface)', marginBottom: 32 }}>
                What is your diet?
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Diet Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>DIET PROFILE</label>
                  <div className="gc-neighborhood-grid">
                    {diets.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`gc-neighborhood-card${diet === d.id ? ' gc-neighborhood-card--active' : ''}`}
                        onClick={() => setDiet(d.id as DietType)}
                      >
                        <div className={`gc-neighborhood-icon${diet === d.id ? ' gc-neighborhood-icon--active' : ''}`}>
                          <span className="material-symbols-outlined">{d.icon}</span>
                        </div>
                        <span className={diet === d.id ? 'gc-text-primary' : ''} style={{ fontFamily: 'Space Grotesk', fontSize: 16, color: diet === d.id ? 'var(--gc-primary)' : 'var(--gc-on-surface)' }}>
                          {d.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={handleBack} className="gc-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '16px 24px' }}>
                    Back
                  </button>
                  <button onClick={handleNext} className="gc-btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '16px 24px' }}>
                    Continue
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="gc-h2" style={{ color: 'var(--gc-inverse-on-surface)', marginBottom: 32 }}>
                Home Utilities
              </h1>
              <p className="gc-text-muted" style={{ marginBottom: 24 }}>
                Select the sustainable features already active in your home.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Utilities Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Rooftop Solar', checked: hasSolar, onChange: setHasSolar, desc: 'Generates green energy' },
                    { label: 'LED Lighting', checked: hasLed, onChange: setHasLed, desc: 'Optimizes power consumption' },
                    { label: 'Smart Meter', checked: hasSmartMeter, onChange: setHasSmartMeter, desc: 'Monitors real-time usage' },
                    { label: 'EV Charger', checked: hasEvCharger, onChange: setHasEvCharger, desc: 'Level 2 home electric vehicle charger' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => item.onChange(!item.checked)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: 'var(--gc-surface-container)',
                        border: item.checked ? '1px solid var(--gc-primary)' : '1px solid var(--gc-outline-variant)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--gc-on-surface)' }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--gc-outline)' }}>{item.desc}</div>
                      </div>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '6px',
                          border: '2px solid',
                          borderColor: item.checked ? 'var(--gc-primary)' : 'var(--gc-outline)',
                          background: item.checked ? 'var(--gc-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {item.checked && (
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--gc-on-primary)', fontWeight: 'bold' }}>check</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={handleBack} className="gc-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '16px 24px' }}>
                    Back
                  </button>
                  <button onClick={handleNext} className="gc-btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '16px 24px' }}>
                    Continue
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 className="gc-h2" style={{ color: 'var(--gc-inverse-on-surface)', marginBottom: 32 }}>
                Create Account
              </h1>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label htmlFor="fullName" className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>FULL NAME</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gc-outline)' }}>person</span>
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="e.g. Athul Titus"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="gc-input"
                      style={{ paddingLeft: 48 }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label htmlFor="email" className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gc-outline)' }}>mail</span>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="gc-input"
                      style={{ paddingLeft: 48 }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label htmlFor="password" className="gc-label-muted" style={{ color: 'rgba(44,50,46,0.8)', letterSpacing: '0.05em' }}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gc-outline)' }}>lock</span>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="gc-input"
                      style={{ paddingLeft: 48 }}
                    />
                  </div>
                </div>

                {/* User Type Choice */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setUserType('individual')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      background: userType === 'individual' ? 'rgba(98,223,125,0.1)' : 'transparent',
                      border: userType === 'individual' ? '1px solid var(--gc-primary)' : '1px solid var(--gc-outline-variant)',
                      fontFamily: 'Space Grotesk',
                      fontWeight: 600,
                      color: userType === 'individual' ? 'var(--gc-primary)' : 'var(--gc-outline)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('corporate')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      background: userType === 'corporate' ? 'rgba(98,223,125,0.1)' : 'transparent',
                      border: userType === 'corporate' ? '1px solid var(--gc-primary)' : '1px solid var(--gc-outline-variant)',
                      fontFamily: 'Space Grotesk',
                      fontWeight: 600,
                      color: userType === 'corporate' ? 'var(--gc-primary)' : 'var(--gc-outline)',
                      cursor: 'pointer',
                      transition: 'all 0.2,',
                    }}
                  >
                    Corporate
                  </button>
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                  <button type="button" onClick={handleBack} className="gc-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '16px 24px' }}>
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="gc-btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '16px 24px' }}>
                    {loading ? 'Creating...' : 'Register'}
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default Onboarding;
