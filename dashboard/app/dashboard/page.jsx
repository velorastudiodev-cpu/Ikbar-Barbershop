import { createClient } from '@/lib/supabase/server'
import ChartPanel from '@/components/ChartPanel'


// ─── Icons ──────────────────────────────────────────────────────────
function IconTrendingUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
function IconDollarSign({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
function IconUsers({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconPackage({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}
function IconWallet({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V22H4V12" />
      <path d="M22 7H2v5h20V7z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}
function IconInfo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ─── Format currency IDR ─────────────────────────────────────────────
function formatIDR(amount) {
  if (amount === null || amount === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Get current month range ─────────────────────────────────────────
function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split('T')[0]
  return { start, end }
}

// ─── Dashboard Ringkasan Page ────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const { start, end } = getCurrentMonthRange()

  // Fetch data bulan ini + 6 bulan terakhir + HPP secara paralel
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const chartStart = sixMonthsAgo.toISOString().split('T')[0]

  const [salesResult, cashResult, hppResult, chartSalesResult] = await Promise.all([
    supabase
      .from('sales')
      .select('total_trx, total_omzet')
      .gte('date', start)
      .lte('date', end),
    supabase
      .from('cash')
      .select('balance')
      .limit(1)
      .single(),
    supabase
      .from('hpp')
      .select('cost'),
    supabase
      .from('sales')
      .select('date, total_trx, total_omzet')
      .gte('date', chartStart)
      .order('date', { ascending: true }),
  ])

  // Hitung ringkasan bulan ini
  const sales = salesResult.data || []
  const totalOmzet = sales.reduce((sum, s) => sum + Number(s.total_omzet || 0), 0)
  const totalTrx = sales.reduce((sum, s) => sum + Number(s.total_trx || 0), 0)
  const saldoKas = cashResult.data?.balance ?? 0
  const hppItems = hppResult.data || []
  const hppCount = hppItems.length

  // Estimasi margin: omzet bulan ini - (rata² HPP × total transaksi)
  const totalHppPerTrx = hppItems.reduce((sum, h) => sum + Number(h.cost || 0), 0)
  const estimasiMargin = totalOmzet - (totalHppPerTrx * totalTrx)

  // ─── Data 6 Bulan untuk Grafik ───────────────────────────────────────
  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const monthlyMap = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = { label: BULAN[d.getMonth()], omzet: 0, trx: 0, margin: 0 }
  }
  for (const row of (chartSalesResult.data || [])) {
    const key = row.date.substring(0, 7)
    if (monthlyMap[key]) {
      monthlyMap[key].omzet += Number(row.total_omzet || 0)
      monthlyMap[key].trx   += Number(row.total_trx   || 0)
    }
  }
  const monthlyData = Object.values(monthlyMap).map(m => ({
    ...m,
    margin: m.omzet - totalHppPerTrx * m.trx,
  }))

  const bulanIni = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const hasData = sales.length > 0

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <span className="dashboard-breadcrumb">Dashboard</span>
          <span className="dashboard-page-title">Ringkasan</span>
        </div>
        <div className="dashboard-header-right">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bulanIni}</span>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Page Title */}
        <div className="page-header">
          <h1>Selamat datang, Ikbar 👋</h1>
          <p>Ringkasan data operasional bulan {bulanIni}</p>
        </div>

        {/* Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card-label">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasData ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
              Omzet Bulan Ini
            </div>
            <div className="stat-card-icon"><IconTrendingUp size={16} /></div>
            <div className="stat-card-value">{formatIDR(totalOmzet)}</div>
            <div className="stat-card-sub">{hasData ? `dari ${sales.length} hari tercatat` : 'Belum ada data'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasData ? 'var(--info)' : 'var(--text-muted)', display: 'inline-block' }} />
              Total Transaksi
            </div>
            <div className="stat-card-icon"><IconUsers size={16} /></div>
            <div className="stat-card-value">{totalTrx}</div>
            <div className="stat-card-sub">pelanggan bulan ini</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: saldoKas > 0 ? 'var(--warning)' : 'var(--text-muted)', display: 'inline-block' }} />
              Saldo Kas
            </div>
            <div className="stat-card-icon"><IconWallet size={16} /></div>
            <div className="stat-card-value">{formatIDR(saldoKas)}</div>
            <div className="stat-card-sub">saldo kas terkini</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hppCount > 0 ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
              Item HPP
            </div>
            <div className="stat-card-icon"><IconPackage size={16} /></div>
            <div className="stat-card-value">{hppCount}</div>
            <div className="stat-card-sub">item tercatat</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasData && hppCount > 0 ? (estimasiMargin >= 0 ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)', display: 'inline-block' }} />
              Est. Margin Bulan Ini
            </div>
            <div className="stat-card-icon"><IconDollarSign size={16} /></div>
            <div className="stat-card-value" style={{ color: !hasData || hppCount === 0 ? undefined : estimasiMargin >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {hasData && hppCount > 0 ? formatIDR(estimasiMargin) : '—'}
            </div>
            <div className="stat-card-sub">
              {!hasData ? 'Belum ada data penjualan' : hppCount === 0 ? 'Isi data HPP dulu' : `omzet − HPP × ${totalTrx} trx`}
            </div>
          </div>
        </div>

        {/* Grafik 6 Bulan */}
        <ChartPanel monthlyData={monthlyData} />

      </div>
    </>
  )
}
