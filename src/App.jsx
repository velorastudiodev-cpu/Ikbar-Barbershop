import { useEffect, useState } from 'react'
import { FALLBACK, loadSiteData } from './data.js'
import { SiteContext } from './site.js'
import { weekSchedule, fmt } from './lib/hours.js'
import { useRevealObserver } from './components/ui.jsx'
import { Header, Hero } from './components/Top.jsx'
import { About, Barber, Reasons } from './components/Story.jsx'
import { Gallery, BehindTheChair } from './components/Media.jsx'
import { Services, Booking } from './components/Book.jsx'
import { Location, Contact, Footer, WaFloat } from './components/Visit.jsx'

const SITE = 'https://ikbar-barbershop.vercel.app'
const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Schema({ site }) {
  const offer = (s) => {
    const price = String(s.price || '').replace(/[^0-9]/g, '')
    return { '@type': 'Offer', name: s.name, itemOffered: { '@type': 'Service', name: s.name, description: s.desc }, ...(price ? { price, priceCurrency: 'IDR' } : {}) }
  }
  const hours = weekSchedule(site.hours).flatMap((r, d) => (r ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_EN[d], opens: fmt(r[0]), closes: fmt(r[1]) }] : []))
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['BarberShop', 'HairSalon', 'LocalBusiness'],
        '@id': `${SITE}/#barbershop`,
        name: 'Dinasti Barbershop',
        alternateName: ['Ikbar Barbershop', 'Dinasti Barbershop Luragung Kuningan'],
        description: 'Barbershop pria di Luragung, Kabupaten Kuningan dengan konsep warisan keluarga dan konsultasi personal gratis sebelum cukur.',
        url: `${SITE}/`,
        telephone: `+${site.wa}`,
        priceRange: 'Rp 25.000',
        currenciesAccepted: 'IDR',
        paymentAccepted: 'Cash, QRIS, Transfer',
        image: `${SITE}/assets/og-image.jpg`,
        logo: `${SITE}/assets/logo-dinasti.svg`,
        address: { '@type': 'PostalAddress', streetAddress: site.address, addressLocality: 'Kec. Luragung, Kabupaten Kuningan', addressRegion: 'Jawa Barat', postalCode: '45581', addressCountry: 'ID' },
        geo: { '@type': 'GeoCoordinates', latitude: -6.9825, longitude: 108.6185 },
        openingHoursSpecification: hours,
        sameAs: [`https://www.instagram.com/${site.ig}/`, `https://wa.me/${site.wa}`],
        areaServed: ['Luragung', 'Kuningan', 'Cidahu', 'Ciawigebang', 'Cibingbin', 'Ciwaru'],
        founder: { '@type': 'Person', name: 'Ikbar Kamil', jobTitle: 'Head Barber & Founder' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Layanan Dinasti Barbershop',
          itemListElement: [
            { '@type': 'OfferCatalog', name: 'Style cukuran + konsultasi gratis', itemListElement: site.servicesUtama.map(offer) },
            { '@type': 'OfferCatalog', name: 'Layanan tambahan', itemListElement: site.servicesTambahan.map(offer) },
          ],
        },
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export default function App({ initial }) {
  const [site, setSite] = useState(initial || FALLBACK)
  useRevealObserver()

  useEffect(() => {
    // The prerendered page already shows fallback content; fetch the CMS once the browser is idle.
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300))
    // supabase-js is split into its own chunk so it never delays the first paint.
    idle(() => import('./lib/supabase.js').then(m => loadSiteData(m.supabase)).then(setSite).catch(() => {}), { timeout: 2500 })
  }, [])

  return (
    <SiteContext.Provider value={site}>
      <a className="skip-link" href="#main">Lewati ke konten utama</a>
      <Header />
      <main id="main">
        <div id="top" />
        <Hero />
        <About />
        <Barber />
        <Reasons />
        <Gallery />
        <BehindTheChair />
        <Services />
        <Booking />
        <Location />
        <Contact />
      </main>
      <Footer />
      <WaFloat />
      <Schema site={site} />
    </SiteContext.Provider>
  )
}
