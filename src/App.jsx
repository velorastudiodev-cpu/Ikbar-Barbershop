import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import './components.css'
import { supabase } from './lib/supabase'

// ─── Site Data Context ─────────────────────────────────────────────────────
const SiteDataCtx = createContext(null)
function useSiteData() { return useContext(SiteDataCtx) }
function useWA() {
  const d = useSiteData()
  const num = d?.kontak?.wa_number || '6283110071825'
  const ig = d?.kontak?.instagram && !/ikbar/i.test(d.kontak.instagram)
    ? d.kontak.instagram
    : 'dinasti.barbershop'
  return {
    link: (msg) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`,
    igUrl: `https://www.instagram.com/${ig}/`,
    number: num,
    ig,
  }
}

// ─── Framer Motion Variants ──────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } }
}
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55 } }
}
const stagger = (delay = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay } }
})
const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } }
}
const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } }
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

// ─── Scroll Reveal Wrapper ────────────────────────────────────
function Reveal({ children, variants = fadeUp, delay = 0, className = '', once = true }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-80px 0px' })
  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── SVG Icons ───────────────────────────────────────────────
const IconScissors = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
  </svg>
)
const IconConsult = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const IconLegacy = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const IconPrecision = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)
const IconComfort = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
const IconExclusive = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
const IconMap = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const IconClock = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconPhone = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.45 2 2 0 0 1 3.59 2.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 18l.19-.92v-.16z" />
  </svg>
)
const IconWA = ({ size = 28, fill = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)
const IconInstagram = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const IconArrow = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)
const IconZoom = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
)
const IconPlay = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)
const IconClose = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconChevLeft = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const IconChevRight = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const IconCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconInfo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)
const IconGrid = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
)

// ─── NAVBAR ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'barber', label: 'Barber' },
  { id: 'galeri', label: 'Galeri' },
  { id: 'layanan', label: 'Layanan' },
  { id: 'lokasi', label: 'Lokasi' },
  { id: 'kontak', label: 'Kontak' },
]

function Navbar() {
  const { link, igUrl } = useWA()
  const [scrolled, setScrolled] = useState(false)
  const [activeId, setActiveId] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
      const sections = NAV_LINKS.map(l => document.getElementById(l.id))
      const scrollY = window.scrollY + 120
      let current = ''
      sections.forEach(section => {
        if (section && section.offsetTop <= scrollY) current = section.id
      })
      setActiveId(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on resize
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setMenuOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className="site-header">
      <motion.nav
        className={`navbar${scrolled ? ' scrolled' : ''}`}
        aria-label="Navigasi Utama"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="navbar-inner">
          <span className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} role="button" tabIndex={0}>
            <img className="brand-logo" src="/assets/logo-dinasti.png" alt="Logo Warisan Keluarga Dinasti Barbershop - Ikbar Barbershop Kuningan" />
          </span>
          <ul className="navbar-nav">
            {NAV_LINKS.map(l => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className={activeId === l.id ? 'active' : ''}
                  onClick={e => { e.preventDefault(); scrollTo(l.id) }}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="navbar-cta">
            <a
              href={link('Halo Dinasti, saya mau tanya-tanya soal gaya rambut nih')}
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontSize: '12px' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanya ke DINASTI
            </a>
          </div>
          <button
            className={`navbar-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-label="Navigation menu"
          >
            <ul className="mobile-menu-nav">
              {NAV_LINKS.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a href={`#${l.id}`} onClick={e => { e.preventDefault(); scrollTo(l.id) }}>{l.label}</a>
                </motion.li>
              ))}
            </ul>
            <motion.a
              href={link('Halo Dinasti, saya mau tanya-tanya soal gaya rambut nih')}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_LINKS.length * 0.06 }}
            >
              <IconWA size={18} />
              Tanya Langsung ke DINASTI
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ─── HERO ───────────────────────────────────────────────────────────────────
function Hero() {
  const siteData = useSiteData()
  const { link } = useWA()
  const heroImageSrc = siteData?.galleryItems?.find(item => item.type === 'image')?.src || '/assets/gallery-new-1.jpg'
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -80])

  return (
    <section className="hero noise" id="beranda" aria-labelledby="hero-heading">
      <div className="hero-bg" />
      <div className="hero-lines" />
      {/* Geometric accent shapes */}
      <div className="hero-geo hero-geo-1" />
      <div className="hero-geo hero-geo-2" />

      <motion.div className="hero-content" style={{ opacity: heroOpacity, y: heroY }}>
        <motion.div
          className="hero-eyebrow"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-eyebrow-line" />
          <span className="hero-eyebrow-text">Berdiri Sejak 2024 · Warisan Keluarga</span>
        </motion.div>

        <motion.h1
          id="hero-heading"
          className="hero-title"
          initial={{ opacity: 0, y: 70 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          DINASTI
          <span>Barbershop · Cukur Rambut Pria di Luragung, Kuningan</span>
        </motion.h1>

        <motion.p
          className="hero-tagline"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Bukan sekadar cukur — setiap sesi dimulai dengan konsultasi mendalam,
          agar hasil akhir benar-benar mencerminkan karakter terbaik Anda.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.6 }}
        >
          <motion.a
            href={link('Halo Dinasti, saya mau tanya-tanya soal gaya rambut nih')}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <IconWA size={18} />
            Tanya Via WhatsApp Sekarang
          </motion.a>
          <motion.button
            className="btn btn-ghost"
            onClick={() => document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Lihat Portofolio
          </motion.button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="hero-trust"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.7 }}
        >
          <div className="hero-trust-item">
            <span className="hero-trust-num">2+</span>
            <span className="hero-trust-lbl">Tahun Berpengalaman</span>
          </div>
          <div className="hero-trust-divider" />
          <div className="hero-trust-item">
            <span className="hero-trust-num">500+</span>
            <span className="hero-trust-lbl">Pelanggan Puas</span>
          </div>
          <div className="hero-trust-divider" />
          <div className="hero-trust-item">
            <span className="hero-trust-num">100%</span>
            <span className="hero-trust-lbl">Konsultasi Gratis</span>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, y: 28, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: .55, duration: .8, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={heroImageSrc} alt="Hasil cukur rambut pria di Ikbar Barbershop Luragung Kuningan" loading="eager" fetchPriority="high" decoding="async" />
        <div className="hero-visual-note">Konsultasi personal<br /><strong>sebelum gunting</strong></div>
      </motion.div>

      <motion.div
        className="hero-scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.8 }}
      >
        <span className="hero-scroll-text">Scroll</span>
        <motion.div
          className="hero-scroll-line"
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}

