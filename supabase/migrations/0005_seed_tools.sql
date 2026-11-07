-- ============================================================================
-- RuangKumpul — Seed Data Tools (Migration 0005)
-- Menyalin 21 tools dari src/modules/tools/tools-registry/registry.ts ke tabel
-- public.tools agar favorites, usage logging, dan admin konten berfungsi.
-- Idempoten: aman dijalankan berulang.
-- ============================================================================

-- Counter pemakaian tool (aman, tanpa membuka update RLS)
create or replace function public.increment_tool_usage(p_tool uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tools set usage_count = usage_count + 1 where id = p_tool;
$$;

grant execute on function public.increment_tool_usage(uuid) to anon, authenticated;

insert into public.tools (name, slug, description, category_id, icon, route, seo_title, seo_description)
select v.name, v.slug, v.description, c.id, v.icon, v.route, v.seo_title, v.seo_description
from (values
  ('Penghitung Kata', 'word-counter', 'Hitung jumlah kata, karakter, kalimat, dan paragraf secara real-time. Dilengkapi estimasi waktu baca.', 'teks', 'FileText', '/tools/word-counter', 'Penghitung Kata Online Gratis — Hitung Kata & Karakter', 'Hitung jumlah kata, karakter, kalimat, dan paragraf secara online dan gratis. Tanpa login, hasil real-time, privasi aman karena teks diproses di browser.'),
  ('Konverter Huruf', 'case-converter', 'Ubah teks ke huruf besar, kecil, Title Case, Sentence case, camelCase, snake_case, dan lainnya sekaligus.', 'teks', 'CaseSensitive', '/tools/case-converter', 'Konverter Huruf Online — UPPERCASE, lowercase, Title Case', 'Konversi teks ke berbagai format huruf: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case. Gratis dan tanpa login.'),
  ('Lorem Ipsum', 'lorem-ipsum', 'Generate teks placeholder lorem ipsum sesuai jumlah paragraf, kalimat, atau kata yang dibutuhkan.', 'teks', 'TextQuote', '/tools/lorem-ipsum', 'Generator Lorem Ipsum Indonesia — Teks Placeholder Gratis', 'Generate teks placeholder lorem ipsum untuk desain dan mockup. Atur jumlah paragraf, kalimat, atau kata. Gratis, cepat, tanpa login.'),
  ('JSON Formatter', 'json-formatter', 'Format, beautify, dan minify JSON dengan indentasi rapi. Validasi otomatis dengan pesan error yang jelas.', 'developer', 'Braces', '/tools/json-formatter', 'JSON Formatter & Beautify Online — Format JSON Rapi', 'Format dan rapikan JSON online secara gratis. Beautify dengan indentasi 2 atau 4 spasi, minify untuk produksi, dan validasi error otomatis.'),
  ('JSON Validator', 'json-validator', 'Validasi struktur JSON dengan laporan error lengkap: baris, kolom, dan deskripsi masalahnya.', 'developer', 'ShieldCheck', '/tools/json-validator', 'JSON Validator Online — Cek Validitas JSON', 'Validasi JSON online dengan laporan error detail (baris & kolom). Pastikan JSON Anda valid sebelum dipakai di API atau konfigurasi.'),
  ('Generator UUID', 'uuid-generator', 'Generate UUID v4 yang aman secara kriptografis, satu atau banyak sekaligus, siap dipakai untuk ID unik.', 'developer', 'Fingerprint', '/tools/uuid-generator', 'UUID Generator Online — Generate UUID v4 Bulk', 'Generate UUID v4 (random) secara online, satu atau ratusan sekaligus. Menggunakan crypto API browser sehingga hasilnya acak dan aman.'),
  ('Base64 Encoder', 'base64-encoder', 'Encode teks ke Base64 atau decode Base64 kembali ke teks asli. Mendukung karakter Unicode penuh.', 'encoding', 'Binary', '/tools/base64-encoder', 'Base64 Encode & Decode Online — Gratis dan Aman', 'Konversi teks ke Base64 dan sebaliknya secara online. Mendukung Unicode penuh termasuk emoji. Gratis, tanpa login, diproses di browser.'),
  ('URL Encoder', 'url-encoder', 'Encode atau decode URL (percent-encoding) agar aman dikirim sebagai parameter query.', 'encoding', 'Link2', '/tools/url-encoder', 'URL Encoder & Decoder Online — Percent Encoding', 'Encode dan decode URL online dengan standar percent-encoding. Pastikan parameter query URL Anda valid dan aman.'),
  ('Generator QR Code', 'qr-code-generator', 'Buat QR code dari teks atau link. Atur ukuran dan tingkat koreksi error, lalu unduh sebagai PNG.', 'generator', 'QrCode', '/tools/qr-code-generator', 'QR Code Generator Online Gratis — Buat QR Code PNG', 'Buat QR code untuk link, teks, WiFi, dan lainnya secara gratis. Atur ukuran dan koreksi error, unduh PNG resolusi tinggi tanpa watermark.'),
  ('Generator Password', 'password-generator', 'Buat password acak yang kuat dengan crypto API browser. Atur panjang dan jenis karakter.', 'generator', 'KeyRound', '/tools/password-generator', 'Password Generator Aman Online — Buat Password Kuat', 'Generate password acak yang kuat dan aman. Atur panjang hingga 64 karakter, sertakan simbol, angka, dan hindari karakter ambigu. Gratis.'),
  ('Kalkulator Persen', 'percentage-calculator', 'Hitung persen dari angka, kenaikan/penurunan persen, dan persentase dari dua nilai dengan cepat.', 'kalkulator', 'Percent', '/tools/percentage-calculator', 'Kalkulator Persen Online — Hitung Persen Cepat', 'Kalkulator persen lengkap: X% dari Y, berapa persen X dari Y, serta kenaikan dan penurunan persen. Gratis dan mudah digunakan.'),
  ('Kalkulator Umur', 'age-calculator', 'Hitung umur persis dari tanggal lahir: tahun, bulan, hari, hingga total hari hidup.', 'kalkulator', 'Cake', '/tools/age-calculator', 'Kalkulator Umur Online — Hitung Usia dari Tanggal Lahir', 'Hitung umur Anda secara detail dari tanggal lahir: tahun, bulan, hari, dan total hari hidup. Cepat, gratis, tanpa login.'),
  ('Kalkulator Tanggal', 'date-calculator', 'Hitung selisih hari antara dua tanggal, atau tambah/kurangi hari dari tanggal tertentu.', 'kalkulator', 'CalendarDays', '/tools/date-calculator', 'Kalkulator Selisih Tanggal Online — Hitung Hari', 'Hitung selisih hari, minggu, dan bulan antara dua tanggal, atau tambah/kurangi hari dari tanggal tertentu. Gratis dan akurat.'),
  ('Konversi Satuan', 'unit-converter', 'Konversi satuan panjang, berat, suhu, dan data digital dalam satu tempat.', 'kalkulator', 'Ruler', '/tools/unit-converter', 'Konversi Satuan Online — Panjang, Berat, Suhu, Data', 'Konverter satuan lengkap: meter, kilogram, Celsius/Fahrenheit, KB/MB/GB, dan lainnya. Cepat, akurat, gratis.'),
  ('Timer Pomodoro', 'pomodoro-timer', 'Timer pomodoro 25 menit dengan istirahat otomatis. Tingkatkan fokus kerja dan belajar Anda.', 'produktivitas', 'Timer', '/tools/pomodoro-timer', 'Timer Pomodoro Online Gratis — Fokus 25 Menit', 'Timer pomodoro online dengan siklus fokus 25 menit dan istirahat 5 menit yang dapat diatur. Gratis, tanpa instalasi, dengan notifikasi suara.'),
  ('Checklist Harian', 'checklist', 'Buat daftar tugas harian yang tersimpan otomatis di browser Anda. Sederhana dan cepat.', 'produktivitas', 'ListChecks', '/tools/checklist', 'Checklist Online — Daftar Tugas Harian Sederhana', 'Buat dan kelola checklist tugas harian langsung di browser. Tersimpan otomatis, tanpa login, tanpa iklan.'),
  ('Color Picker', 'color-picker', 'Pilih warna dan dapatkan kode HEX, RGB, dan HSL sekaligus. Simpan palet warna favorit.', 'desain', 'Palette', '/tools/color-picker', 'Color Picker Online — Kode HEX, RGB, HSL', 'Pilih warna dan konversi ke kode HEX, RGB, dan HSL sekaligus. Lihat preview langsung dan salin kode dengan satu klik.'),
  ('Generator Gradient', 'gradient-generator', 'Buat gradient CSS linear dan radial yang indah. Salin kode CSS siap pakai.', 'desain', 'Blend', '/tools/gradient-generator', 'CSS Gradient Generator Online — Kode Gradient Siap Pakai', 'Buat gradient CSS linear dan radial dengan preview real-time. Salin kode CSS langsung untuk website Anda. Gratis.'),
  ('Kompres Gambar', 'image-compressor', 'Kompres JPG dan PNG langsung di browser tanpa upload. Atur kualitas, lihat perbandingan ukuran.', 'file', 'ImageDown', '/tools/image-compressor', 'Kompres Gambar Online — JPG & PNG Tanpa Upload', 'Kompres gambar JPG dan PNG langsung di browser tanpa diunggah ke server. Atur kualitas, hemat hingga 90% ukuran file. Gratis dan privat.'),
  ('Gabung PDF', 'pdf-merge', 'Gabungkan beberapa file PDF menjadi satu dokumen, langsung di browser tanpa upload.', 'file', 'Files', '/tools/pdf-merge', 'Gabung PDF Online Gratis — Merge PDF Tanpa Upload', 'Gabungkan file PDF menjadi satu dokumen langsung di browser. File tidak diunggah ke server — 100% privat. Atur urutan halaman dengan mudah.'),
  ('Pisah PDF', 'pdf-split', 'Ekstrak halaman tertentu dari PDF atau pisahkan menjadi beberapa file, langsung di browser.', 'file', 'Scissors', '/tools/pdf-split', 'Pisah PDF Online — Ekstrak Halaman PDF Tanpa Upload', 'Pisahkan dan ekstrak halaman dari file PDF langsung di browser. Pilih rentang halaman, unduh hasilnya. 100% privat, gratis.')
) as v(name, slug, description, cat_slug, icon, route, seo_title, seo_description)
left join public.tool_categories c on c.slug = v.cat_slug
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  icon = excluded.icon,
  route = excluded.route,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;
