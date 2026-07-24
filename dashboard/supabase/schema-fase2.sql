-- ═══════════════════════════════════════════════════════════════════════
-- IKBAR BARBERSHOP — Database Migration (Fase 2)
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- CATATAN: Jalankan SETELAH schema-fase1.sql sudah dijalankan
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Tambah kolom selling_price ke hpp ───────────────────────────────
-- Harga jual per layanan (untuk hitung margin = selling_price - cost)
ALTER TABLE hpp ADD COLUMN IF NOT EXISTS selling_price numeric(14,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN hpp.selling_price IS 'Harga jual ke pelanggan (IDR) — untuk kalkulasi margin';
COMMENT ON COLUMN hpp.cost IS 'HPP / biaya modal per unit (IDR)';

-- ─── Tabel: cash_log (Riwayat Perubahan Kas) ─────────────────────────
CREATE TABLE IF NOT EXISTS cash_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_before numeric(14,2) NOT NULL,
  balance_after  numeric(14,2) NOT NULL,
  change_amount  numeric(14,2) NOT NULL,  -- positif = tambah, negatif = kurangi
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE cash_log IS 'Riwayat setiap perubahan saldo kas';
COMMENT ON COLUMN cash_log.balance_before IS 'Saldo sebelum perubahan';
COMMENT ON COLUMN cash_log.balance_after IS 'Saldo setelah perubahan';
COMMENT ON COLUMN cash_log.change_amount IS 'Selisih: positif = pemasukan, negatif = pengeluaran';
COMMENT ON COLUMN cash_log.notes IS 'Keterangan perubahan, misal: ambil buat modal, setoran harian';

-- ─── RLS untuk cash_log ───────────────────────────────────────────────
ALTER TABLE cash_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users only" ON cash_log
  FOR ALL USING (auth.role() = 'authenticated');
