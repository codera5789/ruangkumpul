# Milestone Proyek RuangKumpul

Dokumen ini mencatat target pencapaian utama (*milestone*) pengembangan platform **RuangKumpul** berdasarkan cetak biru ekosistem.

## M1 — Fondasi Core & 6 Modul MVP (Selesai)
- [x] Autentikasi, profil pengguna, dan otorisasi peran (Supabase Auth + RLS).
- [x] Ruang Tools (utilitas 100% client-side + SEO + JSON-LD).
- [x] Ruang Ilmu (artikel, kategori, komentar, bookmark).
- [x] Ruang Komunitas (komunitas publik/privat, posting, diskusi, accepted answer).
- [x] Ruang Event (katalog event, kuota pendaftaran RPC).
- [x] Ruang Karier (daftar lowongan kerja/freelance).
- [x] Ruang Produktivitas (catatan dan daftar tugas).
- [x] Pengujian unit Vitest dan Postgres WASM security smoke test (migrasi 0001-0008).

## M2 — Pilar 4: Ruang Marketplace (Selesai)
- [x] Desain skema database, trigger sinkronisasi inquiry, dan kebijakan RLS (`0009_marketplace.sql`).
- [x] Pembaruan tipe TypeScript database (`src/types/database.ts`) dan pengujian RLS di `tests/sql-security-smoke.mjs`.
- [x] Modul aplikasi `src/modules/marketplace/` (konstanta, skema Zod, layanan kueri, Server Actions) + unit test.
- [x] Antarmuka pengguna publik (`/marketplace`, `/marketplace/[slug]`, `/marketplace/buat`), dashboard (`/dashboard/marketplace`, `/dashboard/marketplace/[id]/edit`), dan integrasi navigasi/sitemap/`/jelajahi`/`/search`.
- [x] Verifikasi kualitas penuh (`typecheck`, `lint`, `vitest`, `sql-security-smoke`, `next build`).

## M3 — Penyempurnaan UX & Kepatuhan Platform (Direncanakan)
- [ ] Pencarian universal / Command Palette (`Ctrl+K` / `Cmd+K`).
- [ ] Ekspor data pribadi pengguna (kepatuhan UU PDP Pasal 21).
- [ ] Kompresi avatar di sisi klien sebelum unggah ke Storage.
- [ ] Otomasi pengujian End-to-End (Playwright).

## M4 — Pilar Ekosistem Lanjutan (Direncanakan)
- [ ] Pilar 7: Ruang AI (asisten penulisan, ringkasan dokumen, penerjemah, generator ide).
- [ ] Pilar 9: Ruang Lokal / Direktori UMKM regional Indonesia.
- [ ] Pilar 10: Ruang Promo / Deals (agregator perkakas, beasiswa, kupon).
