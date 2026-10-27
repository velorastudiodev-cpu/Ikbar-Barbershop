import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { imageProps, videoProps } from '../data.js'
import { useSite } from '../site.js'
import { Icon, SectionHead } from './ui.jsx'

/** Muted preview that only plays while on screen, so a grid of clips never downloads all at once. */
function InViewVideo({ src, label }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}) } else v.pause()
    }, { threshold: 0.5 })
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  return <video ref={ref} {...videoProps(src, 320)} muted loop playsInline aria-label={label} />
}

export function Gallery() {
  const { gallery } = useSite()
  const [filter, setFilter] = useState('Semua')
  const [index, setIndex] = useState(null)
  const dialog = useRef(null)
  const items = filter === 'Semua' ? gallery : gallery.filter(g => g.category === filter)
  const current = index === null ? null : items[index]

  // Layout effect: open/close the native dialog in the same frame as the click.
  useLayoutEffect(() => {
    const d = dialog.current
    if (!d) return
    if (current && !d.open) d.showModal()
    if (!current && d.open) d.close()
  }, [current])

  const step = (dir) => setIndex(i => (i + dir + items.length) % items.length)
  const touch = useRef(null)

  return (
    <section className="section gallery" id="galeri" aria-labelledby="gallery-title">
      <div className="shell">
        <SectionHead kicker="Portofolio" id="gallery-title" title={<>Setiap potongan <em>adalah karya.</em></>}>
          Hasil cukur rambut pria di Dinasti. Ketuk foto atau video untuk melihat lebih besar.
        </SectionHead>
        <div className="filters" role="group" aria-label="Filter galeri" data-reveal>
          {['Semua', 'Foto', 'Video'].map(c => (
            <button key={c} aria-pressed={filter === c} onClick={() => { setFilter(c); setIndex(null) }}>{c}</button>
          ))}
        </div>
        <ul className="masonry">
          {items.map((g, i) => (
            <li key={g.src} className="pop" style={{ '--i': i % 8 }}>
              <button onClick={() => setIndex(i)} aria-label={`Lihat ${g.alt || 'karya Dinasti'}`}>
                {g.type === 'video'
                  ? <><InViewVideo src={g.src} label={g.alt} /><span className="badge"><Icon name="play" size={12} /> Video</span></>
                  : <img {...imageProps(g.src, '(max-width: 640px) 46vw, 300px')} alt={g.alt || 'Hasil cukur Dinasti Barbershop'} loading="lazy" decoding="async" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={current?.alt || 'Galeri'}
        onClose={() => setIndex(null)}
        onClick={e => e.target === e.currentTarget && setIndex(null)}
        onKeyDown={e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1) }}
        onTouchStart={e => { touch.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - (touch.current ?? e.changedTouches[0].clientX)
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
          touch.current = null
        }}
      >
        {current && (
          <>
            {current.type === 'video'
              ? <video key={current.src} {...videoProps(current.src)} controls autoPlay playsInline />
              : <img key={current.src} src={current.src} alt={current.alt || 'Hasil cukur Dinasti Barbershop'} />}
            <p className="lb-caption"><span>{current.alt}</span><span>{index + 1} / {items.length}</span></p>
          </>
        )}
        <button className="lb-btn lb-close" onClick={() => setIndex(null)} aria-label="Tutup"><Icon name="x" /></button>
        <button className="lb-btn lb-prev" onClick={() => step(-1)} aria-label="Sebelumnya"><Icon name="chev" className="flip" /></button>
        <button className="lb-btn lb-next" onClick={() => step(1)} aria-label="Berikutnya"><Icon name="chev" /></button>
      </dialog>
    </section>
  )
}

export function BehindTheChair() {
  const { videoUrl } = useSite()
  const [playing, setPlaying] = useState(false)
  const ref = useRef(null)
  return (
    <section className="section chair" id="video" aria-labelledby="video-title">
      <div className="shell chair-grid">
        <SectionHead kicker="Behind the chair" id="video-title" title={<>Lihat aksi <em>cukur presisi</em> kami.</>}>
          Saksikan sendiri bagaimana tangan Dinasti mengubah potongan biasa menjadi karya yang membangun rasa percaya diri.
        </SectionHead>
        <div className="chair-frame" data-reveal>
          <video ref={ref} {...videoProps(videoUrl)} controls={playing} playsInline
            aria-label="Video proses cukur di Dinasti Barbershop" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          {!playing && (
            <button className="chair-play" onClick={() => { ref.current?.play(); setPlaying(true) }} aria-label="Putar video">
              <Icon name="play" size={30} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
