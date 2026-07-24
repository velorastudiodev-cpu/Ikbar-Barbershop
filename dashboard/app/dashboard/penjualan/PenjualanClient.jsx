'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { addSale, updateSale, deleteSale } from '@/app/actions/sales'
import { updateCash } from '@/app/actions/cash'
import { addHpp, updateHpp, deleteHpp } from '@/app/actions/hpp'

// ─── Helpers ─────────────────────────────────────────────────────────
function formatIDR(v) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(v) || 0)
}
function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
function todayISO() {
  return new Date().toISOString().split('T')[0]
}
function fmtDatetime(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── SVG Icons ───────────────────────────────────────────────────────
const Ico = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const IconPlus = ({ size = 15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
const IconEdit = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const IconTrash = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
const IconCheck = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
const IconX = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>

// ─── Toast ────────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 10,
      background: type === 'success' ? 'var(--success-dim)' : 'var(--error-dim)',
      border: `1px solid ${type === 'success' ? 'rgba(74,222,128,.25)' : 'rgba(248,113,113,.25)'}`,
      color: type === 'success' ? 'var(--success)' : 'var(--error)',
      padding: '10px 16px', borderRadius: 'var(--radius-md)',
      fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      animation: 'slideInToast .25s var(--ease-out)',
    }}>
      {type === 'success' ? <IconCheck size={14} /> : <IconX size={14} />}
      {msg}
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ fontSize: 13 }}>Batal</button>
          <button className="btn btn-danger" onClick={onConfirm} style={{ fontSize: 13 }}>Hapus</button>
        </div>
      </div>
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────
function Field({ label, id, type = 'text', placeholder, defaultValue, name, required, min, step, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}{required && <span style={{ color: 'var(--error)', marginLeft: 3 }}>*</span>}</label>
      {children || (
        <input
          id={id} name={name || id} type={type}
          className="form-input"
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          min={min} step={step}
        />
      )}
      {hint && <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{hint}</span>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 1 — PENJUALAN
// ═══════════════════════════════════════════════════════════════════════
function TabPenjualan({ sales, onToast }) {
  const [addState, addAction, addPending] = useActionState(addSale, null)
  const [editState, editAction, editPending] = useActionState(updateSale, null)
  const [editRow, setEditRow] = useState(null) // ID yang sedang di-edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const addFormRef = useRef(null)

  // Toast setelah add
  useEffect(() => {
    if (addState?.success) {
      onToast('Penjualan berhasil ditambahkan')
      addFormRef.current?.reset()
      addFormRef.current?.querySelector('[name="date"]')?.setAttribute('value', todayISO())
    }
    if (addState?.error) onToast(addState.error, 'error')
  }, [addState])

  // Toast setelah edit
  useEffect(() => {
    if (editState?.success) {
      onToast('Penjualan berhasil diupdate')
      setEditRow(null)
    }
    if (editState?.error) onToast(editState.error, 'error')
  }, [editState])

  const handleDelete = async () => {
    const res = await deleteSale(deleteTarget)
    setDeleteTarget(null)
    if (res?.error) onToast(res.error, 'error')
    else onToast('Penjualan dihapus')
  }

  return (
    <div>
      {/* Form tambah */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <div className="panel-title">Catat Penjualan Harian</div>
        </div>
        <div className="panel-body">
          <form ref={addFormRef} action={addAction}>
            <div className="form-row">
              <Field label="Tanggal" id="date" type="date" name="date" defaultValue={todayISO()} required />
              <Field label="Jumlah Transaksi" id="total_trx" type="number" name="total_trx" placeholder="Misal: 8" min="0" required hint="Jumlah pelanggan / sesi hari ini" />
              <Field label="Total Omzet (Rp)" id="total_omzet" type="number" name="total_omzet" placeholder="Misal: 200000" min="0" step="500" required />
              <Field label="Catatan" id="notes" name="notes" placeholder="Opsional" />
            </div>
            {addState?.error && (
              <div className="form-error" style={{ marginBottom: 12 }}>{addState.error}</div>
            )}
            <button type="submit" className="btn btn-primary" disabled={addPending} id="btn-tambah-penjualan">
              <IconPlus size={14} />
              {addPending ? 'Menyimpan...' : 'Tambah'}
            </button>
          </form>
        </div>
      </div>

      {/* Tabel riwayat */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Riwayat Penjualan</div>
          <div className="panel-sub">{sales.length} entri</div>
        </div>
        {sales.length === 0 ? (
          <div className="empty-state"><p>Belum ada data penjualan. Tambah penjualan pertama di atas.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th style={{ textAlign: 'right' }}>Transaksi</th>
                  <th style={{ textAlign: 'right' }}>Omzet</th>
                  <th>Catatan</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  editRow === s.id ? (
                    <tr key={s.id} style={{ background: 'var(--bg-hover)' }}>
                      <td colSpan={5}>
                        <form action={editAction} style={{ padding: '12px 0' }}>
                          <input type="hidden" name="id" value={s.id} />
                          <div className="form-row" style={{ marginBottom: 10 }}>
                            <Field label="Tanggal" id={`ed-date-${s.id}`} type="date" name="date" defaultValue={s.date} required />
                            <Field label="Transaksi" id={`ed-trx-${s.id}`} type="number" name="total_trx" defaultValue={s.total_trx} min="0" required />
                            <Field label="Omzet (Rp)" id={`ed-omzet-${s.id}`} type="number" name="total_omzet" defaultValue={s.total_omzet} min="0" step="500" required />
                            <Field label="Catatan" id={`ed-notes-${s.id}`} name="notes" defaultValue={s.notes || ''} />
                          </div>
                          {editState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{editState.error}</div>}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" className="btn btn-primary" disabled={editPending} style={{ fontSize: 12, padding: '6px 14px' }}>
                              <IconCheck size={13} /> Simpan
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setEditRow(null)} style={{ fontSize: 12, padding: '6px 14px' }}>
                              Batal
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={s.id}>
                      <td>{formatDate(s.date)}</td>
                      <td style={{ textAlign: 'right' }}>{s.total_trx} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>org</span></td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--success)' }}>{formatIDR(s.total_omzet)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.notes || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn-icon" onClick={() => setEditRow(s.id)} title="Edit" aria-label="Edit penjualan">
                            <IconEdit size={13} />
                          </button>
                          <button className="btn-icon btn-icon-danger" onClick={() => setDeleteTarget(s.id)} title="Hapus" aria-label="Hapus penjualan">
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message="Yakin hapus data penjualan ini? Data yang dihapus tidak bisa dikembalikan."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 2 — KAS
// ═══════════════════════════════════════════════════════════════════════
function TabKas({ cash, cashLog, onToast }) {
  const [cashState, cashAction, cashPending] = useActionState(updateCash, null)
  const [currentBalance, setCurrentBalance] = useState(Number(cash.balance))
  const formRef = useRef(null)

  useEffect(() => {
    if (cashState?.success) {
      onToast('Saldo kas berhasil diupdate')
      if (cashState.newBalance !== undefined) setCurrentBalance(cashState.newBalance)
      formRef.current?.reset()
    }
    if (cashState?.error) onToast(cashState.error, 'error')
  }, [cashState])

  return (
    <div>
      {/* Current balance card */}
      <div className="kas-balance-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Saldo Kas Saat Ini</div>
        <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {formatIDR(currentBalance)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Terakhir diupdate: {cash.updated_at ? fmtDatetime(cash.updated_at) : '—'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
        {/* Form update kas */}
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Update Saldo Kas</div></div>
          <div className="panel-body">
            <form ref={formRef} action={cashAction}>
              <Field label="Saldo Baru (Rp)" id="balance" type="number" name="balance" placeholder="Nominal saldo baru" min="0" step="500" required hint="Masukkan total uang yang kamu pegang sekarang" />
              <div style={{ marginTop: 12 }}>
                <Field label="Keterangan" id="cash-notes" name="notes" placeholder="Misal: setoran harian, ambil buat modal" />
              </div>
              {cashState?.error && <div className="form-error" style={{ margin: '10px 0' }}>{cashState.error}</div>}
              <button type="submit" className="btn btn-primary" disabled={cashPending} style={{ marginTop: 14, width: '100%' }} id="btn-update-kas">
                {cashPending ? 'Menyimpan...' : 'Simpan Saldo'}
              </button>
            </form>
          </div>
        </div>

        {/* Riwayat perubahan kas */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Riwayat Kas</div>
            <div className="panel-sub">{cashLog.length} perubahan</div>
          </div>
          {cashLog.length === 0 ? (
            <div className="empty-state"><p>Belum ada riwayat perubahan kas.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th style={{ textAlign: 'right' }}>Sebelum</th>
                    <th style={{ textAlign: 'right' }}>Selisih</th>
                    <th style={{ textAlign: 'right' }}>Sesudah</th>
                    <th>Ket.</th>
                  </tr>
                </thead>
                <tbody>
                  {cashLog.map(log => {
                    const isPositive = Number(log.change_amount) >= 0
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: 11.5 }}>{fmtDatetime(log.created_at)}</td>
                        <td style={{ textAlign: 'right', fontSize: 12 }}>{formatIDR(log.balance_before)}</td>
                        <td style={{ textAlign: 'right', color: isPositive ? 'var(--success)' : 'var(--error)', fontWeight: 600, fontSize: 12 }}>
                          {isPositive ? '+' : ''}{formatIDR(log.change_amount)}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 12 }}>{formatIDR(log.balance_after)}</td>
                        <td style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{log.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 3 — HPP
// ═══════════════════════════════════════════════════════════════════════
function TabHpp({ hpp, onToast }) {
  const [addState, addAction, addPending] = useActionState(addHpp, null)
  const [editState, editAction, editPending] = useActionState(updateHpp, null)
  const [editRow, setEditRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const addFormRef = useRef(null)

  useEffect(() => {
    if (addState?.success) { onToast('Item HPP berhasil ditambahkan'); addFormRef.current?.reset() }
    if (addState?.error) onToast(addState.error, 'error')
  }, [addState])

  useEffect(() => {
    if (editState?.success) { onToast('Item HPP berhasil diupdate'); setEditRow(null) }
    if (editState?.error) onToast(editState.error, 'error')
  }, [editState])

  const handleDelete = async () => {
    const res = await deleteHpp(deleteTarget)
    setDeleteTarget(null)
    if (res?.error) onToast(res.error, 'error')
    else onToast('Item HPP dihapus')
  }

  const categories = ['Layanan', 'Produk', 'Operasional', 'Lainnya']

  return (
    <div>
      {/* Form tambah HPP */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header"><div className="panel-title">Tambah Item HPP</div></div>
        <div className="panel-body">
          <form ref={addFormRef} action={addAction}>
            <div className="form-row">
              <Field label="Nama Layanan / Item" id="item_name" name="item_name" placeholder="Misal: Crew Cut, Pomade" required />
              <Field label="Kategori" id="category" name="category">
                <select id="category" name="category" className="form-input">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Harga Jual (Rp)" id="selling_price" type="number" name="selling_price" placeholder="Misal: 25000" min="0" step="500" required />
              <Field label="HPP / Biaya Modal (Rp)" id="cost" type="number" name="cost" placeholder="Misal: 5000" min="0" step="500" required hint="Biaya modal per layanan/item ini" />
              <Field label="Satuan" id="unit" name="unit" placeholder="per sesi, per botol (opsional)" />
              <Field label="Catatan" id="hpp-notes" name="notes" placeholder="Opsional" />
            </div>
            {addState?.error && <div className="form-error" style={{ marginBottom: 12 }}>{addState.error}</div>}
            <button type="submit" className="btn btn-primary" disabled={addPending} id="btn-tambah-hpp">
              <IconPlus size={14} />
              {addPending ? 'Menyimpan...' : 'Tambah Item'}
            </button>
          </form>
        </div>
      </div>

      {/* Tabel HPP */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Daftar HPP</div>
          <div className="panel-sub">{hpp.length} item</div>
        </div>
        {hpp.length === 0 ? (
          <div className="empty-state"><p>Belum ada item HPP. Tambah item di atas.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: 'right' }}>Harga Jual</th>
                  <th style={{ textAlign: 'right' }}>HPP</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                  <th>Satuan</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {hpp.map(h => {
                  const margin = Number(h.selling_price) - Number(h.cost)
                  const marginPct = h.selling_price > 0
                    ? ((margin / h.selling_price) * 100).toFixed(0)
                    : 0
                  return editRow === h.id ? (
                    <tr key={h.id} style={{ background: 'var(--bg-hover)' }}>
                      <td colSpan={7}>
                        <form action={editAction} style={{ padding: '12px 0' }}>
                          <input type="hidden" name="id" value={h.id} />
                          <div className="form-row" style={{ marginBottom: 10 }}>
                            <Field label="Nama" id={`eh-name-${h.id}`} name="item_name" defaultValue={h.item_name} required />
                            <Field label="Kategori" id={`eh-cat-${h.id}`} name="category">
                              <select id={`eh-cat-${h.id}`} name="category" className="form-input" defaultValue={h.category}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </Field>
                            <Field label="Harga Jual" id={`eh-sp-${h.id}`} type="number" name="selling_price" defaultValue={h.selling_price} min="0" step="500" required />
                            <Field label="HPP" id={`eh-cost-${h.id}`} type="number" name="cost" defaultValue={h.cost} min="0" step="500" required />
                            <Field label="Satuan" id={`eh-unit-${h.id}`} name="unit" defaultValue={h.unit || ''} />
                            <Field label="Catatan" id={`eh-notes-${h.id}`} name="notes" defaultValue={h.notes || ''} />
                          </div>
                          {editState?.error && <div className="form-error" style={{ marginBottom: 10 }}>{editState.error}</div>}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" className="btn btn-primary" disabled={editPending} style={{ fontSize: 12, padding: '6px 14px' }}>
                              <IconCheck size={13} /> Simpan
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setEditRow(null)} style={{ fontSize: 12, padding: '6px 14px' }}>
                              Batal
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 500 }}>{h.item_name}</td>
                      <td><span className="badge badge-neutral">{h.category}</span></td>
                      <td style={{ textAlign: 'right' }}>{formatIDR(h.selling_price)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--error)' }}>{formatIDR(h.cost)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ color: margin >= 0 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                          {formatIDR(margin)}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>({marginPct}%)</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.unit || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn-icon" onClick={() => setEditRow(h.id)} title="Edit" aria-label="Edit HPP">
                            <IconEdit size={13} />
                          </button>
                          <button className="btn-icon btn-icon-danger" onClick={() => setDeleteTarget(h.id)} title="Hapus" aria-label="Hapus HPP">
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message="Yakin hapus item HPP ini?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN CLIENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function PenjualanClient({ initialSales, initialCash, initialCashLog, initialHpp }) {
  const [activeTab, setActiveTab] = useState('penjualan')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type, key: Date.now() })

  const TABS = [
    { id: 'penjualan', label: 'Penjualan' },
    { id: 'kas', label: 'Kas' },
    { id: 'hpp', label: 'HPP' },
  ]

  return (
    <>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
        .tab-nav {
          display: flex; gap: 4; padding: 4px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: var(--radius-md); width: fit-content; margin-bottom: 20px;
        }
        .tab-btn {
          padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
          color: var(--text-muted); transition: all .15s var(--ease-out);
          cursor: pointer; background: none; border: none;
        }
        .tab-btn:hover { color: var(--text-secondary); }
        .tab-btn.active { background: var(--bg-active); color: var(--text-primary); }
        .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table th {
          padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600;
          color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em;
          border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        .data-table td {
          padding: 11px 14px; border-bottom: 1px solid var(--border);
          color: var(--text-secondary); vertical-align: middle;
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: rgba(255,255,255,.025); }
        .btn-icon {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm); border: 1px solid var(--border); cursor: pointer;
          color: var(--text-muted); transition: all .15s var(--ease-out); background: none;
        }
        .btn-icon:hover { color: var(--text-primary); border-color: var(--border-hover); background: var(--bg-hover); }
        .btn-icon-danger:hover { color: var(--error); border-color: rgba(248,113,113,.3); background: var(--error-dim); }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 500;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal {
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 24px; max-width: 380px; width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,.6);
        }
        .modal h3 { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
        .form-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 16px; }
        .kas-balance-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 24px 28px;
        }
        @media (max-width: 640px) {
          .form-row { grid-template-columns: 1fr; }
          [style*="grid-template-columns: 1fr 1.5fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <span className="dashboard-breadcrumb">Dashboard / Data Operasional</span>
          <span className="dashboard-page-title">Penjualan & Kas</span>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Tab navigation */}
        <div className="tab-nav" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
              id={`tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'penjualan' && (
          <TabPenjualan sales={initialSales} onToast={showToast} />
        )}
        {activeTab === 'kas' && (
          <TabKas cash={initialCash} cashLog={initialCashLog} onToast={showToast} />
        )}
        {activeTab === 'hpp' && (
          <TabHpp hpp={initialHpp} onToast={showToast} />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.key}
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
