import { createClient } from '@/lib/supabase/server'

// The allowlist is intentionally server-side. Do not use user_metadata here:
// a signed-in user can change that field themselves.
const FALLBACK_ADMIN_EMAIL = 'velorastudiodev@gmail.com'

export const UPLOAD_RULES = {
  'image/jpeg': { extension: 'jpg', maxSize: 5 * 1024 * 1024 },
  'image/png': { extension: 'png', maxSize: 5 * 1024 * 1024 },
  'image/webp': { extension: 'webp', maxSize: 5 * 1024 * 1024 },
  'image/avif': { extension: 'avif', maxSize: 5 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', maxSize: 50 * 1024 * 1024 },
  'video/webm': { extension: 'webm', maxSize: 50 * 1024 * 1024 },
  'video/quicktime': { extension: 'mov', maxSize: 50 * 1024 * 1024 },
}

export const ALLOWED_UPLOAD_FOLDERS = new Set(['gallery', 'video', 'about', 'barber'])

function configuredAdminEmails() {
  const configured = (process.env.CMS_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  // Keep the existing owner able to access the CMS while deployments add an
  // explicit CMS_ADMIN_EMAILS value. The environment variable overrides this.
  return new Set(configured.length ? configured : [FALLBACK_ADMIN_EMAIL])
}

export function isAdminUser(user) {
  if (!user?.email) return false
  const role = user.app_metadata?.role
  return role === 'admin' || configuredAdminEmails().has(user.email.toLowerCase())
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || !isAdminUser(user)) {
    return { supabase, user: null, error: 'Akses admin diperlukan' }
  }

  return { supabase, user, error: null }
}

export function isSameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

export function validateUpload(file, folder) {
  if (!file || typeof file.arrayBuffer !== 'function' || !file.size) {
    return { error: 'File tidak ditemukan' }
  }

  if (typeof folder !== 'string' || !ALLOWED_UPLOAD_FOLDERS.has(folder)) {
    return { error: 'Folder upload tidak valid' }
  }

  const mime = (file.type || '').toLowerCase()
  const rule = UPLOAD_RULES[mime]
  if (!rule) return { error: 'Format file tidak didukung' }
  if (file.size > rule.maxSize) {
    return { error: mime.startsWith('video/') ? 'Video maksimal 50MB' : 'Foto maksimal 5MB' }
  }

  return { mime, extension: rule.extension }
}

export function hasValidFileSignature(buffer, mime) {
  if (!buffer || buffer.length < 4) return false
  if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  if (mime === 'image/avif') return buffer.subarray(4, 8).toString() === 'ftyp' || buffer.subarray(4, 12).toString().includes('ftyp')
  if (mime === 'video/mp4' || mime === 'video/quicktime') return buffer.subarray(4, 8).toString() === 'ftyp'
  if (mime === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  return false
}

export function isSafeStoragePath(path) {
  return typeof path === 'string'
    && path.length <= 300
    && /^(gallery|video|about|barber)\/[a-zA-Z0-9-]+\.(?:jpg|png|webp|avif|mp4|webm|mov)$/.test(path)
}

export function isSafeInternalPath(value, fallback = '/dashboard') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const url = new URL(value, 'https://internal.invalid')
    return url.origin === 'https://internal.invalid' ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch {
    return fallback
  }
}
