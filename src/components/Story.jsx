import { waLink, imageProps } from '../data.js'
import { useSite } from '../site.js'
import { Icon, SectionHead } from './ui.jsx'

export function About() {
  return (
    <section className="section about" id="tentang" aria-labelledby="about-title">
      <div className="shell about-grid">
        <figure className="crest" data-reveal>
          {/* Always the dark-theme crest: the CMS photo slot still holds the old white-background crest, which used to replace it after load. */}
          <img src="/img/crest-360.webp" srcSet="/img/crest-360.webp 360w, /img/crest-480.webp 480w, /img/crest-720.webp 720w" sizes="(max-width: 860px) 60vw, 340px" alt="Lambang Dinasti Barbershop: mahkota, rumah, dan gunting" width="360" height="470" loading="lazy" decoding="async" />
          <figcaption><span>Berdiri</span><b>2024</b></figcaption>
        </figure>
        <div>
          <SectionHead kicker="Tentang kami" id="about-title" title={<>Seni cukur, <em>warisan keluarga.</em></>} />
          <div className="prose" data-reveal>
            <p>Dinasti Barbershop lahir dari keahlian memotong rambut yang diwariskan turun-temurun di keluarga. Sejak 2024 kami hadir dengan satu prinsip: setiap pelanggan berhak mendapat konsultasi personal sebelum gunting menyentuh rambut.</p>
            <p>Dulu dikenal sebagai <b>Ikbar Barbershop</b>, kini resmi bernama <b>Dinasti</b>. Kursinya sama, tangan yang memotong pun sama.</p>
          </div>
          <ul className="pillars">
            {[
              ['chat', 'Konsultasi sebelum cukur', 'Diskusi dulu soal bentuk wajah, gaya hidup, dan rambutmu, baru eksekusi.'],
              ['crown', 'Keahlian turun-temurun', 'Teknik yang diwariskan dari generasi ke generasi keluarga Dinasti.'],
              ['blade', 'Presisi & detail', 'Garis tepi bersih, gradasi halus, hasil yang konsisten.'],
            ].map(([icon, title, desc], i) => (
              <li key={title} data-reveal style={{ '--d': i }}><Icon name={icon} size={22} /><div><h3>{title}</h3><p>{desc}</p></div></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function Barber() {
  const { wa, barberPhoto } = useSite()
  return (
    <section className="section barber" id="barber" aria-labelledby="barber-title">
      <div className="shell barber-grid">
        <figure className="barber-photo" data-reveal>
          <img {...imageProps(barberPhoto, '(max-width: 860px) 80vw, 440px')} alt="Ikbar Kamil, Head Barber dan Founder Dinasti Barbershop" loading="lazy" decoding="async" />
          <figcaption><i aria-hidden="true" /> Ready to cut</figcaption>
        </figure>
        <div className="barber-copy">
          <p className="kicker" data-reveal>Profil barber</p>
          <h2 id="barber-title" data-reveal>Ikbar Kamil</h2>
          <p className="barber-role" data-reveal>Head Barber &amp; Founder · Dinasti Barbershop</p>
          <dl className="barber-stats" data-reveal>
            <div><dt>Tahun pengalaman</dt><dd>2+</dd></div>
            <div><dt>Pelanggan puas</dt><dd>500+</dd></div>
            <div><dt>Konsultasi dulu</dt><dd>100%</dd></div>
          </dl>
          <p data-reveal>Ikbar bukan hanya seorang barber. Ia penerus tradisi keluarga dalam seni memotong rambut. Dengan pendekatan yang sabar dan teliti, ia memastikan setiap pelanggan meninggalkan kursinya dengan rasa percaya diri yang lebih tinggi.</p>
          <blockquote data-reveal>“Rambut yang bagus dimulai dari percakapan yang baik.”</blockquote>
          <ul className="tags" data-reveal aria-label="Spesialisasi">
            {['Precision fade & taper', 'Classic scissor cut', 'Korean perm & styling'].map(t => <li key={t}>{t}</li>)}
          </ul>
          <a className="btn btn-brass" data-reveal href={waLink(wa, 'Halo Ikbar, boleh tanya-tanya soal potongan rambut yang cocok buat saya?')} target="_blank" rel="noopener noreferrer">
            Tanya langsung ke Ikbar <Icon name="arrow" size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}

const REASONS = [
  ['Konsultasi personal', 'Setiap sesi diawali diskusi. Kami pahami gaya hidup dan preferensimu sebelum mulai.'],
  ['Warisan keluarga', 'Keahlian yang tidak dari kursus biasa, tapi mengalir lewat generasi keluarga.'],
  ['Teknik premium', 'Alat berkualitas yang terawat, dipakai dengan teknik yang tepat.'],
  ['Presisi tinggi', 'Garis tepi bersih, gradasi halus, hasil konsisten setiap kali.'],
  ['Suasana nyaman', 'Tempat yang bersih dan tenang, bikin kamu rileks dari awal sampai akhir.'],
  ['Tanpa buru-buru', 'Layanan one-on-one. Selama sesi, kamu prioritas utama.'],
]
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

export function Reasons() {
  return (
    <section className="section reasons" aria-labelledby="why-title">
      <div className="shell">
        <SectionHead kicker="Keunggulan" id="why-title" title={<>Kenapa memilih <em>Dinasti?</em></>}>
          Kami tidak hanya memotong rambut. Kami membangun rasa percaya dirimu.
        </SectionHead>
        <ol className="reason-grid">
          {REASONS.map(([title, desc], i) => (
            <li key={title} data-reveal style={{ '--d': i % 3 }}>
              <span className="roman" aria-hidden="true">{ROMAN[i]}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
