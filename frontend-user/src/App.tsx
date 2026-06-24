import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// ── Global styles ──────────────────────────────────────────────────────────
import './index.css'
import './styles/app.css'

// ── Pages ─────────────────────────────────────────────────────────────────
import Landing    from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Dashboard  from './pages/Dashboard'
import LogAction  from './pages/LogAction'
import WalletPage from './pages/Wallet'
import Advisor    from './pages/Advisor'

// ── Auth guard ─────────────────────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('greencoin_token')
  return token ? <>{children}</> : <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Space Grotesk, sans-serif',
            borderRadius: '12px',
            background: '#1c211d',
            color: '#dfe4de',
            border: '1px solid rgba(62,74,61,0.5)',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"            element={<Landing />} />
        <Route path="/onboarding"  element={<Onboarding />} />

        {/* Protected — pages have their own nav bar from Stitch design */}
        <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/log-action"  element={<PrivateRoute><LogAction /></PrivateRoute>} />
        <Route path="/log"         element={<Navigate to="/log-action" replace />} />
        <Route path="/wallet"      element={<PrivateRoute><WalletPage /></PrivateRoute>} />
        <Route path="/advisor"     element={<PrivateRoute><Advisor /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}
