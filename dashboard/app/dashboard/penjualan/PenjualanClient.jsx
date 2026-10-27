'use client'

import { useActionState, useState } from 'react'
import { addSale, updateSale, deleteSale } from '@/app/actions/sales'
import { updateCash } from '@/app/actions/cash'
import { addHpp, updateHpp, deleteHpp } from '@/app/actions/hpp'
import { ConfirmModal, Field, Icon, MoneyInput, Notice, PageHeader, TabPanel, Tabs, useActionToast, useTab, useToast } from '@/components/ui'
import { formatDate, formatDateTime, formatIDR, monthRange, todayJakarta } from '@/lib/format'

const HAIRCUT_PRICE = 25000 // used only for the "isi otomatis" shortcut; the field stays editable

function RowActions({ onEdit, onDelete, what }) {
  return (
    <div className="row-actions">
      <button type="button" className="btn-icon" onClick={onEdit} aria-label={`Ubah ${what}`}><Icon name="edit" size={15} /><span>Ubah</span></button>
      <button type="button" className="btn-icon btn-icon-danger" onClick={onDelete} aria-label={`Hapus ${what}`}><Icon name="trash" size={15} /><span>Hapus</span></button>
    </div>
  )
}

function Stepper({ id, name, value, onChange }) {
  const n = Number(value) || 0
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(String(Math.max(0, n - 1)))} aria-label="Kurangi satu"><Icon name="minus" size={18} /></button>
      <input id={id} name={name} className="form-input" type="number" inputMode="numeric" min="0" required value={value}
        onChange={(e) => onChange(e.target.value)} placeholder="0" />
      <button type="button" onClick={() => onChange(String(n + 1))} aria-label="Tambah satu"><Icon name="plus" size={18} /></button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// PENJUALAN HARIAN
// ═══════════════════════════════════════════════════════════════════════
function SaleEditRow({ sale, action, pending, error, onCancel }) {
  return (
    <form action={action} className="edit-form">
      <input type="hidden" name="id" value={sale.id} />
      <div className="form-row">
        <Field label="Tanggal" id={`ed-date-${sale.id}`} type="date" name="date" defaultValue={sale.date} required />
        <Field label="Pelanggan" id={`ed-trx-${sale.id}`} type="number" name="total_trx" defaultValue={sale.total_trx} min="0" inputMode="numeric" required />
        <Field label="Omzet" id={`ed-omzet-${sale.id}`} required><MoneyInput id={`ed-omzet-${sale.id}`} name="total_omzet" defaultValue={sale.total_omzet} required /></Field>
        <Field label="Catatan" id={`ed-notes-${sale.id}`} name="notes" defaultValue={sale.notes || ''} />
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}><Icon name="check" size={15} /> {pending ? 'Menyimpan…' : 'Simpan'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  )
}

