import { createClient } from '@/lib/supabase/server'
import PenjualanClient from './PenjualanClient'

export const metadata = { title: 'Penjualan & Kas — Ikbar Dashboard' }

export default async function PenjualanPage() {
  const supabase = await createClient()

  // Fetch semua data paralel
  const [salesRes, cashRes, cashLogRes, hppRes] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })
      .limit(60),
    supabase
      .from('cash')
      .select('*')
      .limit(1)
      .single(),
    supabase
      .from('cash_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('hpp')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  return (
    <PenjualanClient
      initialSales={salesRes.data || []}
      initialCash={cashRes.data || { balance: 0 }}
      initialCashLog={cashLogRes.data || []}
      initialHpp={hppRes.data || []}
    />
  )
}
