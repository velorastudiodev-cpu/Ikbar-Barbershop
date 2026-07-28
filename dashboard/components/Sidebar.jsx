'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import LogoutButton from './LogoutButton'

// ─── Icons ───────────────────────────────────────────────────────────
function IconHome({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconTrendingUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function IconGlobe({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function IconMenu({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconX({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Nav Items ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Utama',
    items: [
      { href: '/dashboard', label: 'Ringkasan', icon: <IconHome size={15} /> },
    ],
  },
  {
    label: 'Data Operasional',
    items: [
      {
        href: '/dashboard/penjualan',
        label: 'Penjualan & Kas',
        icon: <IconTrendingUp size={15} />,
      },
    ],
  },
  {
    label: 'Website',
    items: [
      {
        href: '/dashboard/website',
        label: 'Kelola Website',
        icon: <IconGlobe size={15} />,
      },
    ],
  },
]

// ─── Sidebar Component ───────────────────────────────────────────────
export default function Sidebar({ userEmail }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Tutup sidebar saat navigasi (mobile)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Cegah scroll body saat sidebar mobile terbuka
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Initial avatar dari email
  const initials = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : 'I'

  // Cek active: exact match untuk /dashboard, prefix match untuk subroute
  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Mobile Top Bar ── */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <div className="sidebar-logo-mark" style={{ width: 28, height: 28 }}>
            <span style={{ fontSize: 11 }}>IB</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Ikbar Barbershop</span>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
        >
          {open ? <IconX size={20} /> : <IconMenu size={20} />}
        </button>
      </div>

      {/* ── Overlay backdrop ── */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar${open ? ' open' : ''}`}
        role="navigation"
        aria-label="Navigasi dashboard"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <span>IB</span>
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Ikbar Barbershop</span>
            <span className="sidebar-logo-sub">Dashboard</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && (
                    <span className="sidebar-link-badge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userEmail || 'Ikbar'}</div>
              <div className="sidebar-user-role">Admin</div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
