'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/security'

// ─── Add Sale ────────────────────────────────────────────────────────
export async function addSale(prevState, formData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const date = formData.get('date')
  const total_trx = parseInt(formData.get('total_trx'), 10)
  const total_omzet = parseFloat(formData.get('total_omzet'))
  const notes = formData.get('notes') || null

  // Validasi
  if (!date) return { error: 'Tanggal wajib diisi' }
  if (isNaN(total_trx) || total_trx < 0) return { error: 'Jumlah transaksi harus angka positif' }
  if (isNaN(total_omzet) || total_omzet < 0) return { error: 'Total omzet harus angka positif' }

  const { error } = await supabase.from('sales').insert({
    date,
    total_trx,
    total_omzet,
    notes,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/penjualan')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Update Sale ─────────────────────────────────────────────────────
export async function updateSale(prevState, formData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const id = formData.get('id')
  const date = formData.get('date')
  const total_trx = parseInt(formData.get('total_trx'), 10)
  const total_omzet = parseFloat(formData.get('total_omzet'))
  const notes = formData.get('notes') || null

  if (!id) return { error: 'ID tidak ditemukan' }
  if (!date) return { error: 'Tanggal wajib diisi' }
  if (isNaN(total_trx) || total_trx < 0) return { error: 'Jumlah transaksi harus angka positif' }
  if (isNaN(total_omzet) || total_omzet < 0) return { error: 'Total omzet harus angka positif' }

  const { error } = await supabase
    .from('sales')
    .update({ date, total_trx, total_omzet, notes })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/penjualan')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Delete Sale ─────────────────────────────────────────────────────
export async function deleteSale(id) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  if (!id || typeof id !== 'string' || id.length > 100) return { error: 'ID tidak valid' }

  const { error } = await supabase.from('sales').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/penjualan')
  revalidatePath('/dashboard')
  return { success: true }
}
