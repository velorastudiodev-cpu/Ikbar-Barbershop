'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from './ui'

export default function LogoutButton({ compact = false }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (compact) {
    return (
      <button onClick={handleLogout} className="icon-btn" aria-label="Keluar dari dashboard">
        <Icon name="logout" size={18} />
      </button>
    )
  }

  return (
    <button onClick={handleLogout} className="sidebar-link sidebar-logout" id="btn-logout" aria-label="Keluar dari dashboard">
      <span className="sidebar-link-icon"><Icon name="logout" size={18} /></span>
      <span><b>Keluar</b></span>
    </button>
  )
}
