import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LayoutDashboard, PlusCircle, Wallet, Lightbulb, LogOut, Menu, X } from 'lucide-react'
import './index.css'

import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import LogAction from './pages/LogAction'
import WalletPage from './pages/Wallet'
import Advisor from './pages/Advisor'
import Landing from './pages/Landing'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('gc_token')
  return token ? <>{children}</> : <Navigate to="/onboarding" replace />
}

function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const logout = () => {
    localStorage.removeItem('gc_token')
    localStorage.removeItem('gc_user')
    window.location.href = '/onboarding'
  }

  const user = JSON.parse(localStorage.getItem('gc_user') || '{}')

  return (
    <>
      {/* Backdrop on mobile */}
      {open && <div onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }} />}

      <div className={`sidebar${open ? ' open' : ''}`} style={{ zIndex: 100 }}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🌱</span>
            <div>
              <div style={{ color: 'white', fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>GreenCoin</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Carbon Credit Marketplace</div>
            </div>
          </div>
          {user.full_name && (
            <div style={{ marginTop: '16px', padding: '10px 12px', background: 'rgba(82,183,136,0.15)', borderRadius: '10px' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Logged in as</div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{user.full_name}</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {[
            { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
            { to: '/log',       label: 'Log Action',  icon: PlusCircle },
            { to: '/wallet',    label: 'Wallet',      icon: Wallet },
            { to: '/advisor',   label: 'AI Advisor',  icon: Lightbulb },
          ].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 12px 24px' }}>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '12px 14px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-content">
        {/* Mobile header */}
        <div style={{ display: 'none', alignItems: 'center', gap: '12px', marginBottom: '20px' }}
          className="mobile-header">
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Menu size={24} color="#1a472a" />
          </button>
          <span style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, color: '#1a472a' }}>🌱 GreenCoin</span>
        </div>
        {children}
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Inter,sans-serif', borderRadius: '10px', border: '1px solid #b7e4c7' }
      }} />
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
        <Route path="/log" element={<PrivateRoute><AppLayout><LogAction /></AppLayout></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><AppLayout><WalletPage /></AppLayout></PrivateRoute>} />
        <Route path="/advisor" element={<PrivateRoute><AppLayout><Advisor /></AppLayout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}
