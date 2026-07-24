'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Update Cash Balance ─────────────────────────────────────────────
export async function updateCash(prevState, formData) {
  const supabase = await createClient()

  const newBalance = parseFloat(formData.get('balance'))
  const notes = formData.get('notes') || null

  if (isNaN(newBalance) || newBalance < 0) {
    return { error: 'Saldo kas harus angka positif' }
  }

  // Ambil saldo sekarang
  const { data: currentCash, error: fetchError } = await supabase
    .from('cash')
    .select('id, balance')
    .limit(1)
    .single()

  if (fetchError) return { error: fetchError.message }

  const balanceBefore = Number(currentCash.balance)
  const changeAmount = newBalance - balanceBefore

  // Update saldo
  const { error: updateError } = await supabase
    .from('cash')
    .update({ balance: newBalance })
    .eq('id', currentCash.id)

  if (updateError) return { error: updateError.message }

  // Catat ke cash_log
  const { error: logError } = await supabase.from('cash_log').insert({
    balance_before: balanceBefore,
    balance_after: newBalance,
    change_amount: changeAmount,
    notes,
  })

  if (logError) return { error: logError.message }

  revalidatePath('/dashboard/penjualan')
  revalidatePath('/dashboard')
  return { success: true, newBalance }
}
