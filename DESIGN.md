# DESIGN.md — Arah Desain RuangKumpul

Sumber arah visual untuk semua halaman (wajib dibaca sebelum mengubah UI, R-37 antislop).
Setiap keputusan besar punya alasan satu baris (R-31). Rujukan: Hallmark (material + gates),
Impeccable (mode per permukaan), Antislop (filter 40 rule), plus polish ala ui-polish-id.

## Design Read

Super app komunitas Indonesia (tools + pengetahuan + komunitas + peluang) untuk pengguna umum
Indonesia. Bahasa visual: **indigo tegas yang tenang, komposisi jujur, sentuhan lokal**.
Tampilan premium dicapai lewat tipografi, ritme, dan satu motif identitas, bukan gradien/orb generik.

## Mode per permukaan (Impeccable)

| Mode | Permukaan | Artinya |
| --- | --- | --- |
| Persuade | `/`, `/login`, `/register`, `/tentang` | Desain menjual tindakan pertama; boleh berani |
| Operate | `/tools/*`, `/dashboard/*`, `/admin/*` | Scanability dan konsistensi > ekspresi |
| Read | `/artikel/*`, `/komunitas/*`, `/event/*`, `/karier/*`, statik | Pemahaman dulu, pengalaman baca nyaman |

## Dial

| Mode | VARIANCE | MOTION | DENSITY |
| --- | --- | --- | --- |
| Persuade | 7 | 5 | 4 |
| Operate | 3 | 2 | 5 |
| Read | 5 | 3 | 3 |

## Warna (alasan tertulis)

- **Indigo `#3730A3` (brand-800)** = warna utama. Alasan: identitas brand sejak v1, logo dan
  brand recall sudah indigo; dikunci, tidak dievolusi.
- **Violet (accent)** = aksen ber-dosis, maksimal 1–2 titik fokus per layar. Alasan: butuh satu
  warna sekunder untuk hierarki, tetapi dilarang jadi gradien biru-ungu generik.
- Netral slate; emerald/amber/red hanya untuk status fungsional.
- **Larangan**: gradien `brand→accent` sebagai latar section, orb blur dekoratif, glow massal,
  glassmorphism berlebihan.
- Hero/panel gelap memakai **brand-950/brand-800 solid** + motif. Alasan: solid lebih tenang dan
  tidak masuk pola "AI gradient hero" yang paling sering di-flag.

## Motif identitas — "Kumpul"

Lingkaran konsentris dengan titik "anggota" berkumpul mengelilingi pusat (SVG stroke,
`currentColor`). Alasan: nama produk "RuangKumpul" = ruang berkumpul; motif = lingkaran pertemuan.
Dosis: **maksimal 2 penampakan dekoratif per layar**. Komponen:
`src/components/shared/kumpul-motif.tsx`.

## Tipografi

- **Plus Jakarta Sans**. Alasan: huruf karya foundry Indonesia (Tokotype), selaras identitas
  lokal; bukan roster default AI (Inter/Geist/Space Grotesk).
- H1 hero: `text-4xl/5xl font-extrabold tracking-tight`; section: `text-2xl font-extrabold`.
- Label kecil: **sentence case, semibold, tanpa `uppercase tracking-wide`** (pola AI generik).
- Prosa: `text-base leading-relaxed`, lebar baca `max-w-prose`.

## Radius (set kecil, R-11)

| Token | Nilai | Untuk |
| --- | --- | --- |
| `rounded-control` | 0.75rem | tombol, input, tile ikon |
| `rounded-card` | 1rem | kartu, panel |
| `rounded-full` | pill | badge status dan avatar saja |

Alasan: tiga nilai dengan makna jelas; tidak semua elemen pill.

## Elevasi & dosis

- `shadow-card` untuk kartu statis; `shadow-card-hover` hanya saat hover kartu interaktif.
  Alasan: elevasi menandai interaksi, bukan dekorasi.
- Glass (`backdrop-blur`): maksimal 1 elemen per layar; **navbar dan mobile nav pakai solid**.
- Glow: bukan dekorasi default; jika ada, hanya 1 titik fokus.

## Motion

- Kosakata: `animate-slide-up-far` (entrance konten, stagger 60–90ms), `ease-out-expo`
  (transisi hover), `Reveal` (scroll-reveal), `animate-pop-in` (elemen kecil bermakna).
- **Tanpa loop tak berujung tanpa tujuan**: `animate-float` dihapus dari hero/section.
  `shimmer` tetap (umpan loading nyata), `pulse-soft` hanya untuk indikator live nyata.
- Chrome (header, sidebar) **tidak dianimasikan ulang tiap navigasi**. Alasan: re-play tiap
  pindah halaman terasa janky.
- `prefers-reduced-motion` menciutkan semua motion ke instant (sudah ada di globals.css).

## Copy (antislop-copywriting)

- Bahasa Indonesia santai-profesional ("kamu"). **Tanpa buzzword Inggris** di label UI
  ("All-in-One Platform", "One Platform. Endless Possibilities." ✗).
- **Tanpa em dash**; pakai koma, titik, titik dua, atau kurung. Metadata title pakai pemisah "·".
- CTA spesifik produk ("Lihat semua tools", "Daftar gratis"), bukan "Get Started".
- Empty state menyebut **sebab + aksi lanjut**, bukan kalimat kosong generik.

## Hard Gate (tidak bisa ditawar, Hallmark Floor + Antislop)

Kontras WCAG AA · tap target ≥ 44px di mobile · fokus keyboard terlihat · light & dark berfungsi
penuh · mobile tanpa overflow horizontal · media punya dimensi/aspect-ratio · tanpa angka,
testimoni, atau klaim palsu · setiap kontrol berfungsi · setiap link menunjuk halaman nyata.
