// Site content: built-in fallbacks plus the CMS (Supabase) loader.
// The CMS contract is unchanged from the previous site so the dashboard keeps working:
//   gallery_items(src, type, alt, title, description, category, sort_order)
//   services(name, description, price, category: 'utama' | 'tambahan', highlight, sort_order)
//   site_content(section in lokasi | kontak | barber | video, content jsonb); `about` is ignored, the crest is fixed
import { toDinasti } from './lib/brand.js'

export const FALLBACK = {
  wa: '6283110071825',
  ig: 'dinasti.barbershop',
  address: 'XJPF+78W, Jl. Raya Luragung - Kuningan, Margasari, Kec. Luragung, Kabupaten Kuningan, Jawa Barat 45581',
  mapsUrl: 'https://www.google.com/maps?q=Dinasti+Barbershop,+XJPF%2B78W,+Jl.+Raya+Luragung,+Kuningan&output=embed',
  hours: [
    { hari: 'Senin – Jumat', jam: '16:00 – 21:00', tutup: false },
    { hari: 'Sabtu', jam: '10:00 – 21:00', tutup: false },
    { hari: 'Minggu', jam: '10:00 – 21:00', tutup: false },
  ],
  barberPhoto: '/assets/barber-ikbar.jpg',
  videoUrl: '/assets/main-video.mp4',
  gallery: [
    { src: '/assets/gallery-1.jpg', type: 'image', alt: 'Low taper dengan tekstur atas natural', category: 'Foto' },
    { src: '/assets/gallery-2.jpg', type: 'image', alt: 'Taper fade dengan poni bertekstur', category: 'Foto' },
    { src: '/assets/gallery-3.jpg', type: 'image', alt: 'Mid fade dengan atas tebal bertekstur', category: 'Foto' },
    { src: '/assets/gallery-new-1.jpg', type: 'image', alt: 'Two block panjang dengan layer natural', category: 'Foto' },
    { src: '/assets/gallery-vid-1.mp4', type: 'video', alt: 'Proses cukur fade — video 1', category: 'Video' },
    { src: '/assets/gallery-vid-2.mp4', type: 'video', alt: 'Proses cukur fade — video 2', category: 'Video' },
    { src: '/assets/gallery-vid-3.mp4', type: 'video', alt: 'Proses cukur fade — video 3', category: 'Video' },
    { src: '/assets/gallery-new-vid-1.mp4', type: 'video', alt: 'Hasil cukur comma hair — video 4', category: 'Video' },
    { src: '/assets/gallery-new-vid-2.mp4', type: 'video', alt: 'Hasil cukur side part — video 5', category: 'Video' },
    { src: '/assets/gallery-new-vid-3.mp4', type: 'video', alt: 'Hasil cukur layer panjang — video 6', category: 'Video' },
    { src: '/assets/gallery-new-vid-4.mp4', type: 'video', alt: 'Hasil cukur two block — video 7', category: 'Video' },
  ],
  servicesUtama: [
    { name: 'Crew Cut', desc: 'Potongan pendek rapi, sisi bersih & atas pendek tipis', price: 'Rp 25.000' },
    { name: 'Undercut', desc: 'Sisi & belakang dicukur pendek, atas tetap panjang', price: 'Rp 25.000' },
    { name: 'Fade / Taper', desc: 'Gradasi halus dari pendek ke panjang — bersih & presisi', price: 'Rp 25.000' },
    { name: 'Skin Fade', desc: 'Fade sampai kulit — tampilan tajam & clean', price: 'Rp 25.000' },
    { name: 'Pompadour', desc: 'Volume tinggi ke depan, sisi pendek, berkesan maskulin', price: 'Rp 25.000' },
    { name: 'Slick Back', desc: 'Rambut disisir ke belakang, kesan formal & elegan', price: 'Rp 25.000' },
    { name: 'Textured Crop', desc: 'Atas bertekstur natural, sisi ringan — gaya kasual modern', price: 'Rp 25.000' },
    { name: 'Buzz Cut', desc: 'Serba pendek merata — tampilan simpel & bersih', price: 'Rp 25.000' },
  ],
  servicesTambahan: [
    { name: 'Perming', desc: 'Perming ala Korea untuk memaksimalkan tekstur dan volume rambut', price: 'Tanya Dinasti', highlight: true },
    { name: 'Creambath', desc: 'Perawatan rambut + pijat kepala relaksasi', price: 'Tanya Dinasti' },
    { name: 'Blow Dry & Styling', desc: 'Pengeringan & penataan gaya rambut akhir', price: 'Tanya Dinasti' },
  ],
}

