import { useEffect, useMemo, useState } from 'react'
import { jakartaNow, openStatus, weekSchedule } from '../lib/hours.js'
import { useSite } from '../site.js'

const paths = {
  wa: <><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" /><path d="M9 8.6c.2-.5.6-.6 1-.6.3 0 .5.4.7.9l.4 1c.1.3 0 .6-.2.8l-.4.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.4c.2-.2.5-.3.8-.2l1 .4c.5.2.9.4.9.7 0 .4-.1.8-.6 1.1-.6.4-1.4.6-2.2.3-2.3-.8-4.1-2.6-4.9-4.9-.3-.8-.1-1.6.2-2.4z" /></>,
  ig: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  pin: <><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  phone: <path d="M6.6 3.5 9 3l1.7 4.2-2 1.4a11 11 0 0 0 6.7 6.7l1.4-2L21 15l-.5 2.4A2.5 2.5 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6 2.5 2.5 0 0 1 6.6 3.5z" />,
  play: <path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chev: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  scissors: <><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><path d="M8 8.5 20 17M8 15.5 20 7" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  crown: <path d="M3 18 4.5 7l5 5L12 4l2.5 8 5-5L21 18z" />,
  blade: <><path d="M4 20 18 6l2 2L6 22z" /><path d="M14 4l6 6" /></>,
  sofa: <><path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" /><path d="M2 12a2 2 0 0 1 4 0v3h12v-3a2 2 0 0 1 4 0v6H2z" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
}

export function Icon({ name, size = 20, className = '' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
  )
}

/** Adds `.in` to [data-reveal] elements as they scroll into view. Mounted once. */
export function useRevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return
      e.target.classList.add('in')
      io.unobserve(e.target)
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    const watch = () => document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => io.observe(el))
    watch()
    // CMS content can add elements after the first render.
    const mo = new MutationObserver(watch)
    mo.observe(document.getElementById('root'), { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [])
}

/** Jakarta clock, ticking each minute. null during prerender so build-time HTML never claims a status. */
export function useNow() {
  const [now, setNow] = useState(null)
  useEffect(() => {
    const tick = () => setNow({ ...jakartaNow(), date: new Date() })
    tick()
    const t = setInterval(tick, 60_000)
    return () => clearInterval(t)
  }, [])
  return now
}

export function useSchedule() {
  const { hours } = useSite()
  return useMemo(() => weekSchedule(hours), [hours])
}

/** "Buka · sampai 21:00" / "Tutup · buka besok 10:00" pill driven by the CMS hours. */
export function OpenStatus({ className = '' }) {
  const now = useNow(), week = useSchedule()
  if (!now) return <span className={`status ${className}`} aria-hidden="true">&nbsp;</span>
  const s = openStatus(week, now)
  return (
    <span className={`status ${s.open ? 'is-open' : 'is-closed'} ${className}`}>
      <i aria-hidden="true" />
      {s.open ? <>Buka sekarang <small>· sampai {s.closesAt}</small></> : <>Tutup <small>{s.next ? `· buka ${s.next}` : ''}</small></>}
    </span>
  )
}

export function SectionHead({ kicker, title, children, id, align }) {
  return (
    <header className={`section-head ${align === 'center' ? 'is-center' : ''}`}>
      <p className="kicker" data-reveal>{kicker}</p>
      <h2 id={id} data-reveal style={{ '--d': 1 }}>{title}</h2>
      {children && <p className="section-intro" data-reveal style={{ '--d': 2 }}>{children}</p>}
    </header>
  )
}
