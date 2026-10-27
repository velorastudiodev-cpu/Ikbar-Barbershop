// Small formatting helpers shared by the dashboard screens. Pure functions, covered by tests/format.test.mjs.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ikbar-barbershop.vercel.app'
const TZ = 'Asia/Jakarta'

export function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

/** "200000" → "200.000" (for money inputs). */
export const groupDigits = (digits) => (digits ? Number(digits).toLocaleString('id-ID') : '')

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', opts)
}

export function formatDateTime(ts) {
  return new Date(ts).toLocaleString('id-ID', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Today's date in Jakarta as YYYY-MM-DD; `toISOString()` would give yesterday before 07:00 WIB. */
export function todayJakarta(offsetDays = 0, now = new Date()) {
  return new Date(now.getTime() + offsetDays * 864e5).toLocaleDateString('en-CA', { timeZone: TZ })
}

export function jakartaHour(now = new Date()) {
  return Number(now.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }))
}

export function greeting(hour) {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

/** First and last day of the month containing `isoDate`. */
export function monthRange(isoDate) {
  const [y, m] = isoDate.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const mm = String(m).padStart(2, '0')
  return { start: `${y}-${mm}-01`, end: `${y}-${mm}-${last}` }
}

/** "0831-1007 1825", "+62 831…", "831…" → "6283110071825". */
export function normalizeWa(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('8')) return '62' + digits
  return digits
}

/** "@dinasti", "instagram.com/dinasti/" → "dinasti". */
export function normalizeIg(value) {
  const v = String(value || '').trim()
  const fromUrl = v.match(/instagram\.com\/([^/?#]+)/i)
  return (fromUrl ? fromUrl[1] : v).replace(/^@/, '').trim()
}

/** "16:00 – 21:00" or "16.00-21.00" → ["16:00", "21:00"]; null when it can't be read. */
export function parseJam(text) {
  const m = String(text || '').match(/(\d{1,2})[.:](\d{2})\s*(?:–|—|-|s\.?\/d\.?|sampai)\s*(\d{1,2})[.:](\d{2})/i)
  return m ? [`${m[1].padStart(2, '0')}:${m[2]}`, `${m[3].padStart(2, '0')}:${m[4]}`] : null
}

export const joinJam = (open, close) => `${open} – ${close}`

/** Cost per haircut used for the margin estimate: average of "Layanan" HPP items (all items if none). */
export function averageCost(hppItems) {
  const services = hppItems.filter((h) => h.category === 'Layanan')
  const pool = services.length ? services : hppItems
  return pool.length ? pool.reduce((sum, h) => sum + Number(h.cost || 0), 0) / pool.length : 0
}
