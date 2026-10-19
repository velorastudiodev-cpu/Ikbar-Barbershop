import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isSafeInternalPath } from '@/lib/security'

/**
 * Auth Callback Route
 * Dipanggil oleh Supabase setelah Google OAuth selesai.
 * Tugas: tukar ?code= menjadi session cookie, lalu redirect ke dashboard.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = isSafeInternalPath(searchParams.get('next'), '/dashboard')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Session berhasil dibuat — redirect ke dashboard
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Jika gagal, redirect ke login dengan pesan error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
