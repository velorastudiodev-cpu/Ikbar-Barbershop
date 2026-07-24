'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Add HPP Item ────────────────────────────────────────────────────
export async function addHpp(prevState, formData) {
  const supabase = await createClient()

  const item_name = formData.get('item_name')?.trim()
  const category = formData.get('category')?.trim() || 'Layanan'
  const selling_price = parseFloat(formData.get('selling_price'))
  const cost = parseFloat(formData.get('cost'))
  const unit = formData.get('unit')?.trim() || null
  const notes = formData.get('notes')?.trim() || null

  if (!item_name) return { error: 'Nama item wajib diisi' }
  if (isNaN(selling_price) || selling_price < 0) return { error: 'Harga jual harus angka positif' }
  if (isNaN(cost) || cost < 0) return { error: 'HPP/biaya harus angka positif' }

  const { error } = await supabase.from('hpp').insert({
    item_name,
    category,
    selling_price,
    cost,
    unit,
    notes,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/penjualan')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Update HPP Item ─────────────────────────────────────────────────
export async function updateHpp(prevState, formData) {
  const supabase = await createClient()

  const id = formData.get('id')
  const item_name = formData.get('item_name')?.trim()
  const category = formData.get('category')?.trim() || 'Layanan'
  const selling_price = parseFloat(formData.get('selling_price'))
  const cost = parseFloat(formData.get('cost'))
  const unit = formData.get('unit')?.trim() || null
  const notes = formData.get('notes')?.trim() || null

  if (!id) return { error: 'ID tidak ditemukan' }
  if (!item_name) return { error: 'Nama item wajib diisi' }
  if (isNaN(selling_price) || selling_price < 0) return { error: 'Harga jual harus angka positif' }
  if (isNaN(cost) || cost < 0) return { error: 'HPP/biaya harus angka positif' }

  const { error } = await supabase
    .from('hpp')
    .update({ item_name, category, selling_price, cost, unit, notes })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/penjualan')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Delete HPP Item ─────────────────────────────────────────────────
export async function deleteHpp(id) {
  const supabase = await createClient()

  const { error } = await supabase.from('hpp').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/penjualan')
  revalidatePath('/dashboard')
  return { success: true }
}