function TabPenjualan({ sales, toast }) {
  const today = todayJakarta()
  const [date, setDate] = useState(today)
  const [trx, setTrx] = useState('')
  const [omzet, setOmzet] = useState('')
  const [notes, setNotes] = useState('')
  const [editRow, setEditRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [addState, addAction, addPending] = useActionState(addSale, null)
  const [editState, editAction, editPending] = useActionState(updateSale, null)

  useActionToast(addState, toast, 'Penjualan tersimpan', () => { setTrx(''); setOmzet(''); setNotes('') })
  useActionToast(editState, toast, 'Penjualan diperbarui', () => setEditRow(null))

  const sameDay = sales.filter((s) => s.date === date)
  const { start, end } = monthRange(today)
  const thisMonth = sales.filter((s) => s.date >= start && s.date <= end)
  const monthTrx = thisMonth.reduce((a, s) => a + Number(s.total_trx || 0), 0)
  const monthOmzet = thisMonth.reduce((a, s) => a + Number(s.total_omzet || 0), 0)
  const visible = showAll ? sales : sales.slice(0, 14)

  const handleDelete = async () => {
    const res = await deleteSale(deleteTarget)
    setDeleteTarget(null)
    if (res?.error) toast(res.error, 'error')
    else toast('Penjualan dihapus')
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Catat penjualan</div>
            <div className="panel-sub">Isi sekali di akhir hari: berapa pelanggan dan berapa uang yang masuk.</div>
          </div>
        </div>
        <div className="panel-body">
          <form action={addAction}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="date">Tanggal<span className="req" aria-hidden="true">*</span></label>
                <input id="date" name="date" type="date" className="form-input" value={date} max={today} required onChange={(e) => setDate(e.target.value)} />
                <div className="chips">
                  <button type="button" className={`chip${date === today ? ' active' : ''}`} onClick={() => setDate(today)}>Hari ini</button>
                  <button type="button" className={`chip${date === todayJakarta(-1) ? ' active' : ''}`} onClick={() => setDate(todayJakarta(-1))}>Kemarin</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="total_trx">Jumlah pelanggan<span className="req" aria-hidden="true">*</span></label>
                <Stepper id="total_trx" name="total_trx" value={trx} onChange={setTrx} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="total_omzet">Total uang masuk<span className="req" aria-hidden="true">*</span></label>
                <MoneyInput id="total_omzet" name="total_omzet" value={omzet} onChange={setOmzet} required />
                {Number(trx) > 0 && (
                  <div className="chips">
                    <button type="button" className="chip" onClick={() => setOmzet(String(Number(trx) * HAIRCUT_PRICE))}>
                      Isi otomatis: {trx} × {formatIDR(HAIRCUT_PRICE)}
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="notes">Catatan <span className="optional">(opsional)</span></label>
                <input id="notes" name="notes" className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Misal: ramai malam minggu" />
              </div>
            </div>

            {sameDay.length > 0 && (
              <Notice tone="warn">
                <b>{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} sudah dicatat</b>{' '}
                ({sameDay.reduce((a, s) => a + Number(s.total_trx), 0)} pelanggan, {formatIDR(sameDay.reduce((a, s) => a + Number(s.total_omzet), 0))}).
                Kalau angkanya salah, lebih baik <button type="button" className="link-btn" onClick={() => { setShowAll(true); setEditRow(sameDay[0].id) }}>ubah data itu</button> daripada menambah baru.
              </Notice>
            )}
            {addState?.error && <div className="form-error">{addState.error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-lg" disabled={addPending || !trx || !omzet} id="btn-tambah-penjualan">
                <Icon name="check" size={16} strokeWidth={2.2} /> {addPending ? 'Menyimpan…' : 'Simpan penjualan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Riwayat penjualan</div>
            <div className="panel-sub">Bulan ini: {monthTrx} pelanggan · {formatIDR(monthOmzet)}</div>
          </div>
        </div>
        {sales.length === 0 ? (
          <div className="empty-state"><Icon name="trend" size={28} /><p>Belum ada data penjualan. Catat penjualan pertama di atas.</p></div>
        ) : (
          <>
            <table className="data-table">
              <thead><tr><th>Tanggal</th><th className="num">Pelanggan</th><th className="num">Omzet</th><th>Catatan</th><th><span className="sr-only">Aksi</span></th></tr></thead>
              <tbody>
                {visible.map((s) => editRow === s.id ? (
                  <tr key={s.id} className="is-editing"><td colSpan={5}>
                    <SaleEditRow sale={s} action={editAction} pending={editPending} error={editState?.error} onCancel={() => setEditRow(null)} />
                  </td></tr>
                ) : (
                  <tr key={s.id}>
                    <td data-label="Tanggal" className="cell-title">{formatDate(s.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td data-label="Pelanggan" className="num">{s.total_trx} org</td>
                    <td data-label="Omzet" className="num money">{formatIDR(s.total_omzet)}</td>
                    <td data-label="Catatan" className={`muted${s.notes ? '' : ' is-empty'}`}>{s.notes || '—'}</td>
                    <td className="cell-actions"><RowActions what="penjualan" onEdit={() => setEditRow(s.id)} onDelete={() => setDeleteTarget(s.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length > visible.length && (
              <div className="panel-foot"><button type="button" className="btn btn-ghost" onClick={() => setShowAll(true)}>Tampilkan semua ({sales.length})</button></div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal title="Hapus penjualan?" message="Data yang dihapus tidak bisa dikembalikan." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// KAS
// ═══════════════════════════════════════════════════════════════════════
const CASH_MODES = [
  { id: 'in', label: 'Uang masuk', icon: 'plus', note: 'Uang masuk' },
  { id: 'out', label: 'Uang keluar', icon: 'minus', note: 'Uang keluar' },
  { id: 'set', label: 'Atur saldo', icon: 'edit', note: 'Saldo diatur ulang' },
]

function TabKas({ cash, cashLog, toast }) {
  const balance = Number(cash.balance) || 0
  const [mode, setMode] = useState('in')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [cashState, cashAction, cashPending] = useActionState(updateCash, null)
  useActionToast(cashState, toast, 'Saldo kas diperbarui', () => { setAmount(''); setNotes('') })

  const n = Number(amount) || 0
  const next = mode === 'in' ? balance + n : mode === 'out' ? balance - n : n
  const current = CASH_MODES.find((m) => m.id === mode)

  return (
    <div className="stack">
      <div className="balance-card">
        <span>Saldo kas sekarang</span>
        <strong>{formatIDR(balance)}</strong>
        <small>Terakhir diubah: {cash.updated_at ? formatDateTime(cash.updated_at) : '—'}</small>
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Ubah saldo</div></div>
          <div className="panel-body">
            <form action={cashAction}>
              <div className="segmented" role="radiogroup" aria-label="Jenis perubahan">
                {CASH_MODES.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'active' : ''} onClick={() => setMode(m.id)}>
                    <Icon name={m.icon} size={15} /> {m.label}
                  </button>
                ))}
              </div>
              <Field label={mode === 'set' ? 'Saldo yang benar sekarang' : 'Jumlah uang'} id="cash-amount" required>
                <MoneyInput id="cash-amount" value={amount} onChange={setAmount} required />
              </Field>
              <Field label="Keterangan" id="cash-notes">
                <input id="cash-notes" className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={mode === 'out' ? 'Misal: beli pisau cukur' : 'Misal: setoran hari ini'} />
              </Field>
              {/* The server action still receives the new balance, exactly as before. */}
              <input type="hidden" name="balance" value={next} />
              <input type="hidden" name="notes" value={notes || current.note} />
              {amount !== '' && (
                <div className={`preview-line${next < 0 ? ' is-bad' : ''}`}>
                  {next < 0 ? 'Saldo tidak boleh minus.' : <>Saldo jadi <b>{formatIDR(next)}</b>{mode !== 'set' && <> ({mode === 'in' ? '+' : '−'}{formatIDR(n)})</>}</>}
                </div>
              )}
              {cashState?.error && <div className="form-error">{cashState.error}</div>}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={cashPending || amount === '' || next < 0} id="btn-update-kas">
                  <Icon name="check" size={16} strokeWidth={2.2} /> {cashPending ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Riwayat kas</div>
            <div className="panel-sub">{cashLog.length} perubahan terakhir</div>
          </div>
          {cashLog.length === 0 ? (
            <div className="empty-state"><Icon name="wallet" size={28} /><p>Belum ada riwayat perubahan kas.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Waktu</th><th>Keterangan</th><th className="num">Perubahan</th><th className="num">Saldo</th></tr></thead>
              <tbody>
                {cashLog.map((log) => {
                  const up = Number(log.change_amount) >= 0
                  return (
                    <tr key={log.id}>
                      <td data-label="Waktu" className="muted">{formatDateTime(log.created_at)}</td>
                      <td data-label="Keterangan" className="cell-title">{log.notes || '—'}</td>
                      <td data-label="Perubahan" className={`num ${up ? 'money' : 'money-out'}`}>{up ? '+' : '−'}{formatIDR(Math.abs(log.change_amount))}</td>
                      <td data-label="Saldo" className="num">{formatIDR(log.balance_after)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL (HPP)
// ═══════════════════════════════════════════════════════════════════════
const HPP_CATEGORIES = ['Layanan', 'Produk', 'Operasional', 'Lainnya']

function MarginPreview({ price, cost }) {
  if (!price) return null
  const margin = Number(price) - Number(cost || 0)
  return (
    <div className={`preview-line${margin < 0 ? ' is-bad' : ''}`}>
      Untung per item: <b>{formatIDR(margin)}</b> ({Math.round((margin / Number(price)) * 100)}%)
    </div>
  )
}

function HppEditRow({ item, action, pending, error, onCancel }) {
  const [price, setPrice] = useState(String(Math.round(item.selling_price)))
  const [cost, setCost] = useState(String(Math.round(item.cost)))
  return (
    <form action={action} className="edit-form">
      <input type="hidden" name="id" value={item.id} />
      <div className="form-row">
        <Field label="Nama" id={`eh-name-${item.id}`} name="item_name" defaultValue={item.item_name} required />
        <Field label="Kategori" id={`eh-cat-${item.id}`}>
          <select id={`eh-cat-${item.id}`} name="category" className="form-input" defaultValue={item.category}>
            {HPP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Harga jual" id={`eh-sp-${item.id}`} required><MoneyInput id={`eh-sp-${item.id}`} name="selling_price" value={price} onChange={setPrice} required /></Field>
        <Field label="Modal" id={`eh-cost-${item.id}`} required><MoneyInput id={`eh-cost-${item.id}`} name="cost" value={cost} onChange={setCost} required /></Field>
        <Field label="Satuan" id={`eh-unit-${item.id}`} name="unit" defaultValue={item.unit || ''} />
        <Field label="Catatan" id={`eh-notes-${item.id}`} name="notes" defaultValue={item.notes || ''} />
      </div>
      <MarginPreview price={price} cost={cost} />
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}><Icon name="check" size={15} /> {pending ? 'Menyimpan…' : 'Simpan'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  )
}

function TabHpp({ hpp, toast }) {
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [form, setForm] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [addState, addAction, addPending] = useActionState(addHpp, null)
  const [editState, editAction, editPending] = useActionState(updateHpp, null)
  useActionToast(addState, toast, 'Item modal ditambahkan', () => { setPrice(''); setCost(''); form?.reset() })
  useActionToast(editState, toast, 'Item modal diperbarui', () => setEditRow(null))

  const handleDelete = async () => {
    const res = await deleteHpp(deleteTarget)
    setDeleteTarget(null)
    if (res?.error) toast(res.error, 'error')
    else toast('Item modal dihapus')
  }

  return (
    <div className="stack">
      <Notice>
        <b>Apa itu HPP?</b> Biaya modal untuk satu layanan atau produk (misal pisau, bedak, listrik per potong).
        Rata-rata modal kategori <b>Layanan</b> dipakai untuk menghitung perkiraan untung di Ringkasan.
      </Notice>

      <div className="panel">
        <div className="panel-header"><div className="panel-title">Tambah item modal</div></div>
        <div className="panel-body">
          <form ref={setForm} action={addAction}>
            <div className="form-row">
              <Field label="Nama layanan / barang" id="item_name" name="item_name" placeholder="Misal: Crew Cut, Pomade" required />
              <Field label="Kategori" id="category">
                <select id="category" name="category" className="form-input">
                  {HPP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Harga jual" id="selling_price" required><MoneyInput id="selling_price" name="selling_price" value={price} onChange={setPrice} placeholder="25.000" required /></Field>
              <Field label="Modal per item" id="cost" required hint="Biaya yang keluar untuk satu kali layanan / satu barang">
                <MoneyInput id="cost" name="cost" value={cost} onChange={setCost} placeholder="5.000" required />
              </Field>
              <Field label="Satuan" id="unit" name="unit" placeholder="per sesi, per pcs (opsional)" />
              <Field label="Catatan" id="hpp-notes" name="notes" placeholder="Opsional" />
            </div>
            <MarginPreview price={price} cost={cost} />
            {addState?.error && <div className="form-error">{addState.error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={addPending} id="btn-tambah-hpp">
                <Icon name="plus" size={15} /> {addPending ? 'Menyimpan…' : 'Tambah item'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Daftar modal</div>
          <div className="panel-sub">{hpp.length} item</div>
        </div>
        {hpp.length === 0 ? (
          <div className="empty-state"><Icon name="box" size={28} /><p>Belum ada item modal. Tambah item di atas.</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nama</th><th>Kategori</th><th className="num">Harga jual</th><th className="num">Modal</th><th className="num">Untung</th><th><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody>
              {hpp.map((h) => {
                const margin = Number(h.selling_price) - Number(h.cost)
                const pct = h.selling_price > 0 ? Math.round((margin / h.selling_price) * 100) : 0
                return editRow === h.id ? (
                  <tr key={h.id} className="is-editing"><td colSpan={6}>
                    <HppEditRow item={h} action={editAction} pending={editPending} error={editState?.error} onCancel={() => setEditRow(null)} />
                  </td></tr>
                ) : (
                  <tr key={h.id}>
                    <td data-label="Nama" className="cell-title">{h.item_name}{h.unit && <small className="muted"> · {h.unit}</small>}</td>
                    <td data-label="Kategori"><span className="badge badge-neutral">{h.category}</span></td>
                    <td data-label="Harga jual" className="num">{formatIDR(h.selling_price)}</td>
                    <td data-label="Modal" className="num">{formatIDR(h.cost)}</td>
                    <td data-label="Untung" className={`num ${margin >= 0 ? 'money' : 'money-out'}`}>{formatIDR(margin)} <small className="muted">({pct}%)</small></td>
                    <td className="cell-actions"><RowActions what="item modal" onEdit={() => setEditRow(h.id)} onDelete={() => setDeleteTarget(h.id)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && <ConfirmModal title="Hapus item modal?" message="Item ini tidak lagi dipakai untuk menghitung perkiraan untung." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'penjualan', label: 'Penjualan harian', icon: 'trend' },
  { id: 'kas', label: 'Kas', icon: 'wallet' },
  { id: 'hpp', label: 'Modal (HPP)', icon: 'box' },
]

export default function PenjualanClient({ initialSales, initialCash, initialCashLog, initialHpp, initialTab }) {
  const [tab, setTab] = useTab(initialTab, TABS.map((t) => t.id))
  const [toastEl, toast] = useToast()

  return (
    <>
      <PageHeader section="Data operasional" title="Penjualan & Kas" />
      <div className="dashboard-content">
        <Tabs tabs={TABS} active={tab} onChange={setTab} label="Bagian penjualan & kas" />
        <TabPanel id="penjualan" active={tab}><TabPenjualan sales={initialSales} toast={toast} /></TabPanel>
        <TabPanel id="kas" active={tab}><TabKas cash={initialCash} cashLog={initialCashLog} toast={toast} /></TabPanel>
        <TabPanel id="hpp" active={tab}><TabHpp hpp={initialHpp} toast={toast} /></TabPanel>
      </div>
      {toastEl}
    </>
  )
}
