import { useEffect, useState } from 'react'
import { FALLBACK, waLink, imageProps, posterFor } from '../data.js'
import { useSite } from '../site.js'
import { Icon, OpenStatus } from './ui.jsx'

export const NAV = [
  ['tentang', 'Tentang'], ['barber', 'Barber'], ['galeri', 'Galeri'], ['layanan', 'Layanan'], ['booking', 'Booking'], ['lokasi', 'Lokasi'],
]

export function Header() {
  const { wa } = useSite()
  const [open, setOpen] = useState(false), [scrolled, setScrolled] = useState(false), [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    // The hero is watched too, so scrolling back to the top clears the highlight.
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-40% 0px -55% 0px' })
    ;['beranda', ...NAV.map(([id]) => id)].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => { removeEventListener('scroll', onScroll); io.disconnect() }
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    const onKey = e => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="nav-inner shell">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>
          {/* Client's own logo file, shown as-is. */}
          <img className="brand-logo" src="/assets/logo-dinasti.png" alt="Dinasti Barbershop" width="290" height="233" />
        </a>
        <nav id="nav-links" className="nav-links" aria-label="Navigasi utama">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a className="btn btn-brass nav-sheet-cta" href={waLink(wa, 'Halo Dinasti, saya mau tanya-tanya soal gaya rambut nih')} target="_blank" rel="noopener noreferrer">
            <Icon name="wa" size={18} /> Chat WhatsApp
          </a>
        </nav>
        <OpenStatus className="nav-status" />
        <a className="btn btn-brass btn-sm nav-cta" href="#booking">Booking <Icon name="arrow" size={16} /></a>
        <button className="menu-toggle" aria-controls="nav-links" aria-expanded={open} aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </div>
    </header>
  )
}

const WALL_SIZES = '(max-width: 960px) 30vw, 220px'

/**
 * Two columns of haircut photos drifting in opposite directions.
 * Always the bundled, pre-sized photos: CMS uploads (mostly videos without posters, or full-size photos)
 * used to replace them a moment after load and empty the wall.
 */
function CutWall() {
  const tiles = FALLBACK.gallery
    .map(g => {
      // On phones the wall is a faint backdrop, so small files are plenty.
      if (g.type !== 'video') return { ...imageProps(g.src, WALL_SIZES), alt: g.alt }
      const poster = posterFor(g.src)
      return { src: poster, srcSet: poster && `${poster.replace('.webp', '-240.webp')} 240w, ${poster.replace('.webp', '-320.webp')} 320w, ${poster} 480w`, sizes: WALL_SIZES, alt: g.alt }
    })
    .filter(t => t.src)
    .slice(0, 10)
  if (tiles.length < 2) return null
  const half = Math.ceil(tiles.length / 2)
  const cols = [tiles.slice(0, half), tiles.slice(half)]
  return (
    <div className="cutwall" aria-hidden="true">
      {cols.map((col, c) => (
        <div className={`cutwall-col ${c ? 'is-reverse' : ''}`} key={c}>
          {/* The list is rendered twice so the loop is seamless. */}
          {[0, 1].map(copy => (
            <ul key={copy}>
              {col.map((t, i) => (
                <li key={i}><img {...t} alt="" width={t.width || 480} height={t.height || 600} loading={copy === 0 && i < 2 ? 'eager' : 'lazy'} fetchPriority={copy === 0 && i === 0 ? 'high' : undefined} decoding="async" /></li>
              ))}
            </ul>
          ))}
        </div>
      ))}
      <div className="pole" ><i /></div>
    </div>
  )
}

/** Lowest numeric price among the main haircuts, e.g. 25000 → "Rp25rb". */
export function startingPrice(services) {
  const prices = services.map(s => Number(String(s.price || '').replace(/[^0-9]/g, ''))).filter(n => n > 0)
  if (!prices.length) return null
  const min = Math.min(...prices)
  return min % 1000 === 0 ? `Rp${min / 1000}rb` : `Rp${min.toLocaleString('id-ID')}`
}

export function Hero() {
  const { wa, servicesUtama } = useSite()
  const from = startingPrice(servicesUtama)
  return (
    <section className="hero" id="beranda" aria-labelledby="hero-title">
      <div className="hero-copy shell">
        <p className="eyebrow anim" style={{ '--d': 0 }}>
          <span>Est. MMXXIV</span><i aria-hidden="true" /> <span>Warisan Keluarga</span><i aria-hidden="true" /> <span>Luragung, Kuningan</span>
        </p>
        <h1 id="hero-title" className="anim" style={{ '--d': 1 }}>
          <span className="crown" aria-hidden="true"><Icon name="crown" size={34} /></span>
          Dinasti
          <small>Barbershop</small>
        </h1>
        <p className="hero-lede anim" style={{ '--d': 2 }}>
          Bukan sekadar cukur. Setiap sesi dimulai dengan konsultasi, supaya potonganmu benar-benar
          cocok dengan bentuk wajah dan karaktermu.
        </p>
        <div className="hero-actions anim" style={{ '--d': 3 }}>
          <a className="btn btn-brass" href="#booking"><Icon name="calendar" size={18} /> Booking Kursi</a>
          <a className="btn btn-ghost" href={waLink(wa, 'Halo Dinasti, saya mau tanya-tanya soal gaya rambut nih')} target="_blank" rel="noopener noreferrer">
            <Icon name="wa" size={18} /> Tanya via WhatsApp
          </a>
        </div>
        <div className="hero-meta anim" style={{ '--d': 4 }}>
          <OpenStatus />
          <dl>
            {from && <div><dt>Cukur mulai</dt><dd>{from}</dd></div>}
            <div><dt>Pelanggan</dt><dd>500+</dd></div>
            <div><dt>Konsultasi</dt><dd>Gratis</dd></div>
          </dl>
        </div>
      </div>
      <CutWall />
    </section>
  )
}
