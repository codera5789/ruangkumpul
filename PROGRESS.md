# Progress Pengembangan

Branch aktif: `feat/polish-ruang-marketplace`
Fokus saat ini: **Polish & Integrasi Pilar 4 — Ruang Marketplace** (Lulus verifikasi, siap commit & PR)

## Status Pekerjaan Saat Ini

| Tahap | Deskripsi | Status |
| --- | --- | --- |
| M2 | Pilar 4: Ruang Marketplace inti (PR #7 ter-merge ke `main`) | Selesai |
| M2b | Halaman sunting `/dashboard/marketplace/[id]/edit` dan tautan Sunting | Selesai |
| M2c | Integrasi Ruang Marketplace ke `/jelajahi`, `/search`, `/api/search/suggest` | Selesai |
| M2d | Verifikasi penuh (`lint`, `typecheck`, 116 unit test, SQL smoke 0001-0009, build 85/85 rute) | Lulus |

## Catatan Teknis
- Setiap perubahan fitur dikembangkan di branch terpisah dari `main` (`Feature Branch Workflow`).
- Semua pengujian RLS dijalankan terhadap Postgres asli melalui PGlite/WASM (`npm run test:sql`).
- Berkas `summary.md` diabaikan secara lokal melalui `.git/info/exclude`.
