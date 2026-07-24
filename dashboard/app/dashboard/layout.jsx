import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }) {
  // Verify session on server side (double-check beyond middleware)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="dashboard-shell">
      <Sidebar userEmail={user.email} />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
