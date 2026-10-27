// Opening hours from the CMS (`site_content.lokasi.hours_data`), e.g.
// [{ hari: 'Senin – Jumat', jam: '16:00 – 21:00', tutup: false }, ...]
// Days use JS numbering: 0 = Minggu … 6 = Sabtu. Times are minutes after midnight, WIB.

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAY_KEYS = DAY_NAMES.map(d => d.toLowerCase())

const dayIndex = (word) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return -1
  return DAY_KEYS.findIndex(k => k.startsWith(w.slice(0, 3)))
}

/** "Senin – Jumat", "Sabtu, Minggu", "Setiap hari" → Set of day indexes. */
export function parseDays(text = '') {
  const days = new Set()
  if (/setiap|tiap hari|everyday|daily/i.test(text)) return new Set([0, 1, 2, 3, 4, 5, 6])
  for (const part of text.split(/[,&/]|\bdan\b/i)) {
    const [from, to] = part.split(/\s*(?:–|—|-|s\.?\/d\.?|sampai|hingga)\s*/i).map(dayIndex)
    if (from < 0) continue
    if (to === undefined || to < 0) { days.add(from); continue }
    for (let d = from; ; d = (d + 1) % 7) { days.add(d); if (d === to) break }
  }
  return days
}

/** "16:00 – 21:00" or "16.00-21.00" → [960, 1260]; null when unreadable. */
export function parseRange(text = '') {
  const m = String(text).match(/(\d{1,2})[.:](\d{2})\s*(?:–|—|-|s\.?\/d\.?|sampai)\s*(\d{1,2})[.:](\d{2})/i)
  if (!m) return null
  const open = +m[1] * 60 + +m[2]
  let close = +m[3] * 60 + +m[4]
  // shortcut: hours past midnight are clamped to 24:00; split them into two rows in the CMS if ever needed.
  if (close <= open) close = 24 * 60
  return [open, close]
}

/** CMS rows → 7-slot week; later rows win, `tutup` closes the day. */
export function weekSchedule(rows = []) {
  const week = Array(7).fill(null)
  for (const row of rows) {
    const range = row?.tutup ? null : parseRange(row?.jam)
    for (const d of parseDays(row?.hari)) week[d] = row?.tutup ? null : range ?? week[d]
  }
  return week
}

export const fmt = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** Day + minutes in Asia/Jakarta, whatever the visitor's own timezone is. */
export function jakartaNow(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(p => [p.type, p.value]))
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  return { day, minutes: +parts.hour * 60 + +parts.minute }
}

/** { open, closesAt } while open, otherwise { open: false, next: 'hari ini 16:00' | 'besok 10:00' | 'Senin 16:00' }. */
export function openStatus(week, now = jakartaNow()) {
  const today = week[now.day]
  if (today && now.minutes >= today[0] && now.minutes < today[1]) return { open: true, closesAt: fmt(today[1]) }
  for (let ahead = 0; ahead < 8; ahead++) {
    const d = (now.day + ahead) % 7, range = week[d]
    if (!range || (ahead === 0 && now.minutes >= range[0])) continue
    const when = ahead === 0 ? 'hari ini' : ahead === 1 ? 'besok' : DAY_NAMES[d]
    return { open: false, next: `${when} ${fmt(range[0])}` }
  }
  return { open: false, next: null }
}

/** Bookable start times for a day; the last slot leaves `lengthMin` before closing. */
export function slotsFor(week, day, { step = 30, lengthMin = 30, after = -1 } = {}) {
  const range = week[day]
  if (!range) return []
  const slots = []
  for (let t = range[0]; t + lengthMin <= range[1]; t += step) if (t > after) slots.push(fmt(t))
  return slots
}

/** The next `count` calendar days in Jakarta: [{ day, offset, short, long }] — e.g. short "Sab 31", long "Sabtu, 31 Oktober". */
export function upcomingDays(count = 7, date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(date).map(x => [x.type, x.value]))
  return Array.from({ length: count }, (_, offset) => {
    const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + offset))
    const long = d.toLocaleDateString('id-ID', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
    return { day: d.getUTCDay(), offset, short: `${DAY_NAMES[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()}`, long }
  })
}
