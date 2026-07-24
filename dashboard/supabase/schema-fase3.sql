-- ═══════════════════════════════════════════════════════════════════════
-- IKBAR BARBERSHOP — Database Migration (Fase 3: CMS)
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- CATATAN: Jalankan SETELAH schema.sql dan schema-fase2.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Tabel: gallery_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  src        text        NOT NULL,
  type       text        NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  alt        text        NOT NULL DEFAULT '',
  category   text        NOT NULL DEFAULT 'Foto' CHECK (category IN ('Foto', 'Video')),
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE gallery_items IS 'Item galeri (foto & video) yang tampil di landing page';
COMMENT ON COLUMN gallery_items.src IS 'URL publik file di Supabase Storage';
COMMENT ON COLUMN gallery_items.type IS 'image atau video';
COMMENT ON COLUMN gallery_items.sort_order IS 'Urutan tampil di galeri (0 = paling awal)';

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- Public bisa read (untuk landing page tanpa auth)
CREATE POLICY "Public read gallery_items" ON gallery_items
  FOR SELECT USING (true);

-- Hanya authenticated yang bisa write
CREATE POLICY "Authenticated write gallery_items" ON gallery_items
  FOR ALL USING (auth.role() = 'authenticated');

-- ─── Tabel: services ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  description text       NOT NULL DEFAULT '',
  price      text        NOT NULL DEFAULT 'Rp 25.000',
  category   text        NOT NULL DEFAULT 'utama' CHECK (category IN ('utama', 'tambahan')),
  highlight  boolean     NOT NULL DEFAULT false,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE services IS 'Daftar layanan & harga yang tampil di landing page';
COMMENT ON COLUMN services.category IS 'utama = Style Cukuran, tambahan = Layanan Tambahan';
COMMENT ON COLUMN services.highlight IS 'Tandai sebagai item yang di-highlight (bold)';

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write services" ON services
  FOR ALL USING (auth.role() = 'authenticated');


-- ─── Seed: gallery_items dari aset lokal yang ada ─────────────────────
-- URL menggunakan path lokal dulu — Ikbar bisa upload ulang via CMS nanti
-- atau bisa upload aset ke Storage dan update src-nya
INSERT INTO gallery_items (src, type, alt, category, sort_order) VALUES
  ('/assets/gallery-1.jpg',     'image', 'Hasil cukuran Ikbar Barbershop 1',   'Foto',  1),
  ('/assets/gallery-2.jpg',     'image', 'Hasil cukuran Ikbar Barbershop 2',   'Foto',  2),
  ('/assets/gallery-3.jpg',     'image', 'Hasil cukuran Ikbar Barbershop 3',   'Foto',  3),
  ('/assets/gallery-new-1.jpg', 'image', 'Portofolio Ikbar Barbershop',        'Foto',  4),
  ('/assets/gallery-vid-1.mp4', 'video', 'Proses cukuran Ikbar — Video 1',     'Video', 5),
  ('/assets/gallery-vid-2.mp4', 'video', 'Proses cukuran Ikbar — Video 2',     'Video', 6),
  ('/assets/gallery-vid-3.mp4', 'video', 'Proses cukuran Ikbar — Video 3',     'Video', 7),
  ('/assets/gallery-new-vid-1.mp4', 'video', 'Aksi Ikbar Barbershop — Video 4','Video', 8),
  ('/assets/gallery-new-vid-2.mp4', 'video', 'Aksi Ikbar Barbershop — Video 5','Video', 9),
  ('/assets/gallery-new-vid-3.mp4', 'video', 'Aksi Ikbar Barbershop — Video 6','Video', 10),
  ('/assets/gallery-new-vid-4.mp4', 'video', 'Aksi Ikbar Barbershop — Video 7','Video', 11)
ON CONFLICT DO NOTHING;

-- ─── Seed: services ───────────────────────────────────────────────────
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Crew Cut',        'Potongan pendek rapi, sisi bersih & atas pendek tipis',           'Rp 25.000', 'utama', 1),
  ('Undercut',        'Sisi & belakang dicukur pendek, atas tetap panjang',              'Rp 25.000', 'utama', 2),
  ('Fade / Taper',    'Gradasi halus dari pendek ke panjang — bersih & presisi',         'Rp 25.000', 'utama', 3),
  ('Skin Fade',       'Fade sampai kulit — tampilan tajam & clean',                      'Rp 25.000', 'utama', 4),
  ('Pompadour',       'Volume tinggi ke depan, sisi pendek, berkesan maskulin',          'Rp 25.000', 'utama', 5),
  ('Slick Back',      'Rambut disisir ke belakang, kesan formal & elegan',               'Rp 25.000', 'utama', 6),
  ('Textured Crop',   'Atas bertekstur natural, sisi ringan — gaya kasual modern',       'Rp 25.000', 'utama', 7),
  ('Buzz Cut',        'Serba pendek merata — tampilan simpel & bersih',                  'Rp 25.000', 'utama', 8),
  ('Perming',         'Style permin ala Korea memaksimalkan rambut bervolume — tanya langsung ke Ikbar', 'Tanya Ikbar', 'tambahan', 1),
  ('Creambath',       'Perawatan rambut + pijat kepala relaksasi — tanya langsung ke Ikbar', 'Tanya Ikbar', 'tambahan', 2),
  ('Blow Dry & Styling', 'Pengeringan & penataan gaya rambut akhir — tanya langsung ke Ikbar', 'Tanya Ikbar', 'tambahan', 3)
ON CONFLICT DO NOTHING;

-- ─── Update site_content: tambah video_url ke section 'lokasi' ────────
-- Tambah field hours_data (JSON array) dan video_url ke content yang ada
UPDATE site_content
SET content = content || '{
  "hours_data": [
    {"hari": "Senin – Jumat", "jam": "16:00 – 21:00", "tutup": false},
    {"hari": "Sabtu", "jam": "10:00 – 21:00", "tutup": false},
    {"hari": "Minggu", "jam": "10:00 – 21:00", "tutup": false}
  ]
}'::jsonb
WHERE section = 'lokasi';

-- Tambah video_url ke section baru 'video'
INSERT INTO site_content (section, content)
VALUES ('video', '{"video_url": "/assets/main-video.mp4"}')
ON CONFLICT (section) DO NOTHING;
