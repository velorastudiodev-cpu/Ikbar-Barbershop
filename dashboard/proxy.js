import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * proxy.js — Next.js 16+ route protection
 * Memproteksi semua route /dashboard/* dengan cek sesi Supabase.
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl
  const isDashboardRoute = pathname.startsWith('/dashboard')

  const configuredAdmins = (process.env.CMS_ADMIN_EMAILS || 'velorastudiodev@gmail.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  // Guard: jika env vars tidak ada, jangan crash — log dan lanjut
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[proxy] MISSING ENV VARS:',
      'NEXT_PUBLIC_SUPABASE_URL=', supabaseUrl ? 'SET' : 'MISSING',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=', supabaseKey ? 'SET' : 'MISSING'
    )
    // Redirect ke login supaya tidak crash total
    if (isDashboardRoute) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh session
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[proxy] supabase.auth.getUser() error:', error.message)
    }

    // Redirect ke /login jika belum login dan mencoba akses /dashboard
    if (!user && isDashboardRoute) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }

    const isAdmin = user && (
      user.app_metadata?.role === 'admin' ||
      configuredAdmins.includes(user.email?.toLowerCase())
    )
    if (isDashboardRoute && user && !isAdmin) {
      return NextResponse.json({ error: 'Akses admin diperlukan' }, { status: 403 })
    }

    // Redirect ke /dashboard jika sudah login dan mengakses /login
    if (user && isAdmin && pathname === '/login') {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }

  } catch (err) {
    console.error('[proxy] UNCAUGHT ERROR:', err?.message, err?.stack)
    // Jangan crash — biarkan request lanjut
    if (isDashboardRoute) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
