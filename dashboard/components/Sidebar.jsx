'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'
import { Icon } from './ui'
import { SITE_URL } from '@/lib/format'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Ringkasan', short: 'Beranda', icon: 'home', hint: 'Angka bulan ini' },
  { href: '/dashboard/penjualan', label: 'Penjualan & Kas', short: 'Penjualan', icon: 'trend', hint: 'Catat harian, kas, modal' },
  { href: '/dashboard/website', label: 'Kelola Website', short: 'Website', icon: 'globe', hint: 'Galeri, harga, jam buka' },
]

function Logo({ size = 'md' }) {
  // The client's own logo file, shown as-is.
  return <Image className={`brand-logo brand-logo-${size}`} src="/logo-dinasti.png" alt="Dinasti Barbershop" width={290} height={233} priority />
}

export default function Sidebar({ userEmail }) {
  const pathname = usePathname()
  const isActive = (href) => (href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar" aria-label="Navigasi dashboard">
        <Link href="/dashboard" className="sidebar-logo">
          <Logo />
          <span className="sidebar-logo-sub">Dashboard admin</span>
        </Link>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}>
              <span className="sidebar-link-icon"><Icon name={item.icon} size={18} /></span>
              <span><b>{item.label}</b><small>{item.hint}</small></span>
            </Link>
          ))}
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="sidebar-link sidebar-link-ext">
            <span className="sidebar-link-icon"><Icon name="external" size={18} /></span>
            <span><b>Lihat Website</b><small>Buka di tab baru</small></span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">{(userEmail || 'D').charAt(0).toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userEmail || 'Admin'}</div>
              <div className="sidebar-user-role">Admin</div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Phone: slim top bar + bottom tab bar, always one tap away */}
      <header className="mobile-topbar">
        <Link href="/dashboard" aria-label="Ringkasan"><Logo size="sm" /></Link>
        <div className="mobile-topbar-actions">
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Lihat website"><Icon name="external" size={18} /></a>
          <LogoutButton compact />
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Navigasi dashboard">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}>
            <Icon name={item.icon} size={21} />
            <span>{item.short}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
