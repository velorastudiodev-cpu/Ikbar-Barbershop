'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Google Icon ─────────────────────────────────────────────────────
function IconGoogle({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function IconLoader({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

// ─── Login Page ──────────────────────────────────────────────────────
export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (oauthError) {
      setError('Gagal login dengan Google. Silakan coba lagi.')
      setLoading(false)
    }
    // Jika berhasil, browser otomatis redirect ke Google — tidak perlu setLoading(false)
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .login-card { animation: fadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1); }

        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px 20px;
          background: #fff;
          color: #3c4043;
          border: 1.5px solid #dadce0;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
          letter-spacing: 0.01em;
        }
        .btn-google:hover:not(:disabled) {
          background: #f8f9fa;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          border-color: #bdc1c6;
        }
        .btn-google:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
          color: var(--text-muted);
          font-size: 0.78rem;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
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

          {/* Google Login Button */}
          <div style={{ marginTop: '28px' }}>
            <button
              id="btn-google-login"
              className="btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <IconLoader size={18} />
                  Mengarahkan ke Google...
                </>
              ) : (
                <>
                  <IconGoogle size={20} />
                  Masuk dengan Google
                </>
              )}
            </button>

            {error && (
              <div className="form-error" role="alert" style={{ marginTop: '14px' }}>
                {error}
              </div>
            )}
          </div>

          <div className="login-footer" style={{ marginTop: '32px' }}>
            Akses terbatas · Hanya Ikbar Barbershop
          </div>
        </div>
      </div>
    </>
  )
}
