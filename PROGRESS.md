# Progress Pengembangan

Branch aktif: `feat/ruang-marketplace`
Fokus saat ini: **Pilar 4 — Ruang Marketplace** (Tahap implementasi selesai, siap review & PR)

## Status Pekerjaan Saat Ini

| Tahap | Deskripsi | Status |
| --- | --- | --- |
| 1 | Migrasi database `0009_marketplace.sql` (tabel, enum, trigger, RLS) | Selesai |
| 1b | Pembaruan `src/types/database.ts` dan smoke test RLS `0009` | Selesai |
| 2 | Modul `src/modules/marketplace/` (constants, schemas, services, actions) | Selesai |
| 2b | Unit test Vitest untuk skema & layanan marketplace (14 test baru) | Selesai |
| 3 | Halaman UI `/marketplace`, `/marketplace/[slug]`, `/marketplace/buat`, `/dashboard/marketplace` | Selesai |
| 3b | Integrasi navigasi (`header`, `footer`, `dashboard-sidebar`) & `sitemap.ts` | Selesai |
| 4 | Verifikasi akhir (`typecheck`, `lint`, `test` 115 unit + SQL smoke 0001-0009) | Lulus |

## Catatan Teknis
- Setiap perubahan fitur dikembangkan di branch terpisah dari `main` (`Feature Branch Workflow`).
- Semua pengujian RLS dijalankan terhadap Postgres asli melalui PGlite/WASM (`npm run test:sql`).
- Berkas `summary.md` diabaikan secara lokal melalui `.git/info/exclude`.
