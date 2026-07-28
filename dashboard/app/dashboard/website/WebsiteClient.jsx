'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import {
  updateSiteContent,
  addGalleryItem, deleteGalleryItem,
  addService, updateService, deleteService,
} from '@/app/actions/cms'

// ─── Helpers ─────────────────────────────────────────────────────────
const IconEdit = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const IconTrash = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
const IconPlus = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
const IconUpload = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
const IconCheck = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
const IconX = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const IconExternal = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>

// ─── Toast ────────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 10,
      background: type === 'success' ? 'var(--success-dim)' : 'var(--error-dim)',
      border: `1px solid ${type === 'success' ? 'rgba(74,222,128,.25)' : 'rgba(248,113,113,.25)'}`,
      color: type === 'success' ? 'var(--success)' : 'var(--error)',
      padding: '10px 16px', borderRadius: 'var(--radius-md)',
      fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      animation: 'slideUpToast .25s ease',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      {type === 'success' ? <IconCheck size={14} /> : <IconX size={14} />}
      {msg}
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={onCancel}>
      <div style={{ background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:24,maxWidth:380,width:'100%',boxShadow:'0 24px 80px rgba(0,0,0,.6)' }} onClick={e=>e.stopPropagation()}>
        <p style={{ color:'var(--text-secondary)',fontSize:14,lineHeight:1.6 }}>{message}</p>
        <div style={{ display:'flex',gap:8,marginTop:20,justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ fontSize:13 }}>Batal</button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ fontSize:13 }}>Hapus</button>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────