// ─── TENTANG / ABOUT ────────────────────────────────────────────────────────
function About() {
  const siteData = useSiteData()
  const aboutImgSrc = siteData?.about?.image_url || '/assets/about-new.jpg'
  return (
    <section className="section about" id="tentang" aria-labelledby="about-heading">
      <div className="container">
        <div className="about-grid">
          <Reveal variants={slideLeft}>
            <div className="about-visual">
              <div className="about-image-frame">
                <img
                  src={aboutImgSrc}
                  alt="Seni Cukur Warisan Keluarga — Dinasti Barbershop"
                  loading="lazy"
                />
                {/* Decorative border frame */}
                <div className="about-frame-deco" />
              </div>
              <motion.div
                className="about-accent-box"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="year">2024</div>
                <div className="since">Berdiri</div>
              </motion.div>
            </div>
          </Reveal>

          <motion.div
            className="about-content"
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px 0px' }}
          >
            <motion.div variants={fadeUp}>
              <span className="overline">Tentang Kami</span>
            </motion.div>
            <motion.h2 id="about-heading" variants={fadeUp} style={{ marginBlock: '20px 24px' }}>
              Seni Cukur<br />Warisan Keluarga Sejak 2024
            </motion.h2>
            <motion.p variants={fadeUp} className="prose">
              Dinasti Barbershop lahir dari passion yang sudah mengalir dalam darah —
              keahlian memotong rambut yang diwariskan turun-temurun dari keluarga.
              Sejak 2024, kami hadir dengan konsep yang berbeda: setiap pelanggan berhak
              mendapat sesi konsultasi personal sebelum gunting menyentuh rambut.
            </motion.p>
            <motion.p variants={fadeUp} className="prose" style={{ marginTop: '16px' }}>
              Kami percaya bahwa potongan terbaik lahir dari pemahaman mendalam —
              tentang bentuk wajah, gaya hidup, dan kepribadian Anda. Itulah mengapa
              setiap kunjungan ke Dinasti Barbershop terasa berbeda dari barbershop biasa.
            </motion.p>

            <motion.div className="about-pillars" variants={stagger(0.1)}>
              {[
                { icon: <IconConsult size={20} />, title: 'Konsultasi Sebelum Cukur', desc: 'Diskusi mendalam sebelum eksekusi — memastikan hasil sesuai karakter Anda.' },
                { icon: <IconLegacy size={20} />, title: 'Keahlian Turun-Temurun', desc: 'Teknik cukur yang diwarisi dari generasi ke generasi keluarga Dinasti.' },
                { icon: <IconPrecision size={20} />, title: 'Presisi & Detail', desc: 'Setiap garis, setiap sudut dieksekusi dengan perhatian penuh pada detail.' },
              ].map((p, i) => (
                <motion.div className="about-pillar" key={i} variants={fadeUp}
                  whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                  <div className="pillar-icon">{p.icon}</div>
                  <div className="pillar-text">
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                  </div>
                  <div className="pillar-arrow"><IconArrow size={14} /></div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── BARBER PROFILE ─────────────────────────────────────────────────────────
function BarberProfile() {
  const siteData = useSiteData()
  const { link } = useWA()
  const barberPhotoSrc = siteData?.barber?.photo_url || '/assets/barber-ikbar.jpg'
  return (
    <section className="section barber" id="barber" aria-labelledby="barber-heading">
      <div className="container">
        <div className="barber-inner">
          <motion.div
            className="barber-content"
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px 0px' }}
          >
            <motion.span className="overline" variants={fadeUp}>Profil Barber</motion.span>
            <motion.h2 id="barber-heading" className="barber-name" variants={fadeUp}>Ikbar Kamil</motion.h2>
            <motion.p className="barber-title" variants={fadeUp}>Head Barber & Founder · Ikbar Barbershop</motion.p>

            <motion.div className="barber-stats" variants={fadeUp}>
              {[
                { num: '2+', lbl: 'Tahun Pengalaman' },
                { num: '500+', lbl: 'Pelanggan Puas' },
                { num: '100%', lbl: 'Konsultasi Dulu' },
              ].map((s, i) => (
                <motion.div className="barber-stat" key={i}
                  whileHover={{ background: 'var(--color-border)' }}
                  transition={{ duration: 0.2 }}>
                  <div className="num">{s.num}</div>
                  <div className="lbl">{s.lbl}</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.p className="barber-bio" variants={fadeUp}>
              Ikbar bukan hanya seorang barber — ia adalah penerus tradisi keluarga yang
              telah berpengalaman dalam seni memotong rambut. Dengan pendekatan yang sabar
              dan teliti, Ikbar memastikan setiap pelanggan meninggalkan kursinya dengan
              rasa percaya diri yang lebih tinggi.
            </motion.p>
            <motion.p className="barber-bio" variants={fadeUp} style={{ marginBottom: 0 }}>
              Filosofinya sederhana: <em style={{ color: 'var(--color-white)', fontStyle: 'italic' }}>
                "Rambut yang bagus dimulai dari percakapan yang baik."</em> Itulah mengapa
              konsultasi selalu menjadi langkah pertama di setiap sesi.
            </motion.p>

            <motion.div className="barber-specialties" variants={fadeUp}>
              {['Precision fade & taper', 'Classic scissor cut', 'Korean perm & styling'].map(skill => (
                <span key={skill}>{skill}</span>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} style={{ marginTop: '36px' }}>
              <motion.a
                href={link('Halo Ikbar, boleh tanya-tanya soal potongan rambut yang cocok buat saya?')}
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Tanya ke DINASTI Langsung <IconArrow />
              </motion.a>
            </motion.div>
          </motion.div>

          <Reveal variants={slideRight}>
            <div className="barber-visual">
              <div className="barber-photo">
                <img
                  src={barberPhotoSrc}
                  alt="Ikbar Kamil Master Barber di Ikbar Barbershop Luragung Kuningan"
                  loading="lazy"
                  decoding="async"
                  width="900"
                  height="1600"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                />
              </div>
              <div className="barber-signature">
                <div className="barber-signature-dot" />
                <span>Ready to cut</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── KEUNGGULAN — 21st.dev noise card pattern adapted ───────────────────────
const KEUNGGULAN_DATA = [
  { icon: <IconConsult size={22} />, title: 'Konsultasi Personal', desc: 'Setiap sesi diawali diskusi mendalam — kami pahami gaya hidup & preferensi Anda sebelum memulai.' },
  { icon: <IconLegacy size={22} />, title: 'Warisan Keluarga', desc: 'Keahlian yang tidak dipelajari dari kursus biasa — mengalir turun-temurun melalui generasi keluarga.' },
  { icon: <IconScissors size={22} />, title: 'Teknik Premium', desc: 'Menggunakan teknik cukur premium dengan alat-alat berkualitas tinggi yang terawat sempurna.' },
  { icon: <IconPrecision size={22} />, title: 'Presisi Tinggi', desc: 'Setiap detail diperhatikan — garis tepi bersih, gradasi halus, hasil yang konsisten setiap kali.' },
  { icon: <IconComfort size={22} />, title: 'Suasana Nyaman', desc: 'Lingkungan yang bersih, tenang, dan profesional — membuat Anda rileks dari awal sampai akhir.' },
  { icon: <IconExclusive size={22} />, title: 'Pengalaman Eksklusif', desc: 'Layanan personal one-on-one tanpa rush — Anda adalah prioritas utama selama sesi berlangsung.' },
]

function KeunggulanCard({ item, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  return (
    <motion.li
      ref={ref}
      className="keunggulan-card-v2"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, borderColor: 'rgba(255,255,255,0.18)' }}
    >
      {/* Noise texture SVG overlay — adapted from 21st.dev Card with Noise Pattern */}
      <svg className="keunggulan-noise" aria-hidden="true">
        <filter id={`noise-${index}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feSpecularLighting surfaceScale="1" specularConstant="0.75" specularExponent="20" lightingColor="white">
            <fePointLight x="50" y="50" z="120" />
          </feSpecularLighting>
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${index})`} opacity="0.04" />
      </svg>

      {/* Top gradient */}
      <div className="keunggulan-card-gradient" />

      <div className="keunggulan-card-body">
        <div className="keunggulan-number-v2">{String(index + 1).padStart(2, '0')}</div>
        <div className="keunggulan-icon-v2">{item.icon}</div>
        <h3 className="keunggulan-title-v2">{item.title}</h3>
        <p className="keunggulan-desc-v2">{item.desc}</p>
      </div>

      {/* Bottom shimmer on hover */}
      <div className="keunggulan-card-shimmer" />
    </motion.li>
  )
}

function Keunggulan() {
  return (
    <section className="section keunggulan" id="keunggulan" aria-labelledby="why-heading">
      <div className="container">
        <div className="keunggulan-header">
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px 0px' }}
          >
            <motion.span className="overline" variants={fadeUp}>Keunggulan</motion.span>
            <motion.h2 id="why-heading" variants={fadeUp} style={{ marginTop: '20px' }}>
              Kenapa Pilih<br />Dinasti Barbershop?
            </motion.h2>
          </motion.div>
          <Reveal variants={fadeIn}>
            <p className="prose" style={{ maxWidth: '36ch', textAlign: 'right' }}>
              Kami tidak hanya memotong rambut —<br />kami membangun kepercayaan diri Anda.
            </p>
          </Reveal>
        </div>

        <ol className="keunggulan-grid-v2">
          {KEUNGGULAN_DATA.map((item, i) => (
            <KeunggulanCard key={i} item={item} index={i} />
          ))}
        </ol>
      </div>
    </section>
  )
}

// ─── GALLERY — 21st.dev Gallery Grid + Lightbox pattern adapted ──────────────
const GALLERY_ITEMS = [
  // ── Foto ──────────────────────────────────────────────
  { src: '/assets/gallery-1.jpg', type: 'image', alt: 'Hasil cukuran Dinasti Barbershop 1', category: 'Foto' },
  { src: '/assets/gallery-2.jpg', type: 'image', alt: 'Hasil cukuran Dinasti Barbershop 2', category: 'Foto' },
  { src: '/assets/gallery-3.jpg', type: 'image', alt: 'Hasil cukuran Dinasti Barbershop 3', category: 'Foto' },
  { src: '/assets/gallery-new-1.jpg', type: 'image', alt: 'Portofolio Dinasti Barbershop', category: 'Foto' },
  // ── Video ─────────────────────────────────────────────
  { src: '/assets/gallery-vid-1.mp4', type: 'video', alt: 'Proses cukuran Dinasti — Video 1', category: 'Video' },
  { src: '/assets/gallery-vid-2.mp4', type: 'video', alt: 'Proses cukuran Dinasti — Video 2', category: 'Video' },
  { src: '/assets/gallery-vid-3.mp4', type: 'video', alt: 'Proses cukuran Dinasti — Video 3', category: 'Video' },
  { src: '/assets/gallery-new-vid-1.mp4', type: 'video', alt: 'Aksi Dinasti Barbershop — Video 4', category: 'Video' },
  { src: '/assets/gallery-new-vid-2.mp4', type: 'video', alt: 'Aksi Dinasti Barbershop — Video 5', category: 'Video' },
  { src: '/assets/gallery-new-vid-3.mp4', type: 'video', alt: 'Aksi Dinasti Barbershop — Video 6', category: 'Video' },
  { src: '/assets/gallery-new-vid-4.mp4', type: 'video', alt: 'Aksi Dinasti Barbershop — Video 7', category: 'Video' },
]

const mediaAlt = (item, index) => item.title || item.description || item.alt ||
  `Hasil Cukur Rambut Pria di Ikbar Barbershop Luragung Kuningan - Portofolio #${index + 1}`

function Gallery() {
  const siteData = useSiteData()
  const galleryItems = siteData?.galleryItems ?? GALLERY_ITEMS
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [filter, setFilter] = useState('Semua')

  const categories = ['Semua', 'Foto', 'Video']

  const filteredItems = useMemo(() =>
    filter === 'Semua' ? galleryItems : galleryItems.filter(i => i.category === filter),
    [filter, galleryItems]
  )

  // Keyboard navigation in lightbox
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIndex === null) return
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowRight') setSelectedIndex(i => (i + 1) % filteredItems.length)
      if (e.key === 'ArrowLeft') setSelectedIndex(i => (i - 1 + filteredItems.length) % filteredItems.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIndex, filteredItems.length])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [selectedIndex])

  const selectedItem = selectedIndex !== null ? filteredItems[selectedIndex] : null
  const handlePrev = (e) => { e.stopPropagation(); setSelectedIndex(i => (i - 1 + filteredItems.length) % filteredItems.length) }
  const handleNext = (e) => { e.stopPropagation(); setSelectedIndex(i => (i + 1) % filteredItems.length) }

  return (
    <section className="section gallery" id="galeri" aria-labelledby="gallery-heading">
      <div className="container">
        {/* Header */}
        <motion.div
          className="gallery-header"
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px 0px' }}
        >
          <motion.span className="overline" variants={fadeUp}>Portofolio</motion.span>
          <motion.h2 id="gallery-heading" variants={fadeUp} style={{ marginTop: '20px' }}>Portofolio Hasil Cukur Rambut Pria Kami</motion.h2>
          <motion.p variants={fadeUp} className="prose" style={{ marginTop: '14px' }}>
            Klik gambar atau video untuk melihat lebih besar. Setiap potongan adalah karya.
          </motion.p>
        </motion.div>

        {/* Filter Buttons — 21st.dev pattern */}
        <motion.div
          className="gallery-filters"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <IconGrid size={12} />
          {categories.map(cat => (
            <button
              key={cat}
              className={`gallery-filter-btn${filter === cat ? ' active' : ''}`}
              onClick={() => { setFilter(cat); setSelectedIndex(null) }}
              aria-pressed={filter === cat}
            >
              {cat}
              {filter === cat && (
                <motion.div
                  className="gallery-filter-pill"
                  layoutId="gallery-pill"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Gallery Grid — animated layout like 21st.dev */}
        <motion.div layout className="gallery-grid-v2" role="list" aria-label="Galeri Dinasti Barbershop">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => (
              <motion.figure
                key={item.src}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="gallery-card-v2"
                onClick={() => setSelectedIndex(i)}
                role="listitem"
                tabIndex={0}
                aria-label={`Lihat ${mediaAlt(item, i)}`}
                onKeyDown={e => e.key === 'Enter' && setSelectedIndex(i)}
              >
                <div className="gallery-card-media">
                  {item.type === 'image' ? (
                    <motion.img
                      src={item.src}
                      alt={mediaAlt(item, i)}
                      loading="lazy"
                      decoding="async"
                      whileHover={{ scale: 1.07 }}
                      transition={{ duration: 0.4 }}
                    />
                  ) : (
                    <motion.video
                      src={item.src}
                      muted playsInline loop autoPlay preload="metadata"
                      aria-label={`Video proses potong rambut pria oleh Ikbar Kamil di Ikbar Barbershop Kuningan — ${mediaAlt(item, i)}`}
                      whileHover={{ scale: 1.07 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>

                {/* Hover overlay — 21st.dev style with backdrop blur */}
                <motion.div
                  className="gallery-card-overlay"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.22 }}
                >
                  <IconZoom size={32} />
                  <span className="gallery-card-label">{mediaAlt(item, i)}</span>
                  <span className="gallery-card-badge">{item.category}</span>
                </motion.div>
              </motion.figure>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox — 21st.dev spring animation with prev/next navigation */}
      <AnimatePresence>
        {selectedIndex !== null && selectedItem && (
          <motion.div
            className="lightbox-v2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={mediaAlt(selectedItem, selectedIndex)}
          >
            <motion.div
              className="lightbox-v2-content"
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.82, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button className="lightbox-v2-close" onClick={() => setSelectedIndex(null)} aria-label="Tutup">
                <IconClose size={18} />
              </button>

              {/* Prev */}
              <motion.button
                className="lightbox-v2-nav lightbox-v2-prev"
                onClick={handlePrev}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Sebelumnya"
              >
                <IconChevLeft size={22} />
              </motion.button>

              {/* Media */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedIndex}
                  className="lightbox-v2-media"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {selectedItem.type === 'image' ? (
                    <img src={selectedItem.src} alt={selectedItem.alt} />
                  ) : (
                    <video src={selectedItem.src} controls autoPlay playsInline />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Next */}
              <motion.button
                className="lightbox-v2-nav lightbox-v2-next"
                onClick={handleNext}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Selanjutnya"
              >
                <IconChevRight size={22} />
              </motion.button>

              {/* Info bar */}
              <motion.div
                className="lightbox-v2-info"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="lightbox-v2-title">{mediaAlt(selectedItem, selectedIndex)}</span>
                <span className="lightbox-v2-badge">{selectedItem.category}</span>
                <span className="lightbox-v2-counter">{selectedIndex + 1} / {filteredItems.length}</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ─── VIDEO SECTION ──────────────────────────────────────────────────────────
function VideoSection() {
  const siteData = useSiteData()
  const videoSrc = siteData?.video?.video_url || '/assets/main-video.mp4'
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play()
      setPlaying(true)
    }
  }, [])

  return (
    <section className="section video-section" id="video" aria-labelledby="video-heading">
      <div className="container">
        <div className="video-header">
          <Reveal>
            <span className="overline">Behind the Chair</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 id="video-heading" style={{ marginTop: '20px' }}>Behind The Chair — Lihat Aksi Cukur Presisi Kami</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="prose" style={{ marginTop: '16px', marginInline: 'auto', textAlign: 'center' }}>
              Saksikan sendiri bagaimana keahlian tangan Dinasti mengubah potongan biasa<br />
              menjadi karya yang membangun kepercayaan diri.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} variants={scaleIn}>
          <div className="video-wrapper">
            <video
              ref={videoRef}
              src={videoSrc}
              controls={playing}
              playsInline
              preload="metadata"
              aria-label="Video proses potong rambut pria oleh Ikbar Kamil di Ikbar Barbershop Kuningan"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <AnimatePresence>
              {!playing && (
                <motion.div
                  className="video-play-overlay"
                  onClick={handlePlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="play-btn-circle"
                    whileHover={{ scale: 1.14 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <IconPlay size={28} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── SERVICES & HARGA — 21st.dev Pricing Cards pattern adapted ───────────────
const SERVICES_UTAMA = [
  { name: 'Crew Cut', desc: 'Potongan pendek rapi, sisi bersih & atas pendek tipis', price: 'Rp 25.000' },
  { name: 'Undercut', desc: 'Sisi & belakang dicukur pendek, atas tetap panjang', price: 'Rp 25.000' },
  { name: 'Fade / Taper', desc: 'Gradasi halus dari pendek ke panjang — bersih & presisi', price: 'Rp 25.000' },
  { name: 'Skin Fade', desc: 'Fade sampai kulit — tampilan tajam & clean', price: 'Rp 25.000' },
  { name: 'Pompadour', desc: 'Volume tinggi ke depan, sisi pendek, berkesan maskulin', price: 'Rp 25.000' },
  { name: 'Slick Back', desc: 'Rambut disisir ke belakang, kesan formal & elegan', price: 'Rp 25.000' },
  { name: 'Textured Crop', desc: 'Atas bertekstur natural, sisi ringan — gaya kasual modern', price: 'Rp 25.000' },
  { name: 'Buzz Cut', desc: 'Serba pendek merata — tampilan simpel & bersih', price: 'Rp 25.000' },
]
const SERVICES_TAMBAHAN = [
  { name: 'Perming', desc: 'Style perming ala Korea untuk memaksimalkan tekstur dan volume rambut — konsultasikan langsung dengan Dinasti', price: 'Tanya Dinasti', highlight: true },
  { name: 'Creambath', desc: 'Perawatan rambut + pijat kepala relaksasi — tanya langsung ke Dinasti', price: 'Tanya Dinasti' },
  { name: 'Blow Dry & Styling', desc: 'Pengeringan & penataan gaya rambut akhir — tanya langsung ke Dinasti', price: 'Tanya Dinasti' },
]

function ServiceCard({ title, items, isHighlight = false, showCta = false, ctaText, ctaHref, footerNote }) {
  const { link } = useWA()
  return (
    <motion.div
      className={`service-card-v2${isHighlight ? ' service-card-highlight' : ''}`}
      whileHover={{ y: -8, borderColor: isHighlight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {isHighlight && <div className="service-card-recommended">POPULER</div>}
      <div className="service-card-header">
        <h3>{title}</h3>
        {isHighlight && <div className="service-card-badge-dot" />}
      </div>
      <div className="service-card-divider" />

      <ul className="service-card-list">
        {items.map((item, i) => (
          <li key={i} className={`service-card-item${item.highlight ? ' service-item-highlight' : ''}`}>
            <div className="service-check">
              <IconCheck size={13} />
            </div>
            <div className="service-card-info">
              <h3 className="service-card-name">{item.name}</h3>
              <span className="service-card-desc">{item.desc?.replace(/Stytle permin/gi, 'Style perming')}</span>
            </div>
            <span className="service-card-price">{item.price}</span>
            {isHighlight && (
              <a
                className="service-item-cta"
                href={link(`Halo Dinasti, saya mau tanya estimasi untuk ${item.name}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tanya
              </a>
            )}
          </li>
        ))}
      </ul>

      {footerNote && (
        <div className="service-card-footer-note">
          <IconWA size={15} fill="currentColor" />
          <span>{footerNote}</span>
        </div>
      )}

      {showCta && ctaHref && (
        <a
          href={ctaHref}
          className={`service-card-cta${isHighlight ? ' service-card-cta-highlight' : ''}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {ctaText}
          <IconArrow size={16} />
        </a>
      )}
    </motion.div>
  )
}

function Services() {
  const siteData = useSiteData()
  const { link } = useWA()
  const servicesUtama = siteData?.servicesUtama ?? SERVICES_UTAMA
  const servicesTambahan = siteData?.servicesTambahan ?? SERVICES_TAMBAHAN
  const ctaHrefTambahan = link('Halo Dinasti, mau tanya soal layanan tambahan yang tersedia dong')
  return (
    <section className="section services" id="layanan" aria-labelledby="service-heading">
      <div className="container">
        <motion.div
          className="services-header"
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px 0px' }}
        >
          <motion.span className="overline" variants={fadeUp}>Layanan & Harga</motion.span>
          <motion.h2 id="service-heading" variants={fadeUp} style={{ marginTop: '20px' }}>
            Pilihan Gaya Cukur Rambut Pria &<br />Layanan Kami
          </motion.h2>
          <motion.p variants={fadeUp} className="prose" style={{ marginTop: '16px' }}>
            Semua layanan diawali dengan sesi konsultasi gratis.
            Hubungi kami untuk konfirmasi harga terbaru.
          </motion.p>
        </motion.div>

        <motion.div
          className="services-cards-grid"
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px 0px' }}
        >
          <motion.div variants={fadeUp}>
            <ServiceCard
              title="Style Cukuran"
              items={servicesUtama}
              showCta={false}
              footerNote="Style yang kamu inginkan tidak ada di sini? Konsultasi langsung via WhatsApp — kami siap bantu!"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <ServiceCard
              title="Layanan Tambahan"
              items={servicesTambahan}
              isHighlight={true}
              showCta={true}
              ctaText="Tanyakan Langsung ke DINASTI"
              ctaHref={ctaHrefTambahan}
            />
          </motion.div>
        </motion.div>

        <Reveal delay={0.3}>
          <div className="services-note">
            <IconInfo size={16} />
            <span>
              Harga layanan tambahan (Beard Trim, Creambath, Styling) bisa bervariasi — <strong>tanya langsung ke Dinasti</strong> untuk info terkini via WhatsApp.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── LOKASI & JAM OPERASIONAL ────────────────────────────────────────────────
const JAM_DATA = [
  { hari: 'Senin – Jumat', jam: '16:00 – 21:00', tutup: false },
  { hari: 'Sabtu', jam: '10:00 – 21:00', tutup: false },
  { hari: 'Minggu', jam: '10:00 – 21:00', tutup: false },
]

const DEFAULT_MAPS = 'https://www.google.com/maps?q=Dinasti+Barbershop,+XJPF%2B78W,+Jl.+Raya+Luragung,+Kuningan&output=embed'

function Lokasi() {
  const siteData = useSiteData()
  const [clockTick, setClockTick] = useState(Date.now())
  const lokasiData = siteData?.lokasi || {}
  const kontakData = siteData?.kontak || {}
  const jamData = lokasiData.hours_data?.length ? lokasiData.hours_data : JAM_DATA
  const address = lokasiData.address && !/ikbar|isi alamat/i.test(lokasiData.address)
    ? lokasiData.address
    : 'XJPF+78W, Jl. Raya Luragung - Kuningan, Margasari, Kec. Luragung, Kabupaten Kuningan, Jawa Barat 45581'
  const mapsUrl = lokasiData.maps_url && !/Toko Iwan|Ikbar/i.test(lokasiData.maps_url)
    ? lokasiData.maps_url
    : DEFAULT_MAPS
  const waNumber = kontakData.wa_number || '6283110071825'
  const igHandle = kontakData.instagram && !/ikbar/i.test(kontakData.instagram)
    ? kontakData.instagram
    : 'dinasti.barbershop'
  const waFormatted = '+' + waNumber.replace(/^62/, '62 ').replace(/(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')
  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const jakartaParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(clockTick))
  const weekday = jakartaParts.find(part => part.type === 'weekday')?.value
  const hour = Number(jakartaParts.find(part => part.type === 'hour')?.value || 0)
  const minute = Number(jakartaParts.find(part => part.type === 'minute')?.value || 0)
  const isWeekend = weekday === 'Sat' || weekday === 'Sun'
  const openingHour = isWeekend ? 10 : 16
  const isOpen = hour >= openingHour && (hour < 21 || (hour === 20 && minute < 60))
  const openStatusLabel = isOpen ? 'Sedang buka hari ini' : `Tutup — buka kembali pukul ${openingHour}:00`

  return (
    <section className="section lokasi" id="lokasi" aria-labelledby="location-heading">
      <div className="container">
        <div className="lokasi-grid">
          <motion.div
            className="lokasi-info"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px 0px' }}
          >
            <motion.span className="overline" variants={fadeUp}>Temukan Kami</motion.span>
            <motion.h2 id="location-heading" variants={fadeUp} style={{ marginTop: '20px' }}>
              Lokasi Barbershop di Luragung, Kuningan<br />& Jam Buka
            </motion.h2>

            <motion.div className="lokasi-address" variants={stagger(0.1)}>
              {[
                { icon: <IconMap />, label: 'Alamat', value: address },
                { icon: <IconPhone />, label: 'WhatsApp', value: waFormatted },
                { icon: <IconInstagram />, label: 'Instagram', value: '@' + igHandle },
              ].map((row, i) => (
                <motion.div className="lokasi-row" key={i} variants={fadeUp}>
                  <div className="lokasi-icon">{row.icon}</div>
                    <div className="lokasi-text">
                    <h4>{row.label}</h4>
                      {row.label === 'Alamat' ? <address>{row.value}</address> : <p>{row.value}</p>}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div className="jam-box" variants={fadeUp}>
              <div className={`open-status${isOpen ? '' : ' closed'}`}>
                <span className="open-status-dot" />
                {openStatusLabel}
              </div>
              <h3><IconClock size={14} /> Jam Operasional</h3>
              {jamData.map((j, i) => (
                <motion.div
                  className="jam-row"
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <span className="jam-day">{j.hari}</span>
                  <span className="jam-time">{j.tutup ? 'Tutup' : j.jam}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <Reveal variants={slideRight}>
            <div className="map-wrapper">
              <iframe
                title="Peta Lokasi Ikbar Barbershop di Jl. Raya Luragung - Kuningan, Jawa Barat"
                src={mapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── KONTAK / CTA AKHIR ──────────────────────────────────────────────────────
function Kontak() {
  const siteData = useSiteData()
  const waNum = siteData?.kontak?.wa_number || '6283110071825'
  const igHandle = siteData?.kontak?.instagram && !/ikbar/i.test(siteData.kontak.instagram)
    ? siteData.kontak.instagram
    : 'dinasti.barbershop'
  const waHref = `https://wa.me/${waNum}?text=${encodeURIComponent('Halo Ikbar, boleh konsultasi soal potongan rambut yang cocok buat saya?')}`
  const igHref = `https://www.instagram.com/${igHandle}/`
  return (
    <section className="kontak" id="kontak" aria-labelledby="contact-heading">
      <div className="kontak-inner">
        <Reveal>
          <span className="overline" style={{ color: '#888', justifyContent: 'center' }}>
            Siap Tampil Lebih Keren?
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 id="contact-heading" style={{ marginTop: '20px', fontSize: 'clamp(36px, 6vw, 72px)' }}>
            Tanya Langsung<br />ke IKBAR
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="prose" style={{ marginTop: '20px' }}>
            Mau potongan yang sesuai sama karakter kamu? Langsung aja tanya Ikbar —
            konsultasi santai, gratis, dan hasilnya dijamin memuaskan.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="kontak-actions">
            <motion.a
              href={waHref}
              className="btn-kontak-primary"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.97 }}
            >
              <IconWA size={20} fill="white" />
              Tanya ke IKBAR via WA
            </motion.a>
            <motion.a
              href={igHref}
              className="btn-kontak-ghost"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <IconInstagram size={18} />
              Follow Instagram
            </motion.a>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="kontak-socials">
            <motion.a
              href={waHref}
              className="kontak-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Ikbar Barbershop"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconWA size={20} fill="black" />
            </motion.a>
            <motion.a
              href={igHref}
              className="kontak-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Dinasti Barbershop"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconInstagram size={20} />
            </motion.a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear()
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-logo">
          <img className="brand-logo" src="/assets/logo-dinasti.png" alt="Logo Warisan Keluarga Dinasti Barbershop - Ikbar Barbershop Kuningan" />
        </span>
        <ul className="footer-links">
          {NAV_LINKS.map(l => (
            <li key={l.id}>
              <a href={`#${l.id}`} onClick={e => { e.preventDefault(); scrollTo(l.id) }}>{l.label}</a>
            </li>
          ))}
        </ul>
        <p className="footer-copy">
          © {year} Dinasti Barbershop. All rights reserved.
          <br />
          <span style={{ fontSize: '11px', opacity: 0.4 }}>Made with care by Velora Studio</span>
        </p>
      </div>
    </footer>
  )
}

// ─── WHATSAPP FLOAT BUTTON ───────────────────────────────────────────────────
function WAFloat() {
  const { link } = useWA()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="wa-float"
          initial={{ opacity: 0, scale: 0.4, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.a
            href={link('Halo Dinasti, boleh konsultasi soal potongan rambut yang cocok buat saya?')}
            className="wa-btn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat WhatsApp Dinasti Barbershop"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconWA size={28} />
          </motion.a>
          <span className="wa-chat-label">💈 Tanya Dinasti</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── STRUCTURED SEO DATA ────────────────────────────────────────────────────
function SeoSchema() {
  const siteData = useSiteData()
  const lokasiData = siteData?.lokasi || {}
  const kontakData = siteData?.kontak || {}
  const address = lokasiData.address && !/ikbar|isi alamat/i.test(lokasiData.address)
    ? lokasiData.address
    : 'XJPF+78W, Jl. Raya Luragung - Kuningan, Margasari, Kec. Luragung, Kabupaten Kuningan, Jawa Barat 45581'
  const phone = kontakData.wa_number || '6283110071825'
  const instagram = kontakData.instagram && !/ikbar/i.test(kontakData.instagram)
    ? kontakData.instagram
    : 'dinasti.barbershop'
  const mainServices = siteData?.servicesUtama || SERVICES_UTAMA
  const extraServices = siteData?.servicesTambahan || SERVICES_TAMBAHAN
  const offer = (item) => {
    const numericPrice = String(item.price || '').replace(/[^0-9]/g, '')
    return {
      '@type': 'Offer',
      name: item.name,
      itemOffered: { '@type': 'Service', name: item.name, description: item.desc },
      ...(numericPrice ? { price: numericPrice, priceCurrency: 'IDR' } : {}),
    }
  }
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['BarberShop', 'HairSalon', 'LocalBusiness'],
        '@id': 'https://ikbar-barbershop.vercel.app/#barbershop',
        name: 'Ikbar Barbershop',
        alternateName: ['Dinasti Barbershop', 'Ikbar Barbershop Luragung Kuningan'],
        description: 'Barbershop pria di Luragung, Kabupaten Kuningan dengan konsep warisan keluarga dan sesi konsultasi personal gratis sebelum cukur. Melayani Skin Fade, Taper, Undercut, Korean Perming, dan Creambath.',
        url: 'https://ikbar-barbershop.vercel.app/',
        telephone: `+${phone}`,
        priceRange: 'Rp 25.000',
        currenciesAccepted: 'IDR',
        paymentAccepted: 'Cash, QRIS, Transfer',
        image: 'https://ikbar-barbershop.vercel.app/assets/og-image.jpg',
        logo: 'https://ikbar-barbershop.vercel.app/assets/logo-dinasti.svg',
        address: {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressLocality: 'Kec. Luragung, Kabupaten Kuningan',
          addressRegion: 'Jawa Barat',
          postalCode: '45581',
          addressCountry: 'ID',
        },
        geo: { '@type': 'GeoCoordinates', latitude: -6.9825, longitude: 108.6185 },
        hasMap: 'https://www.google.com/maps/search/?api=1&query=XJPF%2B78W+Margasari+Kuningan',
        openingHoursSpecification: [
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '16:00', closes: '21:00' },
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday'], opens: '10:00', closes: '21:00' },
        ],
        sameAs: [`https://www.instagram.com/${instagram}/`, `https://wa.me/${phone}`],
        areaServed: ['Luragung', 'Kuningan', 'Cidahu', 'Ciawigebang', 'Cibingbin', 'Ciwaru'],
        hasOfferCatalog: { '@id': 'https://ikbar-barbershop.vercel.app/#offers' },
      },
      {
        '@type': 'Person',
        '@id': 'https://ikbar-barbershop.vercel.app/#founder',
        name: 'Ikbar Kamil',
        jobTitle: 'Head Barber & Founder',
        worksFor: { '@id': 'https://ikbar-barbershop.vercel.app/#barbershop' },
        knowsAbout: ['Men Haircut', 'Skin Fade', 'Taper Fade', 'Undercut', 'Korean Perm', 'Hair Styling Consultation'],
      },
      {
        '@type': 'OfferCatalog',
        '@id': 'https://ikbar-barbershop.vercel.app/#offers',
        name: 'Pilihan Gaya Cukur Rambut Pria dan Layanan Tambahan',
        itemListElement: [
          { '@type': 'OfferCatalog', name: 'Signature Haircut + Konsultasi Personal Gratis', itemListElement: mainServices.map(offer) },
          { '@type': 'OfferCatalog', name: 'Layanan Tambahan dan Hair Treatment', itemListElement: extraServices.map(offer) },
        ],
      },
    ],
  }

  return <script id="dinasti-seo-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [siteData, setSiteData] = useState(null)

  useEffect(() => {
    if (!supabase) return // No Supabase config → use hardcoded fallbacks
    Promise.all([
      supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }),
      supabase.from('services').select('*').order('sort_order', { ascending: true }),
      supabase.from('site_content')
        .select('section, content')
        .in('section', ['lokasi', 'kontak', 'barber', 'about', 'video']),
    ]).then(([gallery, services, content]) => {
      const contentMap = {}
      for (const row of (content.data || [])) contentMap[row.section] = row.content
      const allSvc = services.data || []
      const renameBrand = value => typeof value === 'string'
        ? value.replace(/ikbar/gi, 'Dinasti')
        : value
      setSiteData({
        galleryItems: gallery.data?.length
          ? gallery.data.map(item => ({ ...item, alt: renameBrand(item.alt) }))
          : null,
        servicesUtama: allSvc.filter(s => s.category === 'utama').length
          ? allSvc.filter(s => s.category === 'utama').map(item => ({ ...item, desc: renameBrand(item.desc), price: renameBrand(item.price) }))
          : null,
        servicesTambahan: allSvc.filter(s => s.category === 'tambahan').length
          ? allSvc.filter(s => s.category === 'tambahan').map(item => ({ ...item, desc: renameBrand(item.desc), price: renameBrand(item.price) }))
          : null,
        lokasi: contentMap.lokasi || null,
        kontak: contentMap.kontak || null,
        barber: contentMap.barber || null,
        about: contentMap.about || null,
        video: contentMap.video || null,
      })
    }).catch(() => {
      // Silently fail — landing page uses hardcoded fallbacks
    })
  }, [])

  return (
    <SiteDataCtx.Provider value={siteData}>
      <SeoSchema />
      <Navbar />
      <main>
        <Hero />
        <About />
        <BarberProfile />
        <Keunggulan />
        <Gallery />
        <VideoSection />
        <Services />
        <Lokasi />
        <Kontak />
      </main>
      <Footer />
      <WAFloat />
    </SiteDataCtx.Provider>
  )
}
