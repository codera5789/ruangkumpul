# Progress Pengembangan

Branch aktif: `fix/post-merge-cleanup` (dari `main` `b91e7c3`)
Fokus saat ini: **Perbaikan pasca-merge PR #8 & PR #9, sinkronisasi dokumen, dan persiapan M3**

## Status Pekerjaan Saat Ini

| Tahap | Deskripsi | Status |
| --- | --- | --- |
| M1 | Fondasi Core & 6 Modul MVP + 24 Web Tools offline-ready | Selesai |
| M2 | Pilar 4: Ruang Marketplace inti, edit produk, & integrasi pencarian (PR #7, #8) | Selesai |
| M2x | Audit keamanan RLS `0010`, sentralisasi helper DRY, perbaikan UI/PWA/seeder (PR #9) | Selesai |
| M2y | Perbaikan bug `.ilike()` di `/api/search/suggest`, `isUuid()` edit marketplace, & bersih-bersih scaffold | Dalam proses |
| M3 | Command Palette (`Ctrl+K`), Ekspor data UU PDP, `/admin/audit`, & Playwright E2E | Direncanakan |

## Catatan Teknis
- Setiap perubahan fitur/perbaikan dikembangkan di branch terpisah dari `main` (`Feature Branch Workflow`).
- Semua pengujian RLS, trigger, dan RPC dijalankan terhadap Postgres asli melalui PGlite/WASM (`npm run test:sql`).
- Jalankan `supabase/migrations/0010_security_and_tools_sync.sql` pada database target setelah merge PR #9.
