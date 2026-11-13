# Changelog

Semua perubahan penting pada proyek **RuangKumpul** dicatat pada berkas ini.
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- Perbaikan pola filter `/api/search/suggest` memakai `ilikePattern()` tanpa pembungkus tanda kutip ganda (yang hanya valid untuk `.or(...)`).
- Penyeragaman validasi parameter ID di `/dashboard/marketplace/[id]/edit` memakai `isUuid()` dan tautan repositori pada `siteConfig`.
- Pembersihan 5 aset SVG bawaan scaffold `create-next-app` di `public/`.

### Security & Refactor
- **Hardening RLS & DRY (`0010_security_and_tools_sync.sql`, PR #9):**
  - Perbaikan policy `product_inquiries_insert` (self-shadowing `seller_id`), kunci kolom turunan & imutabel via `guard_derived_fields_update()` (`SECURITY INVOKER`), larangan self-delete/reset anggota `banned`, syarat status komunitas `active` dan post `published`, perbaikan `check_rate_limit` untuk UUID di posisi tengah, dan sinkronisasi `24` tool + pesan sambutan `handle_new_user()`.
  - Sentralisasi helper DRY (`withFailSoft`, `handleViewCountRequest`, `ActionState`, `isUuid`, `uniqueSlug`, `Select`), parser Markdown XSS-safe (`parseMarkdownToHtml`), serta perluasan unit test actions, helper, XSS, dan SQL smoke `0001–0010`.

## [0.2.1] - 2026-11-13

### Added
- **Pilar 4 (Ruang Marketplace — Polish & Integrasi, PR #8):**
  - Halaman sunting produk `/dashboard/marketplace/[id]/edit` dengan memakai ulang komponen `ProductForm` serta helper `getProductById` (`src/modules/marketplace/services.ts`).
  - Tautan **Sunting** produk di `/dashboard/marketplace` dan `/marketplace/[slug]`.
  - Integrasi produk marketplace pada etalase `/jelajahi` dan pencarian global (`/search`, `/api/search/suggest`, dan `search-input.tsx`).
  - Penambahan unit test `getProductById` pada `tests/unit/marketplace-services.test.ts`.

## [0.2.0] - 2026-11-13

### Added
- **Pilar 4 (Ruang Marketplace):**
  - Migrasi `supabase/migrations/0009_marketplace.sql` mencakup tabel `marketplace_categories`, `marketplace_products`, dan `product_inquiries`, trigger `sync_marketplace_inquiry_count`, serta kebijakan RLS ketat.
  - Definisi tipe TypeScript database di `src/types/database.ts`.
  - Modul `src/modules/marketplace/` (`constants.ts`, `schemas.ts`, `services.ts`, `actions.ts`) beserta komponen UI (`product-card.tsx`, `product-form.tsx`, `inquiry-form.tsx`).
  - Rute halaman `/marketplace`, `/marketplace/[slug]` (termasuk metadata SEO & JSON-LD `Product`), `/marketplace/buat`, dan `/dashboard/marketplace` dengan boundary `<Suspense>` untuk kompatibilitas Cache Components Next.js 16.
  - Integrasi navigasi di `header.tsx`, `footer.tsx`, `dashboard-sidebar.tsx`, serta rute statis dan dinamis di `sitemap.ts`.
  - Pengujian unit Vitest (`tests/unit/marketplace-schemas.test.ts`, `tests/unit/marketplace-services.test.ts`) dan skenario RLS/trigger di `tests/sql-security-smoke.mjs` (TEST18a-TEST18g).
- Dokumentasi pelacakan proyek: `MILESTONE.md`, `PROGRESS.md`, dan `CHANGELOG.md`.

## [0.1.0] - 2026-11-13

### Added
- Fondasi platform RuangKumpul (Next.js 16, Supabase SSR, Tailwind CSS v4).
- Enam modul utama MVP: Ruang Tools, Ruang Ilmu, Ruang Komunitas (termasuk fitur Accepted Answer pada migrasi `0008`), Ruang Event, Ruang Karier, dan Ruang Produktivitas.
- Pengujian unit Vitest dan Postgres WASM security smoke test untuk migrasi `0001` hingga `0008`.
