'use client'

import { useActionState, useRef, useState } from 'react'
import {
  updateSiteContent,
  addGalleryItem, deleteGalleryItem,
  addService, updateService, deleteService,
} from '@/app/actions/cms'
import { ConfirmModal, Field, Icon, Notice, PageHeader, TabPanel, Tabs, useActionToast, useTab, useToast } from '@/components/ui'
import { joinJam, normalizeIg, normalizeWa, parseJam, SITE_URL } from '@/lib/format'

// Same limits the server enforces (lib/security.js); checked here only to give a friendly message before uploading.
const LIMITS = { image: 5 * 1024 * 1024, video: 50 * 1024 * 1024 }
const kindOf = (file) => (file.type.startsWith('video/') ? 'video' : 'image')

/** Uploads through the existing /api/upload route, reporting progress. Resolves to { url, path }. */
function uploadFile(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    if (file.size > LIMITS[kindOf(file)]) return reject(new Error(kindOf(file) === 'video' ? 'Video maksimal 50MB' : 'Foto maksimal 5MB'))
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 90))
    xhr.onload = () => {
      let body = {}
      try { body = JSON.parse(xhr.responseText) } catch { /* handled below */ }
      if (xhr.status >= 200 && xhr.status < 300 && body.url) { onProgress?.(100); resolve(body) }
      else reject(new Error(body.error || 'Upload gagal'))
    }
    xhr.onerror = () => reject(new Error('Koneksi terputus. Coba lagi.'))
    xhr.ontimeout = () => reject(new Error('Upload terlalu lama. Coba file yang lebih kecil atau koneksi yang lebih stabil.'))
    xhr.timeout = 120000
    xhr.open('POST', '/api/upload')
    xhr.send(fd)
  })
}

/** Saves one site_content section through the existing server action. */
function saveSection(section, content) {
  const fd = new FormData()
  fd.append('section', section)
  fd.append('content', JSON.stringify(content))
  return updateSiteContent(null, fd)
}

function DropZone({ accept, multiple, onFiles, label, hint, busy }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  return (
    <div className={`dropzone${over ? ' is-over' : ''}${busy ? ' is-busy' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy && e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]) }}>
      <input ref={input} type="file" accept={accept} multiple={multiple} hidden
        onChange={(e) => { if (e.target.files.length) onFiles([...e.target.files]); e.target.value = '' }} />
      <Icon name="upload" size={26} />
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>{label}</button>
      <span className="form-hint">{hint}</span>
    </div>
  )
}

function Progress({ value }) {
  return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${value}%` }} /></div>
}

/** Relative paths point at the website's bundled files, which this domain doesn't serve. */
function MediaPreview({ src, type, alt = '', controls, emptyLabel = 'Belum ada file' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed || src.startsWith('/')) {
    const label = !src ? emptyLabel : src.startsWith('/') ? 'File bawaan website' : 'Pratinjau tidak tersedia'
    return <div className="media-fallback"><Icon name={type === 'video' ? 'video' : 'image'} size={22} /><span>{label}</span></div>
  }
  // "#t=0.1" makes the browser show the first frame instead of an empty box.
  return type === 'video'
    ? <video src={`${src}#t=0.1`} muted playsInline preload="metadata" controls={controls} onError={() => setFailed(true)} />
    // Plain <img>: these are user uploads on Supabase Storage, and next/image would need extra remote-host config.
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}

