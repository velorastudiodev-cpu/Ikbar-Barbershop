import { useMemo, useState } from 'react'
import { waLink } from '../data.js'
import { useSite } from '../site.js'
import { slotsFor, upcomingDays } from '../lib/hours.js'
import { Icon, SectionHead, useNow, useSchedule } from './ui.jsx'

function MenuList({ title, items, ask }) {
  const { wa } = useSite()
  return (
    <div className="menu-card" data-reveal>
      <h3>{title}</h3>
      <ul>
        {items.map(item => (
          <li key={item.name} className={item.highlight ? 'is-highlight' : ''}>
            <div className="menu-row">
              <span className="menu-name">{item.name}{item.highlight && <em>Populer</em>}</span>
              <span className="menu-dots" aria-hidden="true" />
              <span className="menu-price">{item.price}</span>
            </div>
            {item.desc && <p>{item.desc}</p>}
            {ask && /tanya/i.test(item.price || '') && (
              <a className="menu-ask" href={waLink(wa, `Halo Dinasti, saya mau tanya estimasi untuk ${item.name}`)} target="_blank" rel="noopener noreferrer">
                Tanya harga <Icon name="arrow" size={14} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Services() {
  const { wa, servicesUtama, servicesTambahan } = useSite()
  return (
    <section className="section services" id="layanan" aria-labelledby="services-title">
      <div className="shell">
        <SectionHead kicker="Layanan & harga" id="services-title" title={<>Menu <em>Dinasti.</em></>}>
          Semua layanan diawali konsultasi gratis. Harga bisa berubah, konfirmasi terbaru lewat WhatsApp.
        </SectionHead>
        <div className="menu-grid">
          <MenuList title="Style cukuran" items={servicesUtama} />
          <MenuList title="Layanan tambahan" items={servicesTambahan} ask />
        </div>
        <p className="menu-note" data-reveal>
          <Icon name="chat" size={18} /> Gaya yang kamu mau tidak ada di daftar?{' '}
          <a href={waLink(wa, 'Halo Dinasti, saya mau konsultasi gaya rambut yang tidak ada di daftar')} target="_blank" rel="noopener noreferrer">Konsultasikan via WhatsApp</a>
        </p>
      </div>
    </section>
  )
}

const CONSULT = 'Belum tahu, konsultasi dulu'

export function Booking() {
  const { wa, servicesUtama, servicesTambahan } = useSite()
  const now = useNow(), week = useSchedule()
  const [service, setService] = useState(CONSULT)
  const [offset, setOffset] = useState(null)
  const [time, setTime] = useState('')
  const [name, setName] = useState('')

  // Dates and remaining slots depend on the visitor's clock, so they only exist after mount.
  const days = useMemo(() => (now ? upcomingDays(7, now.date).map(d => ({
    ...d,
    slots: slotsFor(week, d.day, { after: d.offset === 0 ? now.minutes + 30 : -1 }),
  })) : []), [now, week])
  const firstOpen = days.find(d => d.slots.length)
  const chosen = days.find(d => d.offset === offset) || firstOpen
  const slots = chosen?.slots || []
  const chosenTime = slots.includes(time) ? time : ''

  const message = [
    'Halo Dinasti, saya mau booking kursi.',
    '',
    `• Layanan: ${service}`,
    chosen ? `• Hari: ${chosen.long}` : null,
    chosenTime ? `• Jam: ${chosenTime} WIB` : null,
    name.trim() ? `• Nama: ${name.trim()}` : null,
    '',
    'Apakah slot ini masih tersedia?',
  ].filter(l => l !== null).join('\n')

  return (
    <section className="section booking" id="booking" aria-labelledby="booking-title">
      <div className="shell booking-grid">
        <div>
          <SectionHead kicker="Booking kursi" id="booking-title" title={<>Datang tanpa <em>antre lama.</em></>}>
            Pilih layanan, hari, dan jam. Pesanmu langsung tersusun rapi di WhatsApp, tinggal kirim dan tunggu konfirmasi dari Dinasti.
          </SectionHead>
          <ol className="booking-steps" data-reveal>
            <li><b>1</b> Pilih layanan &amp; waktu</li>
            <li><b>2</b> Kirim lewat WhatsApp</li>
            <li><b>3</b> Dinasti konfirmasi slotmu</li>
          </ol>
        </div>

        <form className="booker" data-reveal onSubmit={e => e.preventDefault()} aria-label="Formulir booking">
          <label htmlFor="bk-service">Layanan</label>
          <select id="bk-service" value={service} onChange={e => setService(e.target.value)}>
            <option>{CONSULT}</option>
            <optgroup label="Style cukuran">{servicesUtama.map(s => <option key={s.name}>{s.name}</option>)}</optgroup>
            <optgroup label="Layanan tambahan">{servicesTambahan.map(s => <option key={s.name}>{s.name}</option>)}</optgroup>
          </select>

          <fieldset>
            <legend>Hari</legend>
            <div className="day-chips">
              {days.length === 0 && <span className="chip-placeholder">Memuat jadwal…</span>}
              {days.map(d => (
                <label key={d.offset} className={`day-chip ${d.slots.length ? '' : 'is-off'}`}>
                  <input type="radio" name="day" disabled={!d.slots.length} checked={chosen?.offset === d.offset}
                    onChange={() => { setOffset(d.offset); setTime('') }} />
                  <span>{d.offset === 0 ? 'Hari ini' : d.offset === 1 ? 'Besok' : d.short.split(' ')[0]}</span>
                  <b>{d.short.split(' ')[1]}</b>
                  <small>{d.slots.length ? `${d.slots.length} slot` : 'Tutup'}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor="bk-time">Jam</label>
          <select id="bk-time" value={chosenTime} onChange={e => setTime(e.target.value)} disabled={!slots.length}>
            <option value="">{slots.length ? 'Pilih jam (WIB)' : 'Tidak ada slot'}</option>
            {slots.map(t => <option key={t}>{t}</option>)}
          </select>

          <label htmlFor="bk-name">Nama <small>(opsional)</small></label>
          <input id="bk-name" type="text" autoComplete="given-name" maxLength={40} value={name} onChange={e => setName(e.target.value)} placeholder="Nama panggilanmu" />

          <a className={`btn btn-brass booker-send ${chosenTime ? '' : 'is-pending'}`} href={waLink(wa, message)} target="_blank" rel="noopener noreferrer">
            <Icon name="wa" size={18} /> {chosenTime ? `Booking ${chosen.short} · ${chosenTime}` : 'Kirim ke WhatsApp'}
          </a>
          <p className="booker-note">Jam tersedia mengikuti jam operasional. Slot final dikonfirmasi Dinasti lewat chat.</p>
        </form>
      </div>
    </section>
  )
}
