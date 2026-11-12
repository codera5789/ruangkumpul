# Panduan Kontribusi RuangKumpul

Terima kasih atas ketertarikanmu untuk berkontribusi di **RuangKumpul**! RuangKumpul adalah proyek sumber terbuka (*open-source*) yang dirancang sebagai *All-in-One Digital Super App* untuk masyarakat Indonesia.

Dokumen ini disusun untuk membantu pengembang dan kontributor bekerja sama dengan standar rekayasa perangkat lunak profesional.

---

## 1. Kode Etik & Nilai Komunitas

- **Inklusif & Saling Menghargai:** Hargai setiap pertanyaan, diskusi, dan kontribusi tanpa memandang tingkat pengalaman teknis.
- **Komunikasi Berbahasa Indonesia:** Diskusi isu, deskripsi PR, dan penulisan copy UI diutamakan menggunakan Bahasa Indonesia yang santai, jelas, dan profesional ("kamu").
- **Kualitas di Atas Kuantitas:** Utamakan kode yang bersih, terdokumentasi, aman (RLS teruji), dan ramah aksesibilitas.

---

## 2. Memulai (Setup Lingkungan Lokal)

### Prasyarat
- **Node.js** v20 atau lebih baru (v20.x / v22.x LTS disarankan).
- **npm** v10+ (atau pnpm / bun).
- Akun [Supabase](https://supabase.com) (gratis) untuk pengujian backend/auth penuh.

### Langkah Instalasi

1. **Fork & Clone Repositori**
   ```bash
   git clone git@github.com:<username-kamu>/ruangkumpul.git
   cd ruangkumpul
   ```

2. **Tambahkan Remote Upstream**
   ```bash
   git remote add upstream git@github.com:codera5789/ruangkumpul.git
   ```

3. **Install Dependensi**
   ```bash
   npm install
   ```

4. **Siapkan Konfigurasi Lingkungan (`.env.local`)**
   Salin berkas `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari dashboard proyek Supabase-mu.

5. **Jalankan Server Development**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di peramban.

---

## 3. Alur Kerja Git & Percabangan (*Branching Strategy*)

Kami menerapkan strategi **Feature Branch Workflow**:

1. **Selalu mulai dari branch `main` terbaru:**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Buat branch baru untuk setiap pekerjaan:**
   Gunakan prefiks konvensional sesuai jenis perubahan:
   - `feat/` — Fitur baru atau penambahan tool (mis. `feat/markdown-converter-tool`)
   - `fix/` — Perbaikan bug (mis. `fix/community-private-access`)
   - `docs/` — Dokumentasi atau panduan (mis. `docs/setup-guide`)
   - `style/` — Penyesuaian antarmuka/desain (mis. `style/card-hover-states`)
   - `test/` — Penambahan atau perbaikan uji otomatis (mis. `test/job-listing-service`)
   - `chore/` — Pemeliharaan CI, skrip, atau dependensi (mis. `chore/upgrade-next`)

   ```bash
   git checkout -b feat/nama-perubahan-kamu
   ```

3. **Jangan pernah melakukan commit langsung ke branch `main`.**

---

## 4. Standar Pesan Commit (*Conventional Commits*)

Format pesan commit mengikuti standar [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipe>(<lingkup-opsional>): <deskripsi singkat imperatif>
```

### Contoh:
- `feat(tools): tambah tool generator favicon client-side`
- `fix(community): perbaiki permission posting pada komunitas privat`
- `docs(readme): lengkapi panduan integrasi OAuth lokal`
- `test(sql): tambah skenario RLS untuk kuota event`
- `style(navbar): perbaiki kontras badge pada dark mode`

---

## 5. Resep Praktis: Menambahkan Tool Baru ke Ruang Tools

Menambahkan tool gratis baru adalah tugas **Good First Issue** terbaik untuk kontributor baru. Ikuti 4 langkah ini:

### Langkah 1: Buat Komponen Tool
Buat berkas komponen di `src/modules/tools/components/tools/<slug-tool>.tsx`.  
*Aturan penting: Semua tool wajib berjalan 100% pada sisi klien (client-side) tanpa mengunggah data pengguna ke server.*

```tsx
"use client";

import { useState } from "react";
import { ToolPanel, ToolLabel } from "@/modules/tools/components/tool-shell";
import { Button } from "@/components/ui/button";

export default function MyNewTool() {
  const [value, setValue] = useState("");

  return (
    <ToolPanel>
      <div className="space-y-4">
        <ToolLabel>Input Teks</ToolLabel>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-hidden"
        />
        <Button onClick={() => alert("Berhasil!")}>Proses</Button>
      </div>
    </ToolPanel>
  );
}
```

### Langkah 2: Daftarkan di Registri Tools
Buka `src/modules/tools/tools-registry/registry.ts`, lalu tambahkan definisi tool baru ke dalam larik `TOOLS`:
- Tentukan `slug`, `name`, `description`, `category`, `icon`, `route: "/tools/<slug>"`.
- Lengkapi `seoTitle`, `seoDescription`, `howTo` (panduan langkah), dan `faqs` (tanya jawab).

### Langkah 3: Daftarkan Dynamic Import
Buka `src/modules/tools/components/tool-renderer.tsx` dan tambahkan pemetaan slug ke komponen menggunakan `dynamic()` agar di-code-split secara efisien:

```tsx
"<slug-tool>": dynamic(() => import("@/modules/tools/components/tools/<slug-tool>"), {
  loading: ToolLoading,
}),
```

### Langkah 4: Jalankan Uji Registri
Jalankan pengujian otomatis untuk memastikan metadata dan route valid:
```bash
npm test
```
*Test suite di `tests/unit/tools-registry.test.ts` akan otomatis memverifikasi keunikan slug, route, kategori, dan kelengkapan SEO.*

---

## 6. Pedoman Desain & Antarmuka (UI Guidelines)

Sebelum memodifikasi atau membuat antarmuka baru, wajib membaca [DESIGN.md](DESIGN.md). Poin utama:
- **Warna Utama:** Indigo `#3730A3` (`brand-800`), aksen Violet (`accent`), netral Slate.
- **Larangan Desain ("Anti-Slop"):** Dilarang menggunakan gradien ungu-biru generik AI, dilarang efek orb blur dekoratif tanpa fungsi, dan dilarang animasi floating loop tanpa tujuan.
- **Aksesibilitas:** Kontras teks wajib memenuhi standar WCAG AA, target ketuk (*tap target*) minimal 44px di perangkat bergerak.
- **Dark Mode:** Selalu gunakan token semantik (`bg-surface`, `text-ink`, `border-slate-200`), jangan hardcode warna terang/gelap secara statis.

---

## 7. Verifikasi Kualitas Sebelum Mengajukan PR

Pastikan seluruh perintah berikut berjalan sukses tanpa peringatan atau error di lingkungan lokalmu:

```bash
# 1. Cek tipe TypeScript secara ketat
npx tsc --noEmit

# 2. Cek linter ESLint
npm run lint

# 3. Jalankan seluruh pengujian unit & smoke test RLS PostgreSQL
npm test
```

---

## 8. Mengajukan Pull Request (PR)

1. Dorong (*push*) branch kamu ke repositori fork:
   ```bash
   git push -u origin feat/nama-perubahan-kamu
   ```
2. Buka GitHub repositori utama [codera5789/ruangkumpul](https://github.com/codera5789/ruangkumpul).
3. Klik tombol **Compare & pull request**.
4. Isi template PR yang disediakan dengan jelas: jelaskan perubahan yang dibuat, kaitkan dengan Issue jika ada, dan centang daftar periksa (*checklist*).
5. Tunggu hasil otomatis dari **GitHub Actions CI**. Jika ada pemeriksaan yang gagal, periksa log kesalahan dan dorong commit perbaikan ke branch yang sama.

Selamat berkontribusi di RuangKumpul.