// ══════════════════════════════════════════════════════════════════════
// GALERI
// ══════════════════════════════════════════════════════════════════════
function TabGaleri({ gallery, toast }) {
  const [caption, setCaption] = useState('')
  const [queue, setQueue] = useState([])
  const [filter, setFilter] = useState('Semua')
  const [removed, setRemoved] = useState(() => new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)
  const busy = queue.some((q) => q.status === 'uploading')

  const patch = (key, change) => setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...change } : item)))

  const handleFiles = async (files) => {
    const jobs = files.map((file, i) => ({ key: `${Date.now()}-${i}`, file, name: file.name, progress: 0, status: 'uploading' }))
    setQueue((q) => [...q.filter((x) => x.status === 'uploading'), ...jobs])
    let ok = 0
    // One at a time keeps phone uploads reliable on a weak connection.
    for (const job of jobs) {
      try {
        const { url } = await uploadFile(job.file, 'gallery', (progress) => patch(job.key, { progress }))
        const fd = new FormData()
        fd.append('src', url)
        fd.append('type', kindOf(job.file))
        fd.append('alt', caption.trim())
        const res = await addGalleryItem(null, fd)
        if (res?.error) throw new Error(res.error)
        patch(job.key, { status: 'done', progress: 100 })
        ok++
      } catch (err) {
        patch(job.key, { status: 'error', error: err.message })
      }
    }
    if (ok) { toast(ok === 1 ? 'Foto/video masuk ke galeri website' : `${ok} file masuk ke galeri website`); setCaption('') }
    if (ok < jobs.length) toast('Ada file yang gagal diupload. Lihat keterangannya di bawah.', 'error')
  }

  const handleDelete = async () => {
    const res = await deleteGalleryItem(deleteTarget)
    if (res?.error) toast(res.error, 'error')
    else { setRemoved((s) => new Set(s).add(deleteTarget)); toast('Item dihapus dari galeri') }
    setDeleteTarget(null)
  }

  const items = gallery.filter((g) => !removed.has(g.id))
  const counts = { Semua: items.length, Foto: items.filter((g) => g.category === 'Foto').length, Video: items.filter((g) => g.category === 'Video').length }
  const shown = filter === 'Semua' ? items : items.filter((g) => g.category === filter)

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Tambah ke galeri</div>
            <div className="panel-sub">Tampil di bagian Galeri website. Pilih beberapa file sekaligus juga bisa.</div>
          </div>
        </div>
        <div className="panel-body stack-sm">
          <Field label="Keterangan" id="gallery-caption" hint="Opsional. Dipakai untuk semua file yang diupload sekarang.">
            <input id="gallery-caption" className="form-input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Misal: Skin fade + textured crop" />
          </Field>
          <DropZone accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" multiple busy={busy} onFiles={handleFiles}
            label="Pilih foto / video" hint="Atau seret file ke sini · Foto maks. 5MB · Video maks. 50MB" />
          {queue.length > 0 && (
            <ul className="upload-list">
              {queue.map((q) => (
                <li key={q.key} className={`is-${q.status}`}>
                  <Icon name={q.status === 'done' ? 'check' : q.status === 'error' ? 'x' : 'upload'} size={15} />
                  <span className="upload-name">{q.name}</span>
                  {q.status === 'uploading' && <Progress value={q.progress} />}
                  {q.status === 'done' && <span className="upload-status">Masuk galeri</span>}
                  {q.status === 'error' && <span className="upload-status">{q.error}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Isi galeri</div>
          <div className="chips" role="group" aria-label="Filter galeri">
            {['Semua', 'Foto', 'Video'].map((c) => (
              <button key={c} type="button" className={`chip${filter === c ? ' active' : ''}`} aria-pressed={filter === c} onClick={() => setFilter(c)}>{c} ({counts[c]})</button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="empty-state"><Icon name="image" size={28} /><p>Belum ada {filter === 'Semua' ? 'isi' : filter.toLowerCase()} di galeri.</p></div>
        ) : (
          <ul className="media-grid">
            {shown.map((item) => (
              <li key={item.id} className="media-tile">
                <MediaPreview src={item.src} type={item.type} alt={item.alt} />
                {item.type === 'video' && <span className="media-badge"><Icon name="play" size={11} /> Video</span>}
                <div className="media-foot">
                  <span>{item.alt || 'Tanpa keterangan'}</span>
                  <button type="button" className="btn-icon btn-icon-danger" onClick={() => setDeleteTarget(item.id)} aria-label={`Hapus ${item.alt || 'item galeri'}`}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && <ConfirmModal title="Hapus dari galeri?" message="Foto/video ini akan hilang dari website." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// LAYANAN & HARGA
// ══════════════════════════════════════════════════════════════════════
const PRICE_CHIPS = ['Rp 25.000', 'Rp 30.000', 'Tanya Dinasti']
const CATEGORY_LABEL = { utama: 'Style cukuran', tambahan: 'Layanan tambahan' }

function ServiceForm({ service, action, pending, error, onCancel, submitLabel }) {
  const [price, setPrice] = useState(service?.price || '')
  const key = service?.id || 'new'
  return (
    <form action={action} className="edit-form">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="form-row">
        <Field label="Nama layanan" id={`svc-name-${key}`} name="name" defaultValue={service?.name} placeholder="Misal: Crew Cut" required />
        <Field label="Kategori" id={`svc-cat-${key}`}>
          <select id={`svc-cat-${key}`} name="category" className="form-input" defaultValue={service?.category || 'utama'}>
            <option value="utama">Style cukuran (utama)</option>
            <option value="tambahan">Layanan tambahan</option>
          </select>
        </Field>
        <div className="form-group">
          <label className="form-label" htmlFor={`svc-price-${key}`}>Harga<span className="req" aria-hidden="true">*</span></label>
          <input id={`svc-price-${key}`} name="price" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Rp 25.000" required />
          <div className="chips">{PRICE_CHIPS.map((p) => <button key={p} type="button" className={`chip${price === p ? ' active' : ''}`} onClick={() => setPrice(p)}>{p}</button>)}</div>
        </div>
        <Field label="Deskripsi singkat" id={`svc-desc-${key}`} className="span-2">
          <textarea id={`svc-desc-${key}`} name="description" className="form-input" rows={2} defaultValue={service?.description} placeholder="Misal: Potongan pendek rapi, sisi bersih" />
        </Field>
      </div>
      <label className="check">
        <input type="checkbox" name="highlight" value="true" defaultChecked={!!service?.highlight} />
        <span><b>Tandai &quot;Populer&quot;</b><small>Muncul label Populer di website</small></span>
      </label>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}><Icon name="check" size={15} /> {pending ? 'Menyimpan…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>}
      </div>
    </form>
  )
}

function TabLayanan({ services, toast }) {
  const [adding, setAdding] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [addState, addAction, addPending] = useActionState(addService, null)
  const [editState, editAction, editPending] = useActionState(updateService, null)
  useActionToast(addState, toast, 'Layanan ditambahkan ke website', () => setAdding(false))
  useActionToast(editState, toast, 'Layanan diperbarui', () => setEditRow(null))

  const handleDelete = async () => {
    const res = await deleteService(deleteTarget)
    setDeleteTarget(null)
    if (res?.error) toast(res.error, 'error')
    else toast('Layanan dihapus')
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <p className="muted">Daftar ini tampil di bagian Layanan &amp; Harga website.</p>
        {!adding && <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={15} /> Tambah layanan</button>}
      </div>

      {adding && (
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Layanan baru</div></div>
          <div className="panel-body">
            <ServiceForm action={addAction} pending={addPending} error={addState?.error} onCancel={() => setAdding(false)} submitLabel="Tambah layanan" />
          </div>
        </div>
      )}

      {['utama', 'tambahan'].map((cat) => {
        const list = services.filter((s) => s.category === cat)
        return (
          <div key={cat} className="panel">
            <div className="panel-header">
              <div className="panel-title">{CATEGORY_LABEL[cat]}</div>
              <div className="panel-sub">{list.length} layanan</div>
            </div>
            {list.length === 0 ? (
              <div className="empty-state"><Icon name="scissors" size={28} /><p>Belum ada layanan di kategori ini.</p></div>
            ) : (
              <ul className="item-list">
                {list.map((s) => (
                  <li key={s.id} className={editRow === s.id ? 'is-editing' : ''}>
                    {editRow === s.id ? (
                      <ServiceForm service={s} action={editAction} pending={editPending} error={editState?.error} onCancel={() => setEditRow(null)} submitLabel="Simpan" />
                    ) : (
                      <>
                        <div className="item-main">
                          <b>{s.name} {s.highlight && <span className="badge badge-star"><Icon name="star" size={10} /> Populer</span>}</b>
                          {s.description && <small>{s.description}</small>}
                        </div>
                        <span className="item-price">{s.price}</span>
                        <div className="row-actions">
                          <button type="button" className="btn-icon" onClick={() => setEditRow(s.id)} aria-label={`Ubah ${s.name}`}><Icon name="edit" size={15} /><span>Ubah</span></button>
                          <button type="button" className="btn-icon btn-icon-danger" onClick={() => setDeleteTarget(s.id)} aria-label={`Hapus ${s.name}`}><Icon name="trash" size={15} /><span>Hapus</span></button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}

      {deleteTarget && <ConfirmModal title="Hapus layanan?" message="Layanan ini akan hilang dari daftar harga di website." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// JAM BUKA
// ══════════════════════════════════════════════════════════════════════
const DAY_SUGGESTIONS = ['Setiap hari', 'Senin – Jumat', 'Senin – Sabtu', 'Sabtu – Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

function HourRow({ row, onChange, onRemove, index }) {
  const times = parseJam(row.jam)
  const [open, close] = times || ['', '']
  // Hours written in a format the time pickers can't read stay editable as text.
  const freeText = !times && row.jam && !row.tutup
  return (
    <li className={`hour-row${row.tutup ? ' is-closed' : ''}`}>
      <div className="form-group">
        <label className="form-label" htmlFor={`hari-${index}`}>Hari</label>
        <input id={`hari-${index}`} className="form-input" list="day-suggestions" value={row.hari} onChange={(e) => onChange({ hari: e.target.value })} placeholder="Senin – Jumat" />
      </div>
      {freeText ? (
        <div className="form-group">
          <label className="form-label" htmlFor={`jam-${index}`}>Jam</label>
          <input id={`jam-${index}`} className="form-input" value={row.jam} onChange={(e) => onChange({ jam: e.target.value })} />
          <span className="form-hint">Tulis seperti 16:00 – 21:00 agar status Buka/Tutup di website akurat.</span>
        </div>
      ) : (
        <div className="hour-times">
          <div className="form-group">
            <label className="form-label" htmlFor={`buka-${index}`}>Buka</label>
            <input id={`buka-${index}`} type="time" className="form-input" value={open} disabled={row.tutup} onChange={(e) => onChange({ jam: joinJam(e.target.value, close || '21:00') })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`tutup-${index}`}>Tutup</label>
            <input id={`tutup-${index}`} type="time" className="form-input" value={close} disabled={row.tutup} onChange={(e) => onChange({ jam: joinJam(open || '10:00', e.target.value) })} />
          </div>
        </div>
      )}
      <label className="switch">
        <input type="checkbox" checked={!!row.tutup} onChange={(e) => onChange({ tutup: e.target.checked })} />
        <span>Libur</span>
      </label>
      <button type="button" className="btn-icon btn-icon-danger" onClick={onRemove} aria-label={`Hapus baris ${row.hari || index + 1}`}><Icon name="trash" size={15} /></button>
    </li>
  )
}

function TabJam({ lokasi, toast }) {
  const saved = lokasi.hours_data || [
    { hari: 'Senin – Jumat', jam: '16:00 – 21:00', tutup: false },
    { hari: 'Sabtu', jam: '10:00 – 21:00', tutup: false },
    { hari: 'Minggu', jam: '10:00 – 21:00', tutup: false },
  ]
  const [hours, setHours] = useState(saved)
  const [saveState, saveAction, savePending] = useActionState(updateSiteContent, null)
  useActionToast(saveState, toast, 'Jam buka tersimpan, website ikut berubah')
  const dirty = JSON.stringify(hours) !== JSON.stringify(saved)

  const update = (i, change) => setHours((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...change } : h)))

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Jam buka</div>
          <div className="panel-sub">Dipakai untuk status &quot;Buka / Tutup sekarang&quot; dan jadwal booking di website.</div>
        </div>
      </div>
      <div className="panel-body stack-sm">
        <datalist id="day-suggestions">{DAY_SUGGESTIONS.map((d) => <option key={d} value={d} />)}</datalist>
        <ul className="hour-list">
          {hours.map((h, i) => <HourRow key={i} index={i} row={h} onChange={(c) => update(i, c)} onRemove={() => setHours((p) => p.filter((_, idx) => idx !== i))} />)}
        </ul>
        <div>
          <button type="button" className="btn btn-ghost" onClick={() => setHours((p) => [...p, { hari: '', jam: '10:00 – 21:00', tutup: false }])}>
            <Icon name="plus" size={15} /> Tambah baris
          </button>
        </div>
        <Notice>Baris yang lebih bawah menimpa yang di atas. Contoh: &quot;Setiap hari 10:00 – 21:00&quot; lalu &quot;Jumat · Libur&quot;.</Notice>
        <form action={saveAction}>
          <input type="hidden" name="section" value="lokasi" />
          <input type="hidden" name="content" value={JSON.stringify({ ...lokasi, hours_data: hours })} />
          {saveState?.error && <div className="form-error">{saveState.error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={savePending || !dirty} id="btn-simpan-jam">
              <Icon name="check" size={16} /> {savePending ? 'Menyimpan…' : dirty ? 'Simpan jam buka' : 'Tersimpan'}
            </button>
            {dirty && <span className="unsaved">Ada perubahan yang belum disimpan</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// LOKASI & KONTAK
// ══════════════════════════════════════════════════════════════════════
function TabLokasi({ lokasi, kontak, toast }) {
  const [address, setAddress] = useState(lokasi.address || '')
  const [mapsUrl, setMapsUrl] = useState(lokasi.maps_url || '')
  const [wa, setWa] = useState(kontak.wa_number || '')
  const [ig, setIg] = useState(kontak.instagram || '')
  const [lokasiState, lokasiAction, lokasiPending] = useActionState(updateSiteContent, null)
  const [kontakState, kontakAction, kontakPending] = useActionState(updateSiteContent, null)
  useActionToast(lokasiState, toast, 'Lokasi tersimpan')
  useActionToast(kontakState, toast, 'Kontak tersimpan')

  const waDigits = normalizeWa(wa)
  const mapsCheck = /^https?:\/\//.test(mapsUrl.trim()) ? mapsUrl.trim() : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || 'Dinasti Barbershop')}`

  return (
    <div className="split">
      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">Lokasi</div><div className="panel-sub">Bagian Lokasi &amp; peta di website</div></div></div>
        <div className="panel-body">
          <form action={lokasiAction} className="stack-sm">
            <input type="hidden" name="section" value="lokasi" />
            <input type="hidden" name="content" value={JSON.stringify({ ...lokasi, address, maps_url: mapsUrl.trim() })} />
            <Field label="Alamat lengkap" id="lokasi-address">
              <textarea id="lokasi-address" className="form-input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Raya Luragung…" />
            </Field>
            <Field label="Link Google Maps" id="lokasi-maps"
              hint="Buka Google Maps → cari Dinasti Barbershop → Bagikan → Salin link, lalu tempel di sini. Kode “Sematkan peta” juga bisa. Website otomatis mengubahnya jadi peta.">
              <input id="lokasi-maps" className="form-input" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/…" />
            </Field>
            <a className="link-inline" href={mapsCheck} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={14} /> Cek lokasinya di Google Maps</a>
            {lokasiState?.error && <div className="form-error">{lokasiState.error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={lokasiPending} id="btn-simpan-lokasi"><Icon name="check" size={15} /> {lokasiPending ? 'Menyimpan…' : 'Simpan lokasi'}</button>
            </div>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">Kontak</div><div className="panel-sub">Semua tombol WhatsApp &amp; Instagram di website</div></div></div>
        <div className="panel-body">
          <form action={kontakAction} className="stack-sm">
            <input type="hidden" name="section" value="kontak" />
            <input type="hidden" name="content" value={JSON.stringify({ ...kontak, wa_number: waDigits, instagram: normalizeIg(ig) })} />
            <Field label="Nomor WhatsApp" id="kontak-wa" hint="Boleh ditulis 0831… atau +62 831…, otomatis dirapikan.">
              <input id="kontak-wa" className="form-input" inputMode="tel" value={wa} onChange={(e) => setWa(e.target.value)} onBlur={() => setWa(normalizeWa(wa))} placeholder="0831 1007 1825" />
            </Field>
            {waDigits.length >= 10
              ? <a className="link-inline" href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={14} /> Tes: buka chat wa.me/{waDigits}</a>
              : wa && <span className="form-error">Nomor terlalu pendek.</span>}
            <Field label="Instagram" id="kontak-ig" hint="Username saja, atau tempel link profilnya.">
              <input id="kontak-ig" className="form-input" value={ig} onChange={(e) => setIg(e.target.value)} onBlur={() => setIg(normalizeIg(ig))} placeholder="dinasti.barbershop" autoCapitalize="none" />
            </Field>
            {normalizeIg(ig) && <a className="link-inline" href={`https://www.instagram.com/${normalizeIg(ig)}/`} target="_blank" rel="noopener noreferrer"><Icon name="external" size={14} /> Tes: buka @{normalizeIg(ig)}</a>}
            {kontakState?.error && <div className="form-error">{kontakState.error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={kontakPending || waDigits.length < 10} id="btn-simpan-kontak"><Icon name="check" size={15} /> {kontakPending ? 'Menyimpan…' : 'Simpan kontak'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// VIDEO & FOTO PROFIL (upload = langsung terpasang)
// ══════════════════════════════════════════════════════════════════════
function MediaSlot({ title, sub, type, folder, current, onUploaded, onReset, accept, hint, emptyLabel }) {
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const handle = async ([file]) => {
    setError(null)
    setProgress(0)
    try {
      const { url } = await uploadFile(file, folder, setProgress)
      await onUploaded(url)
    } catch (err) {
      setError(err.message)
    }
    setProgress(null)
  }
  return (
    <div className="panel">
      <div className="panel-header"><div><div className="panel-title">{title}</div><div className="panel-sub">{sub}</div></div></div>
      <div className="panel-body media-slot">
        <div className={`media-current is-${type}`}><MediaPreview key={current} src={current} type={type} controls emptyLabel={emptyLabel} /></div>
        <div className="stack-sm">
          <DropZone accept={accept} busy={progress !== null} onFiles={handle} label={type === 'video' ? 'Ganti video' : 'Ganti foto'} hint={hint} />
          {progress !== null && <><span className="form-hint">Mengupload… {progress}%</span><Progress value={progress} /></>}
          {error && <div className="form-error">{error}</div>}
          <span className="form-hint">Setelah upload selesai, file langsung terpasang di website.</span>
          {onReset && current && <button type="button" className="btn btn-ghost" onClick={onReset}>Pakai lambang Dinasti bawaan</button>}
        </div>
      </div>
    </div>
  )
}

function TabMedia({ siteContent, toast }) {
  const [video, setVideo] = useState(siteContent.video?.video_url || '')
  const [about, setAbout] = useState(siteContent.about?.image_url || '')
  const [barber, setBarber] = useState(siteContent.barber?.photo_url || '')
  const apply = (section, field, set, label) => async (url) => {
    const res = await saveSection(section, { ...(siteContent[section] || {}), [field]: url })
    if (res?.error) throw new Error(res.error)
    set(url)
    toast(`${label} terpasang di website`)
  }
  return (
    <div className="stack">
      <MediaSlot title="Video utama" sub="Bagian “Behind the chair” di website" type="video" folder="video" current={video}
        accept="video/mp4,video/webm,video/quicktime" hint="MP4 / MOV / WebM · maks. 50MB" onUploaded={apply('video', 'video_url', setVideo, 'Video')} />
      <MediaSlot title="Foto barber" sub="Bagian Profil Barber (Ikbar Kamil)" type="image" folder="barber" current={barber}
        accept="image/jpeg,image/png,image/webp,image/avif" hint="Foto potret · JPG / PNG / WebP · maks. 5MB" onUploaded={apply('barber', 'photo_url', setBarber, 'Foto barber')} />
      <MediaSlot title="Foto bagian Tentang" sub="Tanpa foto, website memakai lambang Dinasti" type="image" folder="about" current={about}
        accept="image/jpeg,image/png,image/webp,image/avif" hint="JPG / PNG / WebP · maks. 5MB" onUploaded={apply('about', 'image_url', setAbout, 'Foto Tentang')} emptyLabel="Website memakai lambang Dinasti"
        onReset={() => apply('about', 'image_url', setAbout, 'Lambang Dinasti')('').catch((err) => toast(err.message, 'error'))} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'galeri', label: 'Galeri', icon: 'image' },
  { id: 'layanan', label: 'Layanan & Harga', icon: 'scissors' },
  { id: 'jam', label: 'Jam Buka', icon: 'clock' },
  { id: 'lokasi', label: 'Lokasi & Kontak', icon: 'pin' },
  { id: 'media', label: 'Video & Foto', icon: 'camera' },
]
// Old links (?tab=video / ?tab=foto) still land on the right place.
const ALIASES = { video: 'media', foto: 'media' }

export default function WebsiteClient({ initialGallery, initialServices, siteContent, initialTab }) {
  const [tab, setTab] = useTab(ALIASES[initialTab] || initialTab, TABS.map((t) => t.id))
  const [toastEl, toast] = useToast()
  const lokasi = siteContent.lokasi || {}

  return (
    <>
      <PageHeader section="Website" title="Kelola Website">
        <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" id="btn-preview-website">
          <Icon name="external" size={15} /> Lihat website
        </a>
      </PageHeader>
      <div className="dashboard-content">
        <Tabs tabs={TABS} active={tab} onChange={setTab} label="Bagian website" />
        <TabPanel id="galeri" active={tab}><TabGaleri gallery={initialGallery} toast={toast} /></TabPanel>
        <TabPanel id="layanan" active={tab}><TabLayanan services={initialServices} toast={toast} /></TabPanel>
        <TabPanel id="jam" active={tab}><TabJam lokasi={lokasi} toast={toast} /></TabPanel>
        <TabPanel id="lokasi" active={tab}><TabLokasi lokasi={lokasi} kontak={siteContent.kontak || {}} toast={toast} /></TabPanel>
        <TabPanel id="media" active={tab}><TabMedia siteContent={siteContent} toast={toast} /></TabPanel>
      </div>
      {toastEl}
    </>
  )
}
