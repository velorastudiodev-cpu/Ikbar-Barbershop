'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Update site_content section ─────────────────────────────────────
export async function updateSiteContent(prevState, formData) {
  const supabase = await createClient()
  const section = formData.get('section')
  const contentRaw = formData.get('content')

  if (!section) return { error: 'Section tidak ditemukan' }

  let content
  try {
    content = JSON.parse(contentRaw)
  } catch {
    return { error: 'Format konten tidak valid' }
  }

  const { error } = await supabase
    .from('site_content')
    .update({ content })
    .eq('section', section)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/website')
  return { success: true }
}

// ─── Upload file ke Supabase Storage ─────────────────────────────────
export async function uploadFile(prevState, formData) {
  const supabase = await createClient()
  const file = formData.get('file')
  const folder = formData.get('folder') || 'gallery'

  if (!file || file.size === 0) return { error: 'File tidak ditemukan' }

  // Validasi ukuran
  const isVideo = file.type.startsWith('video/')
  const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: isVideo ? 'Video maksimal 50MB' : 'Foto maksimal 5MB' }
  }

  const BUCKET = 'site-media'

  // Generate nama unik
  const ext = file.name.split('.').pop()
  const timestamp = Date.now()
  const filename = `${folder}/${timestamp}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })


  if (error) return { error: error.message }

  const { data: urlData } = supabase.storage
    .from('site-media')
    .getPublicUrl(data.path)

  return { success: true, url: urlData.publicUrl, path: data.path }
}

// ─── Delete file dari Supabase Storage ───────────────────────────────
export async function deleteStorageFile(path) {
  const supabase = await createClient()
  const { error } = await supabase.storage.from('site-media').remove([path])
  if (error) return { error: error.message }
  return { success: true }
}

// ─── GALLERY: Add item ────────────────────────────────────────────────
export async function addGalleryItem(prevState, formData) {
  const supabase = await createClient()

  const src = formData.get('src')?.trim()
  const type = formData.get('type') || 'image'
  const alt = formData.get('alt')?.trim() || ''
  const category = type === 'video' ? 'Video' : 'Foto'

  if (!src) return { error: 'URL file wajib diisi' }

  // Get max sort_order
  const { data: maxData } = await supabase
    .from('gallery_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = (maxData?.sort_order ?? 0) + 1

  const { error } = await supabase.from('gallery_items').insert({
    src, type, alt, category, sort_order: sortOrder,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/website')
  return { success: true }
}

// ─── GALLERY: Delete item ─────────────────────────────────────────────
export async function deleteGalleryItem(id) {
  const supabase = await createClient()

  // Ambil path storage jika URL adalah dari Supabase
  const { data: item } = await supabase
    .from('gallery_items')
    .select('src')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('gallery_items').delete().eq('id', id)
  if (error) return { error: error.message }

  // Hapus dari storage jika path mengandung supabase
  if (item?.src?.includes('supabase')) {
    const path = item.src.split('/site-media/')[1]
    if (path) {
      await supabase.storage.from('site-media').remove([path])
    }
  }

  revalidatePath('/dashboard/website')
  return { success: true }
}

// ─── SERVICES: Add ────────────────────────────────────────────────────
export async function addService(prevState, formData) {
  const supabase = await createClient()

  const name = formData.get('name')?.trim()
  const description = formData.get('description')?.trim() || ''
  const price = formData.get('price')?.trim() || 'Rp 25.000'
  const category = formData.get('category') || 'utama'
  const highlight = formData.get('highlight') === 'true'

  if (!name) return { error: 'Nama layanan wajib diisi' }

  const { data: maxData } = await supabase
    .from('services')
    .select('sort_order')
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = (maxData?.sort_order ?? 0) + 1

  const { error } = await supabase.from('services').insert({
    name, description, price, category, highlight, sort_order: sortOrder,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/website')
  return { success: true }
}

// ─── SERVICES: Update ─────────────────────────────────────────────────
export async function updateService(prevState, formData) {
  const supabase = await createClient()

  const id = formData.get('id')
  const name = formData.get('name')?.trim()
  const description = formData.get('description')?.trim() || ''
  const price = formData.get('price')?.trim() || 'Rp 25.000'
  const category = formData.get('category') || 'utama'
  const highlight = formData.get('highlight') === 'true'

  if (!id) return { error: 'ID tidak ditemukan' }
  if (!name) return { error: 'Nama layanan wajib diisi' }

  const { error } = await supabase
    .from('services')
    .update({ name, description, price, category, highlight })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/website')
  return { success: true }
}

// ─── SERVICES: Delete ─────────────────────────────────────────────────
export async function deleteService(id) {
  const supabase = await createClient()

  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/website')
  return { success: true }
}