// Menggunakan XMLHttpRequest agar bisa tracking progress upload secara real-time
// (Server Action tidak bisa melaporkan upload progress — stuck di 85%)
function UploadZone({ accept, onUploaded, folder, label, hint }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    setError(null)
    setUploading(true)
    setProgress(0)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)

    // Gunakan XMLHttpRequest agar upload progress bisa dilaporkan real-time
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        // Maks 90% untuk upload phase — sisa 10% untuk proses server (Supabase)
        const pct = Math.round((e.loaded / e.total) * 90)
        setProgress(pct)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          if (result.error) {
            setError(result.error)
            setUploading(false)
            setProgress(0)
          } else {
            setProgress(100)
            setTimeout(() => {
              setUploading(false)
              setProgress(0)
              onUploaded(result.url, result.path)
            }, 400)
          }
        } catch {
          setError('Gagal memproses respons server')
          setUploading(false)
          setProgress(0)
        }
      } else {
        let errMsg = 'Upload gagal'
        try { errMsg = JSON.parse(xhr.responseText)?.error || errMsg } catch {}
        setError(errMsg)
        setUploading(false)
        setProgress(0)
      }
    }

    xhr.onerror = () => {
      setError('Koneksi terputus. Coba lagi.')
      setUploading(false)
      setProgress(0)
    }

    xhr.ontimeout = () => {
      setError('Upload timeout. File terlalu besar atau koneksi lambat.')
      setUploading(false)
      setProgress(0)
    }

    xhr.timeout = 120000 // 2 menit timeout
    xhr.open('POST', '/api/upload')
    xhr.send(fd)
  }

  return (
    <div
      style={{
        border: '2px dashed var(--border-hover)', borderRadius: 'var(--radius-md)',
        padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
        transition: 'all .15s', background: 'var(--bg-hover)',
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault() }}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />

      {uploading ? (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Mengupload... {progress}%
          </div>
          <div style={{ height: 4, background: 'var(--bg-active)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--success)', transition: 'width .3s ease', borderRadius: 2 }} />
          </div>
        </div>
      ) : (
        <>
          <IconUpload size={22} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{label || 'Klik atau drag & drop file'}</div>
          {hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
        </>
      )}
      {error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  )
}

// ─── Field helper ─────────────────────────────────────────────────────
function Field({ label, id, type='text', name, defaultValue, placeholder, required, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}{required && <span style={{color:'var(--error)',marginLeft:3}}>*</span>}</label>
      {children || <input id={id} name={name||id} type={type} className="form-input" defaultValue={defaultValue} placeholder={placeholder} required={required} />}
      {hint && <span style={{fontSize:11.5,color:'var(--text-muted)',marginTop:3}}>{hint}</span>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB 1 — GALERI FOTO & VIDEO
// ══════════════════════════════════════════════════════════════════════
function TabGaleri({ gallery, onToast }) {
  const [items, setItems] = useState(gallery)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [addState, addAction, addPending] = useActionState(addGalleryItem, null)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [uploadedType, setUploadedType] = useState('image')

  useEffect(() => {
    if (addState?.success) { onToast('Item galeri berhasil ditambahkan'); setUploadedUrl('') }
    if (addState?.error) onToast(addState.error, 'error')
  }, [addState])

  const handleUploaded = (url, _path) => {
    const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm')
    setUploadedType(isVideo ? 'video' : 'image')
    setUploadedUrl(url)
    onToast('File berhasil diupload')
  }

  const handleDelete = async () => {
    const res = await deleteGalleryItem(deleteTarget)
    if (res?.error) onToast(res.error, 'error')
    else {
      setItems(prev => prev.filter(i => i.id !== deleteTarget))
      onToast('Item galeri dihapus')
    }
    setDeleteTarget(null)
  }

  const photos = items.filter(i => i.category === 'Foto')
  const videos = items.filter(i => i.category === 'Video')

  return (
    <div>
      {/* Upload area */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header"><div className="panel-title">Upload Foto / Video Baru</div></div>
        <div className="panel-body">
          <UploadZone
            accept="image/*,video/*"
            folder="gallery"
            label="Klik atau drag foto/video ke sini"
            hint="Foto max 5MB • Video max 50MB • JPG, PNG, MP4, MOV"
            onUploaded={handleUploaded}
          />
          {uploadedUrl && (
            <form action={addAction} style={{ marginTop: 16 }}>
              <input type="hidden" name="src" value={uploadedUrl} />
              <input type="hidden" name="type" value={uploadedType} />
              <div className="form-row" style={{ marginBottom: 12 }}>
                <Field label="Keterangan (alt text)" id="alt" name="alt" placeholder="Misal: Hasil crew cut pelanggan" />
                <div className="form-group">
                  <label className="form-label">Preview</label>
                  {uploadedType === 'image'
                    ? <img src={uploadedUrl} alt="" style={{ height: 80, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    : <video src={uploadedUrl} style={{ height: 80, borderRadius: 6, border: '1px solid var(--border)' }} muted />}
                </div>
              </div>
              {addState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{addState.error}</div>}
              <button type="submit" className="btn btn-primary" disabled={addPending} id="btn-simpan-galeri">
                <IconPlus size={14} /> {addPending ? 'Menyimpan...' : 'Tambah ke Galeri'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Grid galeri */}
      {[{ label: 'Foto', data: photos }, { label: 'Video', data: videos }].map(({ label, data }) => (
        <div key={label} className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <div className="panel-title">Galeri {label}</div>
            <div className="panel-sub">{data.length} item</div>
          </div>
          {data.length === 0
            ? <div className="empty-state"><p>Belum ada {label.toLowerCase()} di galeri.</p></div>
            : (
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {data.map(item => (
                  <div key={item.id} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '4/3', background: 'var(--bg-hover)' }}>
                    {item.type === 'image'
                      ? <img src={item.src} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <video src={item.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />}
                    <button
                      onClick={() => setDeleteTarget(item.id)}
                      style={{ position: 'absolute', top: 5, right: 5, width: 26, height: 26, borderRadius: 6, background: 'rgba(0,0,0,.7)', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Hapus" aria-label="Hapus item galeri"
                    >
                      <IconTrash size={12} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px', background: 'rgba(0,0,0,.65)', fontSize: 10, color: 'rgba(255,255,255,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.alt || item.src.split('/').pop()}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}

      {deleteTarget && <ConfirmModal message="Hapus item ini dari galeri?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB 2 — VIDEO UTAMA
// ══════════════════════════════════════════════════════════════════════
function TabVideo({ siteContent, onToast }) {
  const videoContent = siteContent.video || { video_url: '/assets/main-video.mp4' }
  const [currentUrl, setCurrentUrl] = useState(videoContent.video_url || '')
  const [saveState, saveAction, savePending] = useActionState(updateSiteContent, null)

  useEffect(() => {
    if (saveState?.success) onToast('Video utama berhasil diupdate')
    if (saveState?.error) onToast(saveState.error, 'error')
  }, [saveState])

  const handleUploaded = (url) => {
    setCurrentUrl(url)
    onToast('Video berhasil diupload — klik Simpan untuk menerapkan')
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Video Utama</div>
          <div className="panel-sub">Section "Lihat Aksi Kami"</div>
        </div>
        <div className="panel-body">
          {currentUrl && (
            <div style={{ marginBottom: 20 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>Video Saat Ini</div>
              <video src={currentUrl} controls style={{ width: '100%', maxHeight: 320, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>{currentUrl}</div>
            </div>
          )}

          <UploadZone
            accept="video/*"
            folder="video"
            label="Upload video baru untuk mengganti yang lama"
            hint="MP4, MOV, WebM • Maksimal 50MB"
            onUploaded={handleUploaded}
          />

          <form action={saveAction} style={{ marginTop: 16 }}>
            <input type="hidden" name="section" value="video" />
            <input type="hidden" name="content" value={JSON.stringify({ video_url: currentUrl })} />
            {saveState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{saveState.error}</div>}
            <button type="submit" className="btn btn-primary" disabled={savePending || !currentUrl} id="btn-simpan-video">
              <IconCheck size={14} /> {savePending ? 'Menyimpan...' : 'Simpan Video Utama'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB 3 — LAYANAN & HARGA
// ══════════════════════════════════════════════════════════════════════
function TabLayanan({ services, onToast }) {
  const [addState, addAction, addPending] = useActionState(addService, null)
  const [editState, editAction, editPending] = useActionState(updateService, null)
  const [editRow, setEditRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const addFormRef = useRef(null)

  useEffect(() => {
    if (addState?.success) { onToast('Layanan berhasil ditambahkan'); addFormRef.current?.reset() }
    if (addState?.error) onToast(addState.error, 'error')
  }, [addState])

  useEffect(() => {
    if (editState?.success) { onToast('Layanan berhasil diupdate'); setEditRow(null) }
    if (editState?.error) onToast(editState.error, 'error')
  }, [editState])

  const handleDelete = async () => {
    const res = await deleteService(deleteTarget)
    setDeleteTarget(null)
    if (res?.error) onToast(res.error, 'error')
    else onToast('Layanan dihapus')
  }

  const utama = services.filter(s => s.category === 'utama')
  const tambahan = services.filter(s => s.category === 'tambahan')

  return (
    <div>
      {/* Form tambah */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header"><div className="panel-title">Tambah Layanan</div></div>
        <div className="panel-body">
          <form ref={addFormRef} action={addAction}>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <Field label="Nama Layanan" id="svc-name" name="name" placeholder="Misal: Crew Cut" required />
              <Field label="Kategori" id="svc-cat" name="category">
                <select id="svc-cat" name="category" className="form-input">
                  <option value="utama">Style Cukuran (Utama)</option>
                  <option value="tambahan">Layanan Tambahan</option>
                </select>
              </Field>
              <Field label="Harga" id="svc-price" name="price" placeholder="Rp 25.000 atau Tanya Ikbar" required />
              <Field label="Deskripsi" id="svc-desc" name="description" placeholder="Deskripsi singkat layanan" />
            </div>
            {addState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{addState.error}</div>}
            <button type="submit" className="btn btn-primary" disabled={addPending} id="btn-tambah-layanan">
              <IconPlus size={14} /> {addPending ? 'Menyimpan...' : 'Tambah Layanan'}
            </button>
          </form>
        </div>
      </div>

      {/* Tabel layanan */}
      {[{ label: 'Style Cukuran (Utama)', data: utama }, { label: 'Layanan Tambahan', data: tambahan }].map(({ label, data }) => (
        <div key={label} className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-header">
            <div className="panel-title">{label}</div>
            <div className="panel-sub">{data.length} item</div>
          </div>
          {data.length === 0
            ? <div className="empty-state"><p>Belum ada layanan di kategori ini.</p></div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Nama</th><th>Deskripsi</th><th style={{ textAlign: 'right' }}>Harga</th><th style={{ width: 90 }}></th></tr></thead>
                  <tbody>
                    {data.map(s => editRow === s.id ? (
                      <tr key={s.id} style={{ background: 'var(--bg-hover)' }}>
                        <td colSpan={4}>
                          <form action={editAction} style={{ padding: '12px 0' }}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="category" value={s.category} />
                            <div className="form-row" style={{ marginBottom: 10 }}>
                              <Field label="Nama" id={`en-${s.id}`} name="name" defaultValue={s.name} required />
                              <Field label="Harga" id={`ep-${s.id}`} name="price" defaultValue={s.price} required />
                              <Field label="Deskripsi" id={`ed-${s.id}`} name="description" defaultValue={s.description} />
                            </div>
                            {editState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{editState.error}</div>}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" className="btn btn-primary" disabled={editPending} style={{ fontSize: 12, padding: '6px 14px' }}>
                                <IconCheck size={13} /> Simpan
                              </button>
                              <button type="button" className="btn btn-ghost" onClick={() => setEditRow(null)} style={{ fontSize: 12, padding: '6px 14px' }}>Batal</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description}</td>
                        <td style={{ textAlign: 'right', fontSize: 12 }}>{s.price}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn-icon" onClick={() => setEditRow(s.id)} title="Edit" aria-label="Edit layanan"><IconEdit size={13} /></button>
                            <button className="btn-icon btn-icon-danger" onClick={() => setDeleteTarget(s.id)} title="Hapus" aria-label="Hapus layanan"><IconTrash size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      ))}

      {deleteTarget && <ConfirmModal message="Hapus layanan ini?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB 4 — LOKASI & KONTAK
// ══════════════════════════════════════════════════════════════════════
function TabLokasi({ siteContent, onToast }) {
  const lokasi = siteContent.lokasi || {}
  const kontak = siteContent.kontak || {}

  const [address, setAddress] = useState(lokasi.address || '')
  const [mapsUrl, setMapsUrl] = useState(lokasi.maps_url || '')
  const [waNumber, setWaNumber] = useState(kontak.wa_number || '')
  const [instagram, setInstagram] = useState(kontak.instagram || '')

  const [lokasiState, lokasiAction, lokasiPending] = useActionState(updateSiteContent, null)
  const [kontakState, kontakAction, kontakPending] = useActionState(updateSiteContent, null)

  useEffect(() => {
    if (lokasiState?.success) onToast('Info lokasi berhasil disimpan')
    if (lokasiState?.error) onToast(lokasiState.error, 'error')
  }, [lokasiState])

  useEffect(() => {
    if (kontakState?.success) onToast('Info kontak berhasil disimpan')
    if (kontakState?.error) onToast(kontakState.error, 'error')
  }, [kontakState])

  const lokasiContent = { ...lokasi, address, maps_url: mapsUrl }
  const kontakContent = { ...kontak, wa_number: waNumber, instagram }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Lokasi */}
      <div className="panel">
        <div className="panel-header"><div className="panel-title">Lokasi</div></div>
        <div className="panel-body">
          <form action={lokasiAction}>
            <input type="hidden" name="section" value="lokasi" />
            <input type="hidden" name="content" value={JSON.stringify(lokasiContent)} />
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="lokasi-address">Alamat Lengkap</label>
                <input id="lokasi-address" className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Jl. Raya Luragung..." />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lokasi-maps">URL Google Maps Embed</label>
                <input id="lokasi-maps" className="form-input" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>Ambil dari Google Maps → Share → Embed a map → copy isi src="..."</span>
              </div>
            </div>
            {lokasiState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{lokasiState.error}</div>}
            <button type="submit" className="btn btn-primary" disabled={lokasiPending} id="btn-simpan-lokasi">
              <IconCheck size={14} /> {lokasiPending ? 'Menyimpan...' : 'Simpan Lokasi'}
            </button>
          </form>
        </div>
      </div>

      {/* Kontak */}
      <div className="panel">
        <div className="panel-header"><div className="panel-title">Kontak</div></div>
        <div className="panel-body">
          <form action={kontakAction}>
            <input type="hidden" name="section" value="kontak" />
            <input type="hidden" name="content" value={JSON.stringify(kontakContent)} />
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="kontak-wa">Nomor WhatsApp</label>
                <input id="kontak-wa" className="form-input" value={waNumber} onChange={e => setWaNumber(e.target.value)} placeholder="6283110071825" />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>Format: kode negara + nomor tanpa + (misal: 6283110071825)</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="kontak-ig">Username Instagram</label>
                <input id="kontak-ig" className="form-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="ikbarbarbershop" />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>Tanpa @</span>
              </div>
            </div>
            {kontakState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{kontakState.error}</div>}
            <button type="submit" className="btn btn-primary" disabled={kontakPending} id="btn-simpan-kontak">
              <IconCheck size={14} /> {kontakPending ? 'Menyimpan...' : 'Simpan Kontak'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════
// TAB 5 — JAM OPERASIONAL
// ══════════════════════════════════════════════════════════════════════
function TabJam({ siteContent, onToast }) {
  const lokasi = siteContent.lokasi || {}
  const defaultHours = lokasi.hours_data || [
    { hari: 'Senin – Jumat', jam: '16:00 – 21:00', tutup: false },
    { hari: 'Sabtu', jam: '10:00 – 21:00', tutup: false },
    { hari: 'Minggu', jam: '10:00 – 21:00', tutup: false },
  ]
  const [hours, setHours] = useState(defaultHours)
  const [saveState, saveAction, savePending] = useActionState(updateSiteContent, null)

  useEffect(() => {
    if (saveState?.success) onToast('Jam operasional berhasil disimpan')
    if (saveState?.error) onToast(saveState.error, 'error')
  }, [saveState])

  const updateHour = (index, field, value) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  const updatedContent = {
    ...lokasi,
    hours_data: hours,
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Jam Operasional</div>
        <div className="panel-sub">Tampil di section Lokasi</div>
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {hours.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ flex: '1 1 140px', minWidth: 120 }}
                value={h.hari}
                onChange={e => updateHour(i, 'hari', e.target.value)}
                placeholder="Misal: Senin – Jumat"
              />
              <input
                className="form-input"
                style={{ flex: '1 1 120px', minWidth: 100 }}
                value={h.jam}
                onChange={e => updateHour(i, 'jam', e.target.value)}
                disabled={h.tutup}
                placeholder="08:00 – 21:00"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={h.tutup || false}
                  onChange={e => updateHour(i, 'tutup', e.target.checked)}
                  style={{ accentColor: 'var(--error)', width: 14, height: 14 }}
                />
                Tutup
              </label>
              <button type="button" className="btn-icon btn-icon-danger"
                onClick={() => setHours(prev => prev.filter((_, idx) => idx !== i))}
                title="Hapus baris" aria-label="Hapus baris jam">
                <IconTrash size={13} />
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-ghost"
            onClick={() => setHours(prev => [...prev, { hari: '', jam: '', tutup: false }])}
            style={{ fontSize: 12, alignSelf: 'flex-start' }}>
            <IconPlus size={13} /> Tambah Baris
          </button>
        </div>

        <form action={saveAction}>
          <input type="hidden" name="section" value="lokasi" />
          <input type="hidden" name="content" value={JSON.stringify(updatedContent)} />
          {saveState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{saveState.error}</div>}
          <button type="submit" className="btn btn-primary" disabled={savePending} id="btn-simpan-jam">
            <IconCheck size={14} /> {savePending ? 'Menyimpan...' : 'Simpan Jam Operasional'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB 6 — FOTO ABOUT & BARBER
// ══════════════════════════════════════════════════════════════════════
function TabFoto({ siteContent, onToast }) {
  const about = siteContent.about || {}
  const barber = siteContent.barber || {}
  const [aboutUrl, setAboutUrl] = useState(about.image_url || '/assets/about-new.jpg')
  const [barberUrl, setBarberUrl] = useState(barber.photo_url || '/assets/barber-ikbar.jpg')
  const [aboutState, aboutAction, aboutPending] = useActionState(updateSiteContent, null)
  const [barberState, barberAction, barberPending] = useActionState(updateSiteContent, null)

  useEffect(() => {
    if (aboutState?.success) onToast('Foto About berhasil disimpan')
    if (aboutState?.error) onToast(aboutState.error, 'error')
  }, [aboutState])

  useEffect(() => {
    if (barberState?.success) onToast('Foto Barber berhasil disimpan')
    if (barberState?.error) onToast(barberState.error, 'error')
  }, [barberState])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { label: 'Foto About (Section Tentang)', key: 'about', current: aboutUrl, setCurrent: setAboutUrl, action: aboutAction, pending: aboutPending, state: aboutState, content: { ...about, image_url: aboutUrl }, section: 'about', folder: 'about', id: 'btn-simpan-about' },
        { label: 'Foto Barber (Section Profil Barber)', key: 'barber', current: barberUrl, setCurrent: setBarberUrl, action: barberAction, pending: barberPending, state: barberState, content: { ...barber, photo_url: barberUrl }, section: 'barber', folder: 'barber', id: 'btn-simpan-barber' },
      ].map(({ label, current, setCurrent, action, pending, content, section, folder, id }) => (
        <div key={section} className="panel">
          <div className="panel-header"><div className="panel-title">{label}</div></div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Foto Saat Ini</div>
                <img src={current} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} onError={e => { e.target.style.display = 'none' }} />
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Upload Foto Baru</div>
                <UploadZone
                  accept="image/*"
                  folder={folder}
                  label="Klik atau drag foto"
                  hint="JPG, PNG • Max 5MB"
                  onUploaded={(url) => { setCurrent(url); onToast('Foto diupload — klik Simpan untuk menerapkan') }}
                />
              </div>
            </div>
            <form action={action} style={{ marginTop: 16 }}>
              <input type="hidden" name="section" value={section} />
              <input type="hidden" name="content" value={JSON.stringify(content)} />
              <button type="submit" className="btn btn-primary" disabled={pending} id={id}>
                <IconCheck size={14} /> {pending ? 'Menyimpan...' : 'Simpan Foto'}
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN CLIENT COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function WebsiteClient({ initialGallery, initialServices, siteContent }) {
  const [activeTab, setActiveTab] = useState('galeri')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type, key: Date.now() })

  const TABS = [
    { id: 'galeri', label: 'Galeri' },
    { id: 'video', label: 'Video Utama' },
    { id: 'layanan', label: 'Layanan & Harga' },
    { id: 'lokasi', label: 'Lokasi & Kontak' },
    { id: 'jam', label: 'Jam Buka' },
    { id: 'foto', label: 'Foto About & Barber' },
  ]

  return (
    <>
      <style>{`
        @keyframes slideUpToast { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        .tab-nav { display:flex; gap:4px; padding:4px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); margin-bottom:20px; flex-wrap:wrap; overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .tab-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; color:var(--text-muted); transition:all .15s; cursor:pointer; background:none; border:none; white-space:nowrap; flex-shrink:0; }
        .tab-btn:hover { color:var(--text-secondary); }
        .tab-btn.active { background:var(--bg-active); color:var(--text-primary); }
        .data-table { width:100%; border-collapse:collapse; font-size:13px; }
        .data-table th { padding:10px 14px; text-align:left; font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--border); white-space:nowrap; }
        .data-table td { padding:11px 14px; border-bottom:1px solid var(--border); color:var(--text-secondary); vertical-align:middle; }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:hover td { background:rgba(255,255,255,.025); }
        .btn-icon { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); border:1px solid var(--border); cursor:pointer; color:var(--text-muted); transition:all .15s; background:none; }
        .btn-icon:hover { color:var(--text-primary); border-color:var(--border-hover); background:var(--bg-hover); }
        .btn-icon-danger:hover { color:var(--error); border-color:rgba(248,113,113,.3); background:var(--error-dim); }
        .form-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; }
        .btn-danger { background:var(--error-dim)!important; color:var(--error)!important; border:1px solid rgba(248,113,113,.3)!important; }
        @media(max-width:640px) { .form-row { grid-template-columns:1fr; } .tab-btn { padding:6px 10px; font-size:11.5px; } }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <span className="dashboard-breadcrumb">Dashboard / Website</span>
          <span className="dashboard-page-title">Kelola Website</span>
        </div>
        <div className="dashboard-header-right">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ fontSize: 12, gap: 6 }}
            id="btn-preview-website"
          >
            <IconExternal size={13} /> Preview Website
          </a>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Tab nav */}
        <div className="tab-nav" role="tablist">
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={activeTab === t.id}
              className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)} id={`tab-website-${t.id}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'galeri' && <TabGaleri gallery={initialGallery} onToast={showToast} />}
        {activeTab === 'video' && <TabVideo siteContent={siteContent} onToast={showToast} />}
        {activeTab === 'layanan' && <TabLayanan services={initialServices} onToast={showToast} />}
        {activeTab === 'lokasi' && <TabLokasi siteContent={siteContent} onToast={showToast} />}
        {activeTab === 'jam' && <TabJam siteContent={siteContent} onToast={showToast} />}
        {activeTab === 'foto' && <TabFoto siteContent={siteContent} onToast={showToast} />}
      </div>

      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
