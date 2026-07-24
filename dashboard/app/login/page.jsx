'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── SVG Icons ──────────────────────────────────────────────────────
function IconEye({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconAlertCircle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconLoader({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

// ─── Login Page ──────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError('Email atau password salah. Silakan coba lagi.')
      setLoading(false)
      return
    }

    // Redirect ke dashboard setelah berhasil
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .login-card { animation: fadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
        .toggle-pw {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          transition: color 0.15s;
          display: flex; align-items: center;
          background: none; border: none; cursor: pointer; padding: 2px;
        }
        .toggle-pw:hover { color: var(--text-secondary); }
        .pw-wrapper { position: relative; }
        .pw-wrapper .form-input { padding-right: 38px; }
      `}</style>

      <div className="login-page">
        {/* Background */}
        <div className="login-bg-grid" aria-hidden="true" />
        <div className="login-bg-glow" aria-hidden="true" />

        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-mark">
              <span>IB</span>
            </div>
            <div>
              <div className="login-logo-title">Ikbar Barbershop</div>
              <div className="login-logo-sub">Dashboard Admin</div>
            </div>
          </div>

          <h1 className="login-heading">Masuk ke Dashboard</h1>
          <p className="login-subheading">Hanya untuk Ikbar — akses terbatas</p>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`form-input${error ? ' error' : ''}`}
                placeholder="ikbar@barbershop.id"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="pw-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input${error ? ' error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="form-error" role="alert">
                <IconAlertCircle size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-login"
              id="btn-masuk"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <IconLoader size={14} />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className="login-footer">
            Akses terbatas · Hanya Ikbar Barbershop
          </div>
        </div>
      </div>
    </>
  )
}
