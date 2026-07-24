'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function IconLogOut({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="sidebar-link"
      style={{ width: '100%', justifyContent: 'flex-start' }}
      id="btn-logout"
      aria-label="Keluar dari dashboard"
    >
      <span className="sidebar-link-icon">
        <IconLogOut size={15} />
      </span>
      Keluar
    </button>
  )
}
