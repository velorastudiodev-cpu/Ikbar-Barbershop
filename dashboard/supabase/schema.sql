-- ═══════════════════════════════════════════════════════════════════════
-- IKBAR BARBERSHOP — Database Schema (Fase 1)
-- Jalankan file ini di: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Extensions ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tabel: sales (Penjualan Harian) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date        NOT NULL,
  total_trx   integer     NOT NULL DEFAULT 0 CHECK (total_trx >= 0),
  total_omzet numeric(14,2) NOT NULL DEFAULT 0 CHECK (total_omzet >= 0),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE sales IS 'Penjualan harian Ikbar Barbershop';
COMMENT ON COLUMN sales.date IS 'Tanggal penjualan (satu record per hari)';
COMMENT ON COLUMN sales.total_trx IS 'Jumlah transaksi pada hari tersebut';
COMMENT ON COLUMN sales.total_omzet IS 'Total omzet (IDR) pada hari tersebut';

-- ─── Tabel: cash (Saldo Kas) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  balance     numeric(14,2) NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE cash IS 'Saldo kas terkini Ikbar Barbershop (satu baris aktif)';

-- Seed 1 baris awal saldo kas
INSERT INTO cash (balance) VALUES (0)
ON CONFLICT DO NOTHING;

-- ─── Tabel: hpp (Harga Pokok Penjualan) ──────────────────────────────
CREATE TABLE IF NOT EXISTS hpp (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name   text        NOT NULL,
  category    text,
  unit        text,
  cost        numeric(14,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hpp IS 'Harga pokok penjualan per item/layanan';
COMMENT ON COLUMN hpp.item_name IS 'Nama produk atau layanan';
COMMENT ON COLUMN hpp.category IS 'Kategori: Layanan, Produk, Operasional, dll';
COMMENT ON COLUMN hpp.cost IS 'Biaya (IDR) per unit';

-- ─── Tabel: site_content (Konten Website) ────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section     text        NOT NULL UNIQUE,
  content     jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE site_content IS 'Konten website landing page yang bisa diedit';
COMMENT ON COLUMN site_content.section IS 'Nama section: hero, about, barber, services, lokasi, kontak';
COMMENT ON COLUMN site_content.content IS 'Data konten dalam format JSON — fleksibel per section';

-- Seed section awal (sesuai section di landing page)
INSERT INTO site_content (section, content) VALUES
  ('hero', '{"title": "IKBAR Barbershop", "tagline": "Bukan sekadar cukur — setiap sesi dimulai dengan konsultasi mendalam.", "wa_number": "6283110071825"}'),
  ('about', '{"title": "Seni Cukur Warisan Keluarga", "description": "Ikbar Barbershop lahir dari passion yang sudah mengalir dalam darah.", "founded_year": "2024", "image_url": ""}'),
  ('barber', '{"name": "Ikbar Kamil", "title": "Head Barber & Founder", "bio": "Penerus tradisi keluarga yang telah berpengalaman dalam seni memotong rambut.", "photo_url": ""}'),
  ('services', '{"tagline": "Konsultasi gratis sebelum cukur", "note": "Semua layanan utama Rp 25.000"}'),
  ('lokasi', '{"address": "Isi alamat lengkap Ikbar Barbershop", "maps_url": "", "hours_weekday": "08.00 - 21.00", "hours_weekend": "08.00 - 21.00"}'),
  ('kontak', '{"wa_number": "6283110071825", "instagram": "ikbarbarbershop"}'
)
ON CONFLICT (section) DO NOTHING;

-- ─── Row Level Security ───────────────────────────────────────────────
-- Enable RLS pada semua tabel
ALTER TABLE sales       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpp         ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Policy: hanya authenticated user yang bisa akses semua operasi
CREATE POLICY "Authenticated users only" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON cash
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON hpp
  FOR ALL USING (auth.role() = 'authenticated');

-- site_content: read untuk public (agar website bisa fetch konten), write hanya authenticated
CREATE POLICY "Public read site_content" ON site_content
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write site_content" ON site_content
  FOR ALL USING (auth.role() = 'authenticated');

-- ─── Fungsi: auto-update updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk semua tabel dengan updated_at
CREATE TRIGGER set_updated_at_sales
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_hpp
  BEFORE UPDATE ON hpp
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_site_content
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Storage Bucket: site-media (untuk Fase 3) ───────────────────────
-- Jalankan ini setelah tabel berhasil dibuat
-- Atau buat manual di: Supabase Dashboard → Storage → New Bucket
-- Nama bucket: "site-media", set sebagai Public

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('site-media', 'site-media', true)
-- ON CONFLICT DO NOTHING;