// Optimised copies of the bundled media; CMS media (Supabase Storage) is used as-is.
const LOCAL_IMAGES = {
  '/assets/gallery-1.jpg': ['gallery-1', [320, 480, 960], 1024 / 1270],
  '/assets/gallery-2.jpg': ['gallery-2', [320, 480], 500 / 600],
  '/assets/gallery-3.jpg': ['gallery-3', [320, 480], 500 / 600],
  '/assets/gallery-new-1.jpg': ['gallery-new-1', [320, 480, 960], 1440 / 1800],
  '/assets/barber-ikbar.jpg': ['barber-ikbar', [480, 640, 900], 900 / 1600],
}
const LOCAL_POSTERS = new Set(['barbershop-video', 'main-video', 'gallery-vid-1', 'gallery-vid-2', 'gallery-vid-3', 'gallery-new-vid-1', 'gallery-new-vid-2', 'gallery-new-vid-3', 'gallery-new-vid-4'])

/** <img> attributes for a media URL: WebP srcset for bundled images, plain src otherwise. */
export function imageProps(src, sizes) {
  const local = LOCAL_IMAGES[src]
  if (!local) return { src }
  const [name, widths, ratio] = local
  const w = widths.at(-1)
  return {
    src: `/img/${name}-${widths[0]}.webp`,
    srcSet: widths.map(x => `/img/${name}-${x}.webp ${x}w`).join(', '),
    sizes,
    width: w,
    height: Math.round(w / ratio),
  }
}

/** Poster frame for bundled videos (480px, or a smaller `size` for thumbnails); CMS videos fall back to their own first frame. */
export function posterFor(src = '', size) {
  const m = src.match(/^\/assets\/([\w-]+)\.mp4$/)
  return m && LOCAL_POSTERS.has(m[1]) ? `/img/posters/${m[1]}${size ? `-${size}` : ''}.webp` : undefined
}

/**
 * Video attributes: bundled clips have poster images; uploaded clips don't, so they load just enough
 * (`#t=0.1`, metadata) to show their first frame instead of an empty box.
 */
export function videoProps(src, posterSize) {
  const poster = posterFor(src, posterSize)
  return poster ? { src, poster, preload: 'none' } : { src: src && `${src}#t=0.1`, preload: 'metadata' }
}

export const waLink = (wa, message) => `https://wa.me/${wa}?text=${encodeURIComponent(message)}`

// Guards inherited from the previous site: older CMS rows may still carry the Ikbar name or placeholders.
const clean = (value, reject) => (typeof value === 'string' && value.trim() && !reject.test(value) ? value.trim() : null)

/** Reads CMS content through a Supabase client; resolves to a full site object, or the fallback without a client. */
export async function loadSiteData(supabase) {
  if (!supabase) return FALLBACK
  const [gallery, services, content] = await Promise.all([
    supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }),
    supabase.from('services').select('*').order('sort_order', { ascending: true }),
    supabase.from('site_content').select('section, content').in('section', ['lokasi', 'kontak', 'barber', 'video']),
  ])
  const sections = Object.fromEntries((content.data || []).map(row => [row.section, row.content || {}]))
  const svc = (services.data || []).map(s => ({ ...s, name: toDinasti(s.name), desc: toDinasti(s.desc ?? s.description), price: toDinasti(s.price) }))
  const utama = svc.filter(s => s.category === 'utama'), tambahan = svc.filter(s => s.category === 'tambahan')
  const { lokasi = {}, kontak = {}, barber = {}, video = {} } = sections
  return {
    wa: clean(kontak.wa_number, /^$/)?.replace(/\D/g, '') || FALLBACK.wa,
    ig: clean(kontak.instagram, /ikbar/i)?.replace(/^@/, '') || FALLBACK.ig,
    address: clean(lokasi.address, /ikbar|isi alamat/i) || FALLBACK.address,
    mapsUrl: clean(lokasi.maps_url, /Toko Iwan|Ikbar/i) || FALLBACK.mapsUrl,
    hours: lokasi.hours_data?.length ? lokasi.hours_data : FALLBACK.hours,
    barberPhoto: clean(barber.photo_url, /^$/) || FALLBACK.barberPhoto,
    videoUrl: clean(video.video_url, /^$/) || FALLBACK.videoUrl,
    gallery: gallery.data?.length ? gallery.data.map(g => ({ ...g, alt: toDinasti(g.title || g.description || g.alt) })) : FALLBACK.gallery,
    servicesUtama: utama.length ? utama : FALLBACK.servicesUtama,
    servicesTambahan: tambahan.length ? tambahan : FALLBACK.servicesTambahan,
  }
}
