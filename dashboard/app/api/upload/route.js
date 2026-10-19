import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import {
  hasValidFileSignature,
  isSameOrigin,
  requireAdmin,
  validateUpload,
} from '@/lib/security'

export const maxDuration = 60 // 60 detik timeout untuk file besar

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Origin tidak diizinkan' }, { status: 403 })
    }
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > 52 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran request terlalu besar' }, { status: 413 })
    }

    const { supabase, error: authError } = await requireAdmin()
    if (authError) return NextResponse.json({ error: authError }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = formData.get('folder') || 'gallery'

    const validation = validateUpload(file, folder)
    if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!hasValidFileSignature(buffer, validation.mime)) {
      return NextResponse.json({ error: 'Isi file tidak cocok dengan formatnya' }, { status: 400 })
    }

    const filename = `${folder}/${randomUUID()}.${validation.extension}`

    const { data, error } = await supabase.storage
      .from('site-media')
      .upload(filename, buffer, {
        contentType: validation.mime,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('site-media')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    })
  } catch (err) {
    console.error('[upload] error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
