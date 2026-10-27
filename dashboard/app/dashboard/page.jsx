import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChartPanel from '@/components/ChartPanel'
import { Icon, PageHeader } from '@/components/ui'
import { averageCost, formatIDR, greeting, jakartaHour, monthRange, SITE_URL, todayJakarta } from '@/lib/format'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const QUICK_ACTIONS = [
  { href: '/dashboard/penjualan?tab=penjualan', icon: 'plus', title: 'Catat penjualan', desc: 'Jumlah pelanggan & omzet hari ini' },
  { href: '/dashboard/penjualan?tab=kas', icon: 'wallet', title: 'Uang masuk / keluar', desc: 'Update saldo kas' },
  { href: '/dashboard/website?tab=galeri', icon: 'image', title: 'Tambah foto galeri', desc: 'Hasil cukur terbaru' },
  { href: '/dashboard/website?tab=layanan', icon: 'scissors', title: 'Ubah harga layanan', desc: 'Daftar harga di website' },
  { href: '/dashboard/website?tab=jam', icon: 'clock', title: 'Ubah jam buka', desc: 'Libur atau jam khusus' },
]

function StatCard({ icon, label, value, sub, tone }) {
  return (
    <div className="stat-card">
      <div className="stat-card-head">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-icon"><Icon name={icon} size={16} /></span>
      </div>
      <div className={`stat-card-value${tone ? ` tone-${tone}` : ''}`}>{value}</div>
      <div className="stat-card-sub">{sub}</div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = todayJakarta()
  const { start, end } = monthRange(today)
  const [y, m] = today.split('-').map(Number)
  const chartStart = `${new Date(Date.UTC(y, m - 6, 1)).toISOString().slice(0, 7)}-01`

  const [salesResult, cashResult, hppResult, chartSalesResult] = await Promise.all([
    supabase.from('sales').select('date, total_trx, total_omzet').gte('date', start).lte('date', end),
    supabase.from('cash').select('balance').limit(1).single(),
    supabase.from('hpp').select('cost, category'),
    supabase.from('sales').select('date, total_trx, total_omzet').gte('date', chartStart).order('date', { ascending: true }),
  ])

  const sales = salesResult.data || []
  const totalOmzet = sales.reduce((sum, s) => sum + Number(s.total_omzet || 0), 0)
  const totalTrx = sales.reduce((sum, s) => sum + Number(s.total_trx || 0), 0)
  const todaySales = sales.filter((s) => s.date === today)
  const todayTrx = todaySales.reduce((sum, s) => sum + Number(s.total_trx || 0), 0)
  const todayOmzet = todaySales.reduce((sum, s) => sum + Number(s.total_omzet || 0), 0)
  const saldoKas = cashResult.data?.balance ?? 0
  const hppItems = hppResult.data || []
  const costPerTrx = averageCost(hppItems)
  const estimasiMargin = totalOmzet - costPerTrx * totalTrx
  const hasData = sales.length > 0

  // Last 6 months for the chart
  const monthlyMap = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    monthlyMap[d.toISOString().slice(0, 7)] = { label: BULAN[d.getUTCMonth()], omzet: 0, trx: 0 }
  }
  for (const row of chartSalesResult.data || []) {
    const bucket = monthlyMap[row.date.substring(0, 7)]
    if (bucket) { bucket.omzet += Number(row.total_omzet || 0); bucket.trx += Number(row.total_trx || 0) }
  }
  const monthlyData = Object.values(monthlyMap).map((mo) => ({ ...mo, margin: mo.omzet - costPerTrx * mo.trx }))

  const bulanIni = new Date(`${today}T12:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const hariIni = new Date(`${today}T12:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <PageHeader section="Dashboard" title="Ringkasan">
        <span className="header-date">{hariIni}</span>
      </PageHeader>

      <div className="dashboard-content">
        <div className="page-header">
          <h1>{greeting(jakartaHour())}, Ikbar</h1>
          <p>Ini ringkasan Dinasti Barbershop bulan {bulanIni}.</p>
        </div>

        {/* The one daily job, front and centre */}
        {todaySales.length ? (
          <div className="today-card is-done">
            <span className="today-icon"><Icon name="check" size={20} strokeWidth={2.4} /></span>
            <div>
              <b>Penjualan hari ini sudah dicatat</b>
              <p>{todayTrx} pelanggan · {formatIDR(todayOmzet)}</p>
            </div>
            <Link href="/dashboard/penjualan?tab=penjualan" className="btn btn-ghost">Lihat / ubah</Link>
          </div>
        ) : (
          <div className="today-card">
            <span className="today-icon"><Icon name="calendar" size={20} /></span>
            <div>
              <b>Penjualan hari ini belum dicatat</b>
              <p>Cukup isi jumlah pelanggan dan total uang yang masuk. Kurang dari 1 menit.</p>
            </div>
            <Link href="/dashboard/penjualan?tab=penjualan" className="btn btn-primary"><Icon name="plus" size={16} /> Catat sekarang</Link>
          </div>
        )}

        <div className="stat-grid">
          <StatCard icon="trend" label="Omzet bulan ini" value={formatIDR(totalOmzet)} sub={hasData ? `dari ${sales.length} hari tercatat` : 'Belum ada data'} />
          <StatCard icon="users" label="Pelanggan bulan ini" value={totalTrx} sub={hasData ? `rata-rata ${Math.round(totalTrx / sales.length)} per hari` : 'Belum ada data'} />
          <StatCard icon="wallet" label="Saldo kas" value={formatIDR(saldoKas)} sub="uang yang dipegang sekarang" />
          <StatCard icon="coins" label="Perkiraan untung" tone={hasData && hppItems.length ? (estimasiMargin >= 0 ? 'good' : 'bad') : undefined}
            value={hasData && hppItems.length ? formatIDR(estimasiMargin) : '—'}
            sub={!hasData ? 'Belum ada data penjualan' : !hppItems.length ? 'Isi modal (HPP) dulu' : `omzet − modal ${formatIDR(costPerTrx)} × ${totalTrx} pelanggan`} />
        </div>

        <div className="home-grid">
          <ChartPanel monthlyData={monthlyData} />
          <div className="panel home-quick">
            <div className="panel-header"><div className="panel-title">Aksi cepat</div></div>
            <div className="quick-list">
              {QUICK_ACTIONS.map((a) => (
                <Link key={a.href} href={a.href} className="quick-item">
                  <span className="quick-icon"><Icon name={a.icon} size={18} /></span>
                  <span><b>{a.title}</b><small>{a.desc}</small></span>
                  <Icon name="arrow" size={16} />
                </Link>
              ))}
              <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="quick-item">
                <span className="quick-icon"><Icon name="globe" size={18} /></span>
                <span><b>Lihat website</b><small>Cek hasil perubahan</small></span>
                <Icon name="external" size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
