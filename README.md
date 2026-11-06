# RuangKumpul

**One Platform. Endless Possibilities.** — All-in-One Digital Super App untuk Indonesia: tools gratis, ruang pengetahuan, dan komunitas dalam satu akun.

🌐 Domain produksi: [ruangkumpul.my.id](https://ruangkumpul.my.id)

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS v4, TypeScript |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Icons & util | lucide-react, zod, @supabase/ssr |
| Tools browser | qrcode, pdf-lib (100% client-side) |
| Hosting | Vercel |

## Fitur MVP

- **Ruang Tools** — 21 tool gratis tanpa login (word counter, JSON formatter, QR code, kompres gambar, PDF merge/split, dll.), lengkap dengan landing page SEO + JSON-LD per tool.
- **Ruang Pengetahuan** — artikel dengan kategori, tag, komentar, view counter, dan SEO metadata.
- **Ruang Komunitas** — buat/gabung komunitas, diskusi, komentar, suka, laporan moderasi.
- **Akun** — email/password + Google OAuth, profil publik, bookmark, notifikasi otomatis.
- **Admin** — statistik platform, kelola role pengguna, status tools & artikel, antrean moderasi, audit log.

## Mulai Cepat (Lokal)

1. **Install dependensi**

   ```bash
   npm install
   ```

2. **Siapkan environment** — salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` dari Supabase Dashboard → Project Settings → API.

3. **Jalankan migrasi database** — buka Supabase Dashboard → SQL Editor, jalankan isi file secara berurutan:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_article_comments.sql`

4. **Aktifkan Google OAuth** (opsional) — Supabase Dashboard → Authentication → Providers → Google, isi Client ID/Secret dari Google Cloud Console. Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.

5. **Jalankan**

   ```bash
   npm run dev
   ```

## Perintah Penting

```bash
npm run dev      # server development (Turbopack)
npm run build    # build produksi
npm run start    # jalankan hasil build
npm run lint     # eslint
npx tsc --noEmit # cek tipe TypeScript
```

## Struktur Proyek

```
src/
├── app/                  # Route groups: (public), (auth), (dashboard), admin, api
├── components/           # ui/ (primitives) + layout/
├── modules/              # Feature-based: tools, knowledge, community, users, admin...
│   └── tools/
│       ├── tools-registry/   # Sumber kebenaran data 21 tools
│       └── components/tools/ # 21 komponen tool (client, code-split)
├── lib/supabase/         # client, server, admin (service role), proxy
├── types/                # Tipe Database Supabase
└── config/               # Konfigurasi situs
supabase/migrations/      # SQL migration (schema + RLS + trigger + seed)
```

## Keamanan

- **RLS aktif di semua tabel** — kebijakan per tabel sesuai blueprint (lihat `docs/blueprint-ruangkumpul.md` §6.4).
- **Service role key** hanya dipakai di server (`server-only`) untuk operasi admin dan audit log.
- Role pengguna dikelola via tabel `user_roles` dengan helper `is_admin()`/`is_moderator()` (SECURITY DEFINER, bebas recursive RLS).
- Tidak ada IP mentah yang disimpan; tool usage log bersifat anonim.

## Deploy ke Vercel

1. Push repositori ini ke GitHub.
2. Import di Vercel → set Environment Variables (sama seperti `.env.local`, plus `NEXT_PUBLIC_SITE_URL=https://ruangkumpul.my.id`).
3. Tambahkan domain `ruangkumpul.my.id` (dan `www`) di Vercel → Settings → Domains.
4. Arahkan DNS di registrar: `A 76.76.21.21` atau `CNAME cname.vercel-dns.com` sesuai instruksi Vercel.

Panduan lengkap: `docs/deployment.md`.
