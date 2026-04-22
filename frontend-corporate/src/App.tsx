import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ShoppingBag, FileText, BarChart2, Building } from 'lucide-react'
import './index.css'

import Browse from './pages/Browse'
import Certificate from './pages/Certificate'
import ESGReport from './pages/ESGReport'

function CorpSidebar() {
  const user = JSON.parse(localStorage.getItem('gc_corp_user') || '{}')
  return (
    <div className="corp-sidebar">
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '1.8rem' }}>🌱</span>
          <div>
            <div style={{ color: 'white', fontFamily: 'Poppins,sans-serif', fontWeight: 700 }}>GreenCoin</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Corporate Portal</div>
          </div>
        </div>
        {user.company_name && (
          <div style={{ background: 'rgba(82,183,136,0.15)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Logged in as</div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{user.company_name}</div>
          </div>
        )}
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {[
          { to: '/browse',  label: 'Browse Credits', icon: ShoppingBag },
          { to: '/report',  label: 'ESG Report',     icon: BarChart2 },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `c-nav-item${isActive ? ' active' : ''}`}>
            <Icon size={17}/>{label}
          </NavLink>
        ))}
      </nav>
      {/* Demo Banner */}
      <div style={{ padding: '16px', margin: '12px', background: 'rgba(82,183,136,0.2)', borderRadius: '10px' }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', lineHeight: 1.5 }}>
          🚀 <strong>Demo Mode</strong> — All purchases use simulated data. No real payments.
        </p>
      </div>
    </div>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CorpSidebar />
      <div className="corp-main">{children}</div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Inter,sans-serif', borderRadius: '10px' }
      }}/>
      <Routes>
        <Route path="/" element={<Navigate to="/browse"/>}/>
        <Route path="/browse" element={<AppLayout><Browse/></AppLayout>}/>
        <Route path="/certificate/:id" element={<AppLayout><Certificate/></AppLayout>}/>
        <Route path="/report" element={<AppLayout><ESGReport/></AppLayout>}/>
        <Route path="*" element={<Navigate to="/browse"/>}/>
      </Routes>
    </BrowserRouter>
  )
}
