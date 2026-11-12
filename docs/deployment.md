# Panduan Deployment — RuangKumpul ke Vercel + ruangkumpul.my.id

Dokumen ini adalah langkah lengkap membawa RuangKumpul dari kode lokal ke
produksi di `ruangkumpul.my.id`.

## Prasyarat

- [ ] Akun [Supabase](https://supabase.com) (gratis)
- [ ] Akun [Vercel](https://vercel.com) (gratis, login via GitHub)
- [ ] Akun [GitHub](https://github.com)
- [ ] Akses DNS domain `ruangkumpul.my.id` di registrar

## 1. Buat Proyek Supabase

1. Supabase Dashboard → **New project** → pilih region terdekat (Singapore).
2. Simpan password database dengan aman.
3. Tunggu provisioning selesai (±2 menit).

## 2. Jalankan Migrasi Database

Supabase Dashboard → **SQL Editor** → jalankan berurutan:

1. Isi `supabase/migrations/0001_initial_schema.sql` → **Run**
2. Isi `supabase/migrations/0002_article_comments.sql` → **Run**
3. Isi `supabase/migrations/0003_platform_features.sql` → **Run**
4. Isi `supabase/migrations/0004_new_modules.sql` → **Run**
5. Isi `supabase/migrations/0005_seed_tools.sql` → **Run**
6. Isi `supabase/migrations/0006_fix_private_community_and_event_quota.sql` → **Run**
7. Isi `supabase/migrations/0007_audit_fixes.sql` → **Run**
8. Isi `supabase/migrations/0008_accepted_answer.sql` → **Run**

Verifikasi: Database → Tables — harus muncul 29 tabel + enum + seed kategori/tools.

Verifikasi cepat security 0006+0007 di **SQL Editor** — semua query ini harus
mengembalikan baris/nilai sesuai ekspektasi:

```sql
-- RPC & helper utama harus ada (0006 + 0007)
select proname from pg_proc join pg_namespace n on n.oid = pronamespace
where n.nspname = 'public'
  and proname in ('register_event','can_join_community','can_read_post',
                  'is_community_member','can_register_event');
-- RLS aktif di tabel sensitif (semua harus t)
select relname, relrowsecurity from pg_class
where relname in ('posts','comments','communities','community_members','event_registrations');
-- Helper publik lain tidak bisa dipanggil anon: should_return_false
select public.is_community_member('00000000-0000-0000-0000-000000000000', array['approved']);
```

## 3. Ambil Kredensial API

Supabase Dashboard → **Project Settings → API**:

| Variabel | Sumber |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (RAHASIA — hanya server) |

## 4. Aktifkan Autentikasi

**Email/password**: Authentication → Providers → Email → aktif.
Nonaktifkan "Confirm email" dulu jika ingin onboarding tanpa email
(bisa diaktifkan lagi kapan saja).

**Google OAuth** (opsional tapi disarankan):

1. [Google Cloud Console](https://console.cloud.google.com) → buat OAuth Client ID (Web application).
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → isi Client ID + Secret.
4. Authentication → URL Configuration → Site URL: `https://ruangkumpul.my.id`,
   Redirect URLs: `https://ruangkumpul.my.id/auth/callback`,
   `http://localhost:3000/auth/callback`.

## 5. Push ke GitHub

```bash
git remote add origin git@github.com:USERNAME/ruangkumpul.git
git push -u origin main
```

## 6. Deploy di Vercel

1. Vercel Dashboard → **Add New → Project** → import repo `ruangkumpul`.
2. Framework: Next.js (terdeteksi otomatis). Build command default.
3. **Environment Variables** (Production + Preview):

   ```
   NEXT_PUBLIC_SITE_URL=https://ruangkumpul.my.id
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

4. **Deploy** — tunggu build selesai (±2 menit).

## 7. Hubungkan Domain ruangkumpul.my.id

1. Vercel → Project → **Settings → Domains** → `ruangkumpul.my.id`.
2. Juga tambahkan `www.ruangkumpul.my.id` (redirect ke apex).
3. Vercel menampilkan instruksi DNS. Di registrar domain:

   **Opsi A (apex, paling umum):**
   ```
   Type: A      Name: @    Value: 76.76.21.21
   Type: CNAME  Name: www  Value: cname.vercel-dns.com
   ```

   **Opsi B (nameserver sepenuhnya):** arahkan nameserver domain ke
   `ns1.vercel-dns.com` / `ns2.vercel-dns.com`.

4. Tunggu propagasi DNS (5 menit – 48 jam, biasanya cepat).
5. Vercel otomatis menerbitkan SSL (Let's Encrypt).

## 8. Konfigurasi Supabase Pasca-Deploy

- Authentication → URL Configuration → **Site URL** ganti ke
  `https://ruangkumpul.my.id` (bukan lagi localhost).
- Pastikan Redirect URLs memuat domain produksi.

## 9. Verifikasi Produksi

- [ ] `https://ruangkumpul.my.id` memuat homepage
- [ ] `/tools` + salah satu tool berfungsi (mis. `/tools/word-counter`)
- [ ] Daftar akun baru → masuk → dashboard tampil
- [ ] `/sitemap.xml` & `/robots.txt` terisi domain produksi
- [ ] Buat komunitas + posting + komentar + notifikasi masuk
- [ ] Google Search Console: submit `https://ruangkumpul.my.id/sitemap.xml`

## Rollback

Vercel → Deployments → pilih deployment sebelumnya → **Promote to Production**.

## Biaya Bulanan (MVP)

| Layanan | Paket | Biaya |
|---|---|---|
| Vercel | Hobby | Rp0 |
| Supabase | Free (500MB DB, 50k MAU) | Rp0 |
| Domain | tahunan | sesuai registrar |

Naikkan paket hanya saat metrik mendekati batas.
