'use client'

// Shared building blocks for the dashboard screens (previously copied into each page).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { groupDigits } from '@/lib/format'

// ─── Icons ───────────────────────────────────────────────────────────
const PATHS = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  trend: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  minus: <line x1="5" y1="12" x2="19" y2="12" />,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
  upload: <><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></>,
  box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  coins: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  video: <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></>,
  play: <polygon points="6 4 20 12 6 20 6 4" />,
  scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></>,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  chat: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
}

export function Icon({ name, size = 16, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>
  )
}

// ─── Page header (sticky bar on top of each screen) ──────────────────
export function PageHeader({ section, title, children }) {
  return (
    <div className="dashboard-header">
      <div className="dashboard-header-left">
        {section && <span className="dashboard-breadcrumb">{section}</span>}
        <span className="dashboard-page-title">{title}</span>
      </div>
      {children && <div className="dashboard-header-right">{children}</div>}
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────
/** Returns [element, show]. `show('Tersimpan')` or `show('Gagal', 'error')`. */
export function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback((msg, type = 'success') => {
    clearTimeout(timer.current)
    setToast({ msg, type, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 6000 : 3200)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  const el = (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.key} className={`toast toast-${toast.type}`}>
          <Icon name={toast.type === 'success' ? 'check' : 'info'} size={16} strokeWidth={2.2} />
          <span>{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Tutup pesan"><Icon name="x" size={14} /></button>
        </div>
      )}
    </div>
  )
  return [el, show]
}

/** Shows a toast once per server-action result. */
export function useActionToast(state, show, successMsg, onSuccess) {
  useEffect(() => {
    if (state?.success) { show(successMsg); onSuccess?.(state) }
    if (state?.error) show(state.error, 'error')
    // Only react to a new result object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])
}

// ─── Confirm dialog (native <dialog>: Esc closes, focus is trapped) ──
export function ConfirmModal({ title = 'Yakin?', message, confirmLabel = 'Hapus', onConfirm, onCancel }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  useLayoutEffect(() => { ref.current?.showModal() }, [])
  return (
    <dialog ref={ref} className="modal" onClose={onCancel} onClick={(e) => e.target === ref.current && onCancel()} aria-labelledby="confirm-title">
      <h3 id="confirm-title">{title}</h3>
      <p>{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} autoFocus>Batal</button>
        <button type="button" className="btn btn-danger" disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false) }}>
          <Icon name="trash" size={15} /> {busy ? 'Menghapus…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

// ─── Form fields ─────────────────────────────────────────────────────
export function Field({ label, id, type = 'text', name, defaultValue, placeholder, required, min, step, inputMode, children, hint, className = '' }) {
  return (
    <div className={`form-group ${className}`}>
      <label className="form-label" htmlFor={id}>{label}{required && <span className="req" aria-hidden="true">*</span>}</label>
      {children || (
        <input id={id} name={name || id} type={type} className="form-input" defaultValue={defaultValue} placeholder={placeholder}
          required={required} min={min} step={step} inputMode={inputMode} />
      )}
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  )
}

/**
 * Rupiah input: shows "200.000" while typing and submits plain digits under `name`,
 * which is what the server actions already parse.
 */
export function MoneyInput({ id, name, defaultValue, value: controlled, onChange, placeholder = '0', required, autoFocus }) {
  const initial = defaultValue == null || defaultValue === '' ? '' : String(Math.round(Number(defaultValue)))
  const [own, setOwn] = useState(initial)
  const digits = controlled ?? own
  const ref = useRef(null)
  // A form reset should clear this field too.
  useEffect(() => {
    const form = ref.current?.form
    if (!form || controlled !== undefined) return
    const onReset = () => setOwn(initial)
    form.addEventListener('reset', onReset)
    return () => form.removeEventListener('reset', onReset)
  }, [initial, controlled])
  const set = (v) => { const d = v.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12); setOwn(d); onChange?.(d) }
  return (
    <div className="money-input">
      <span aria-hidden="true">Rp</span>
      <input ref={ref} id={id} className="form-input" inputMode="numeric" autoComplete="off" placeholder={placeholder}
        value={groupDigits(digits)} onChange={(e) => set(e.target.value)} required={required} autoFocus={autoFocus} />
      <input type="hidden" name={name} value={digits} />
    </div>
  )
}

// ─── Tabs (kept in ?tab= so a refresh or a link lands on the same tab) ──
export function useTab(initial, ids) {
  const [tab, setTab] = useState(ids.includes(initial) ? initial : ids[0])
  const select = (id) => {
    setTab(id)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', id)
    window.history.replaceState(window.history.state, '', url)
  }
  return [tab, select]
}

export function Tabs({ tabs, active, onChange, label }) {
  const nav = useRef(null)
  // On phones the tab row scrolls sideways; keep the active tab visible.
  useEffect(() => {
    nav.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active])
  return (
    <div className="tab-nav" role="tablist" aria-label={label} ref={nav}>
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-controls={`panel-${t.id}`} aria-selected={active === t.id}
          className={`tab-btn${active === t.id ? ' active' : ''}`} onClick={() => onChange(t.id)}>
          {t.icon && <Icon name={t.icon} size={16} />}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

/** All panels stay mounted (just hidden), so unsaved edits survive switching tabs. */
export function TabPanel({ id, active, children }) {
  return <section role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={active !== id}>{children}</section>
}

export function Notice({ tone = 'info', icon = 'info', children }) {
  return <div className={`notice notice-${tone}`}><Icon name={icon} size={16} /><div>{children}</div></div>
}
