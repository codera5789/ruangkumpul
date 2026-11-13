/**
 * RuangKumpul — Content Seeder
 * Mengisi database dengan konten realistis berbahasa Indonesia agar situs
 * terlihat hidup sejak hari pertama: persona penulis, kategori, komunitas,
 * artikel, diskusi, komentar, likes, event, dan lowongan kerja.
 *
 * Idempoten — aman dijalankan berulang (objek yang sudah ada dilewati).
 *
 * Jalankan: npm run seed
 * (butuh NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY di .env.local)
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { markdownToBlocks } from "../src/modules/knowledge/markdown.ts";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset (.env.local)");
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const slugify = (t) =>
  t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

const daysAgo = (d, h = 9, m = 0) => {
  const t = new Date(Date.now() - d * 86400000);
  t.setHours(h, m, 0, 0);
  return t.toISOString();
};
const daysAhead = (d, h = 19) => {
  const t = new Date(Date.now() + d * 86400000);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

// ---------------------------------------------------------------------------
// 1. Persona penulis (akun contributor; email seed di domain sendiri)
// ---------------------------------------------------------------------------
const PERSONAS = [
  { email: "budi@ruangkumpul.my.id", username: "budi-santoso", full_name: "Budi Santoso",
    bio: "Frontend developer yang suka berbagi tutorial praktis. 5 tahun ngoding, masih semangat belajar." },
  { email: "sari@ruangkumpul.my.id", username: "sari-wijaya", full_name: "Sari Wijaya",
    bio: "Content writer & penulis freelance. Menyukai produktivitas, menulis, dan kopi manual brew." },
  { email: "andi@ruangkumpul.my.id", username: "andi-pratama", full_name: "Andi Pratama",
    bio: "Pemilik usaha catering rumahan yang belajar digital marketing dari nol. Berbagi pengalaman UMKM." },
  { email: "dewi@ruangkumpul.my.id", username: "dewi-lestari", full_name: "Dewi Lestari",
    bio: "UI/UX designer. Menulis soal desain, karier kreatif, dan portofolio yang bikin recruiter berhenti scroll." },
  { email: "rizky@ruangkumpul.my.id", username: "rizky-hidayat", full_name: "Rizky Hidayat",
    bio: "Mahasiswa tingkat akhir yang selamat dari skripsi. Suka merapikan metode penelitian dan tools gratis." },
  { email: "maya@ruangkumpul.my.id", username: "maya-putri", full_name: "Maya Putri",
    bio: "Remote worker sejak 2023. Menulis tentang kerja jarak jauh, freelancing, dan work-life balance." },
];

// ---------------------------------------------------------------------------
// 2. Kategori artikel
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { name: "Teknologi", slug: "teknologi", description: "Tutorial, tips, dan perkembangan teknologi untuk pengguna sehari-hari." },
  { name: "Produktivitas", slug: "produktivitas", description: "Cara kerja lebih pintar: tools, metode, dan kebiasaan yang terbukti." },
  { name: "Karier", slug: "karier", description: "Melamar kerja, portofolio, wawancara, dan berkembang di dunia profesional." },
  { name: "Bisnis Digital", slug: "bisnis-digital", description: "UMKM, freelancing, dan membangun usaha di era internet." },
  { name: "Komunitas", slug: "komunitas", description: "Cara membangun dan merawat komunitas online yang sehat." },
];

// ---------------------------------------------------------------------------
// 3. Komunitas
// ---------------------------------------------------------------------------
const COMMUNITIES = [
  { slug: "frontend-indonesia", name: "Frontend Indonesia", ownerIdx: 0, visibility: "public",
    description: "Tempat developer frontend Indonesia berdiskusi: React, Vue, CSS, tooling, sampai karier. Semua level welcome — dari yang baru belajar sampai senior yang mau berbagi." },
  { slug: "umkm-naik-kelas", name: "UMKM Naik Kelas", ownerIdx: 2, visibility: "public",
    description: "Komunitas pelaku UMKM Indonesia: berbagi pengalaman digitalisasi, pemasaran online, keuangan sederhana, dan cerita usaha nyata. Tanya apa saja, dijawab dengan pengalaman." },
  { slug: "skripsi-survivors", name: "Skripsi Survivors", ownerIdx: 4, visibility: "public",
    description: "Untuk mahasiswa yang sedang atau sudah melewati skripsi: diskusi metode penelitian, tools penunjang, motivasi, dan tips lolos sidang tanpa drama." },
  { slug: "remote-worker-id", name: "Remote Worker ID", ownerIdx: 5, visibility: "public",
    description: "Pekerja remote dan freelancer Indonesia: setup kerja dari rumah/kafe, kebiasaan produktif, harga jasa, sampai cerita klien. Komunitas santai tapi solid." },
  { slug: "desain-ui-ux", name: "Desain & UI/UX", ownerIdx: 3, visibility: "public",
    description: "Ruang para desainer: kritik portofolio, diskusi tool, design system, dan jalur karier UI/UX di Indonesia. Berbagi karya dipersilakan, kritik membangun diharapkan." },
  { slug: "belajar-menulis", name: "Belajar Menulis", ownerIdx: 1, visibility: "public",
    description: "Komunitas penulis pemula sampai berpengalaman: teknik menyusun tulisan, konsistensi menulis, konten SEO, dan tantangan menulis bersama setiap minggu." },
];

// ---------------------------------------------------------------------------
// 4. Artikel (markdown → blok JSONB otomatis)
// ---------------------------------------------------------------------------
const ARTICLES = [
  {
    authorIdx: 0, category: "teknologi", publishedDaysAgo: 6, views: 312,
    tags: ["tools", "developer", "gratis"],
    title: "7 Tools Gratis di RuangKumpul yang Wajib Dicoba Developer",
    excerpt: "Dari JSON formatter sampai UUID generator — semua berjalan di browser, tanpa login, tanpa kirim data ke server.",
    seoTitle: "7 Tools Developer Gratis Online — JSON, UUID, Base64 | RuangKumpul",
    seoDescription: "Kumpulan 7 tools gratis untuk developer: JSON formatter, JSON validator, UUID generator, Base64 encoder, dan lainnya. Berjalan 100% di browser.",
    md: `Kalau kamu developer, pasti sering berhadapan dengan tugas-tugas kecil yang mengganggu: merapikan JSON dari response API, mengecek validitas konfigurasi, atau butuh UUID cepat untuk testing. Kabar baiknya — semua itu bisa diselesaikan di [RuangKumpul](/) tanpa install apa pun.

## Kenapa tools browser lebih enak dipakai?

Semua tools di RuangKumpul berjalan **100% di browser kamu**. Artinya:

- Data sensitif (token, payload API internal) tidak pernah dikirim ke server mana pun
- Tidak perlu login, tidak ada banner minta daftar
- Buka tab baru, pakai, tutup. Selesai.

## 7 Tools yang paling sering dipakai

1. **[JSON Formatter](/tools/json-formatter)** — rapikan JSON yang berantakan dari response API, pilih indentasi 2 atau 4 spasi, atau minify untuk produksi.
2. **[JSON Validator](/tools/json-validator)** — kalau formatter bilang error, validator ini menunjukkan baris dan kolomnya.
3. **[UUID Generator](/tools/uuid-generator)** — butuh 50 UUID untuk seed data? Sekali klik, tersedia ratusan.
4. **[Base64 Encoder](/tools/base64-encoder)** — encode/decode dengan dukungan Unicode penuh, termasuk emoji.
5. **[URL Encoder](/tools/url-encoder)** — wajib ada saat bikin query parameter yang berisi karakter spesial.
6. **[Word Counter](/tools/word-counter)** — hitung kata untuk commit message panjang? Ya, ini juga berguna untuk dokumentasi.
7. **[Password Generator](/tools/password-generator)** — untuk password database lokal atau akun testing.

## Tips: simpan ke bookmark

Kamu bisa menekan ikon bintang di halaman tool untuk menandainya sebagai favorit, lalu mengaksesnya dari dashboard. Bookmark hanya terlihat oleh kamu.

> Tool terbaik adalah tool yang ada saat kamu butuhkan. Simpan RuangKumpul di bookmark bar, dan selamat tinggal pencarian Google dua menit untuk "json beautifier online".`,
  },
  {
    authorIdx: 4, category: "produktivitas", publishedDaysAgo: 5, views: 267,
    tags: ["skripsi", "mahasiswa", "tips"],
    title: "7 Tools Gratis untuk Menyelesaikan Skripsi Lebih Cepat",
    excerpt: "Skripsi tidak selesai karena malas — seringnya karena berantakan. Ini 7 tools yang merapikan prosesnya, semua gratis.",
    seoTitle: "7 Tools Gratis untuk Skripsi — Hitung Kata, Fokus Timer | RuangKumpul",
    seoDescription: "Tools gratis untuk mahasiswa yang sedang skripsi: penghitung kata, pomodoro timer, checklist, dan converter satuan. Gratis tanpa login.",
    md: `Dari pengalaman bertahan di tahun akhir, saya belajar satu hal: skripsi tidak selesai karena kita malas — tapi karena **prosesnya berantakan**. File berserakan, jumlah kata tidak terpantau, dan fokus gampang pecah. Berikut 7 tools gratis yang menyelamatkan saya.

## 1. Penghitung Kata — pantau progres tanpa buka Word

Fitur "jumlah kata" di Word sering membuat kita buka dokumen hanya untuk penasaran. Dengan [Penghitung Kata](/tools/word-counter), tempel bagian yang sedang ditulis dan lihat langsung: kata, karakter, kalimat, sampai estimasi waktu baca. Target harian 500 kata terasa lebih nyata kalau terlihat angkanya.

## 2. Pomodoro Timer — 25 menit yang mengubah segalanya

Metode Pomodoro sederhana: fokus 25 menit, istirahat 5. [Pomodoro Timer](/tools/pomodoro-timer) di RuangKumpul berjalan di browser, jadi cukup satu tab tersisih di layar. Satu sesi 25 menit terasa mungkin bahkan saat otak menolak "menulis 3 jam".

## 3. Checklist — pecah bab jadi tugas kecil

"Selesaikan Bab 3" adalah tugas yang menakutkan. "Buat tabel frekuensi", "Tulis interpretasi tabel 3.1", "Perbaiki sitasi Mardianto" — itu tugas yang bisa diselesaikan. Gunakan [Checklist](/tools/checklist) untuk memecah setiap bab.

## 4-7. Tools pendukung lainnya

- **[Konverter Huruf](/tools/case-converter)** — rapikan kapitalisasi judul tabel dan gambar (Title Case vs Sentence case) dalam sekali klik.
- **[Konverter Satuan](/tools/unit-converter)** — responden 165 cm? Konversi ke m tanpa salah koma.
- **[Kalkulator Persen](/tools/percentage-calculator)** — persentase responden, persentase error, semua cepat.
- **[Kalkulator Umur](/tools/age-calculator)** — terdengar sepele, tapi berguna saat mengisi profil responden.

## Pola kerja yang akhirnya berhasil untuk saya

> 1 sesi Pomodoro menulis, 1 sesi merapikan, istirahat panjang, ulangi. Skripsi selesai bukan oleh motivasi besar, tapi oleh sesi-sesi kecil yang konsisten.

Semua tools di atas gratis tanpa login. Selamat berjuang, calon sarjana — tabrak deadline-nya!`,
  },
  {
    authorIdx: 2, category: "bisnis-digital", publishedDaysAgo: 4, views: 198,
    tags: ["umkm", "keuangan", "hpp"],
    title: "Cara Menghitung HPP untuk UMKM Makanan (Dengan Contoh Sederhana)",
    excerpt: "Banyak usaha makanan rugi tanpa sadar karena HPP dihitung asal-asalan. Ini cara menghitungnya dengan benar, bahasa awam.",
    seoTitle: "Cara Menghitung HPP UMKM Makanan + Contoh | RuangKumpul",
    seoDescription: "Panduan menghitung Harga Pokok Penjualan (HPP) untuk usaha makanan rumahan: bahan baku, porsi, dan contoh perhitungan sederhana yang bisa langsung dipraktikkan.",
    md: `Cerita saya: dua tahun jualan catering, rasanya ramai dan laku terus — tapi ko countung-countung di akhir bulan uangnya tidak ada? Setelah duduk serius menghitung, ternyata **Harga Pokok Penjualan (HPP) saya salah sejak awal**. Ini cara menghitungnya dengan benar, dengan bahasa awam.

## Apa itu HPP?

HPP adalah seluruh biaya yang keluar untuk menghasilkan satu porsi produk. Bukan hanya bahan baku — tapi semua yang "habis" saat kamu memasak.

## Langkah menghitung HPP

1. **Catat semua bahan per resep.** Contoh nasi ayam geprek untuk 10 porsi: ayam 1 kg (Rp38.000), beras 2 kg (Rp26.000), sambal & bumbu (Rp15.000), minyak (Rp8.000), kemasan 10 pcs (Rp12.000).
2. **Jumlahkan per resep.** Total = Rp99.000 untuk 10 porsi.
3. **Bagi per porsi.** HPP = Rp99.000 ÷ 10 = **Rp9.900 per porsi**.

## Kesalahan yang paling sering (dan pernah saya lakukan)

- Lupa menghitung **kemasan dan tisu** — bisa 8-10% dari harga!
- Tidak menghitung **gas LPG dan listrik** — masukkan sebagai estimasi per batch.
- Lupa bahan yang terbuang (ayam yang gagal goreng itu biaya nyata).
- Harga bahan tidak pernah diperbarui — cabai naik-turun drastis, hitung ulang tiap bulan.

## Menentukan harga jual dari HPP

Rumus yang umum dipakai UMKM makanan: **harga jual = HPP × 2 sampai × 2,5**. Dengan HPP Rp9.900, harga jual yang sehat adalah Rp20.000–25.000. Kalau kompetitor jual Rp15.000, jangan ikutan menurunkan harga — pangkas HPP (negosiasi bahan, porsi lebih efisien), bukan profitnya.

## Mulai dari mana?

Ambil kertas, pilih satu menu terlaris, hitung bahan per resep hari ini. Cukup satu menu dulu. Untuk hitung cepat persentase laba atau margin, [Kalkulator Persen](/tools/percentage-calculator) gratis di RuangKumpul bisa dipakai tanpa Excel.

> Usaha yang sehat bukan yang ramai, tapi yang tahu angkanya sendiri. Selamat menghitung!`,
  },
  {
    authorIdx: 3, category: "karier", publishedDaysAgo: 3, views: 241,
    tags: ["portofolio", "ui-ux", "karier"],
    title: "Portofolio UI/UX yang Bikin Recruiter Berhenti Scroll: 6 Aturan Nyata",
    excerpt: "Recruiter rata-rata melihat portofolio di bawah 3 menit. Enam aturan ini memastikan waktu itu dipakai untuk memperhatikanmu.",
    seoTitle: "Tips Portofolio UI/UX Designer — Lolos Screening | RuangKumpul",
    seoDescription: "6 aturan membangun portofolio UI/UX yang menarik recruiter: kasus studi yang jelas, proses yang terlihat, dan kesalahan umum yang harus dihindari.",
    md: `Setelah tiga tahun ikut menyaring aplikasi kerja di studio tempat saya bekerja, saya bisa kasih tahu satu rahasia: **recruiter tidak membaca portofolio — mereka memindainya.** Waktu pindai rata-rata di bawah 3 menit. Enam aturan ini memastikan waktu itu terpakai untuk memperhatikanmu.

## 1. Satu kasus studi mendalam mengalahkan sepuluh mockup

Tiga mockup cantik tanpa cerita = nol informasi. Satu kasus studi yang menjelaskan **masalah → riset → keputusan → hasil** = bukti kamu berpikir. Pilih 2-3 proyek terbaik, kerjakan kasus studinya dengan sungguh-sungguh.

## 2. Mulai dengan masalah, bukan gambar

Halaman pertama kasus studi harus menjawab: aplikasi apa, untuk siapa, masalahnya apa. Contoh pembuka yang bagus: "Aplikasi pemesanan laundry dengan tingkat pembatalan 40% karena pengguna tidak yakin kapan kurir datang."

## 3. Tunjukkan keputusan, bukan hanya hasil

- "Kenapa memakai bottom sheet, bukan halaman baru?"
- "Kenapa alur onboarding dipangkas dari 5 jadi 2 langkah?"
- "Apa yang tidak jadi kamu buat, dan kenapa?"

Rekruter mencari cara berpikir, bukan kemampuan menarik gradient.

## 4. Tampilkan versi sebelum-sesudah yang jujur

Perlihatkan versi awal yang jelek itu justru poin plus — asalkan kamu jelaskan apa yang berubah dan mengapa. Ini bukti proses iterasi nyata.

## 5. Rapikan hal-hal kecil yang sering dilupakan

- Foto hero jangan sampai 4 MB (kompres — [Kompres Gambar](/tools/image-compressor) gratis di sini, diproses di browser)
- Nama file jangan "final-fix-revisi2.png"
- Tulis ringkasan 2 kalimat di bawah setiap gambar utama

## 6. Tulis hasil sedetail yang kamu punya

"Setelah redesain, pembatalan turun dari 40% ke 18% dalam sebulan" jauh lebih kuat daripada "meningkatkan pengalaman pengguna". Kalau proyekmu latihan pribadi tanpa data, jujurlah: "Saya menguji dengan 5 pengguna, 4 dari 5 menyelesaikan tugas tanpa bantuan."

> Portofolio yang baik bukan yang paling indah, tapi yang paling mudah dipahami orang asing dalam 3 menit. Susun ulang milikmu dengan enam aturan ini, dan lihat bedanya.`,
  },
  {
    authorIdx: 1, category: "komunitas", publishedDaysAgo: 2, views: 154,
    tags: ["komunitas", "menulis", "belajar"],
    title: "Membangun Komunitas Online yang Tetap Aktif: 8 Pelajaran Nyata",
    excerpt: "Komunitas mati bukan karena tidak punya anggota, tapi karena tidak punya alasan untuk kembali. Delapan pelajaran dari merawat komunitas menulis 2 tahun.",
    seoTitle: "Cara Membangun Komunitas Online yang Aktif — 8 Pelajaran | RuangKumpul",
    seoDescription: "Pelajaran nyata membangun komunitas online yang tetap aktif: alasan berkumpul yang jelas, ritual mingguan, dan cara menghidupkan diskusi tanpa memaksa.",
    md: `Saya merawat komunitas menulis online selama dua tahun — dari 12 orang sampai ratusan anggota. Banyak yang saya salah, sedikit yang benar. Delapan pelajaran ini yang paling berharga.

## 1. "Topik" bukan alasan berkumpul — "ritual" iya

Komunitas dengan topik "menulis" akan sepi. Komunitas dengan ritual "setiap Jumat kita posting draft 300 kata dan saling memberi satu masukan" akan hidup. **Ritual memberi alasan kembali.**

## 2. Kecil dan hangat mengalahkan besar dan dingin

40 anggota yang saling mengenal nama mengalahkan 4.000 anggota yang saling melewati. Di awal, sambut setiap orang baru secara personal.

## 3. Pertanyaan spesifik mengalahkan pertanyaan terbuka

"Ada tips menulis?" tidak menghasilkan balasan. "Kalau draft kalian stuck di bagian tengah, kalian mundur ke outline atau terus paksa menulis?" — itu memancing 20 jawaban. **Spesifik itu mengundang.**

## 4. Pemimpin komunitas berbicara terakhir, bukan pertama

Kalau admin selalu menjawab duluan, anggota lain merasa tidak perlu. Diamkan 12-24 jam dulu. Sulit, tapi penting.

## 5. Apresiasi kecil yang rutin > penghargaan besar yang jarang

Sebut anggota yang aktif, bagikan tulisan mereka, rayakan progres kecil ("kak Rina akhirnya selesai draft bab 2!"). Ini bahan bakar termurah dan paling ampuh.

## 6. Aturan sedikit, tegak dengan konsisten

Tiga aturan yang selalu ditegakkan mengalahkan sepuluh aturan yang kadang diabaikan. Kejelasan membuat orang merasa aman.

## 7. Sedot pelajaran, bukan hanya konten

Setiap diskusi seru, rangkum jadi satu tulisan "sari minggu ini". Anggota yang tidak sempat hadir tetap mendapat nilai, dan arsip komunitas tumbuh.

## 8. Komunitas butuh rumah

Grup chat berantakan cepat. Forum dengan kategori dan halaman yang bisa dicari — seperti yang disediakan [RuangKumpul](/komunitas) — membuat diskusi tetap bisa ditemukan enam bulan kemudian.

> Komunitas adalah tanaman, bukan kembang api. Siram sedikit tapi setiap hari.`,
  },
  {
    authorIdx: 5, category: "produktivitas", publishedDaysAgo: 1, views: 89,
    tags: ["remote", "produktivitas", "wfh"],
    title: "Work dari Café Tanpa Mengganggu Orang: Panduan Etika yang Sering Dilupakan",
    excerpt: "Duduk 4 jam pesan dua teh? Nggak apa-apa, asal tahu etikanya. Panduan singkat work dari kafe untuk remote worker Indonesia.",
    seoTitle: "Etika Work dari Kafe untuk Remote Worker | RuangKumpul",
    seoDescription: "Panduan etika bekerja dari kafe: memilih meja yang tepat, konsumsi yang wajar, keamanan WiFi, dan cara jadi pelanggan yang ingin dikelola barista.",
    md: `Sudah dua tahun kerja remote, dan kafe adalah kantor kedua saya. Tapi di banyak diskusi remote worker, satu topik jarang dibahas: **etika.** Bagaimana cara kerja di kafe tanpa jadi beban bagi pemiliknya — bahkan menjadi pelanggan yang mereka sayangi?

## 1. Pilih meja sesuai jam

Jam sepi (09.00–16.00 di kafe non-mall) = meja besar boleh. Jam sibuk (weekend, after-office) = meja kecil di pojok. Aturan simpelnya: **jangan menduduki meja empat kursi sendirian saat orang lain berdiri mencari tempat.**

## 2. Rumus konsumsi yang adil

Patokan yang saya pakai: **Rp20.000–25.000 per jam kerja di kafe.** Kerja 4 jam = pesan makan + minum sekitar Rp80-100 ribu. Kalau hanya minum, makan dengan takaran waktu, bukan takaran nafsu.

## 3. Keamanan yang sering diabaikan

- **WiFi publik bukan WiFi aman.** Hindari login akun penting saat terhubung tanpa VPN.
- Lock laptop setiap kali meninggalkan meja, bahkan cuma ke kasir.
- Jangan bikin orang lain bisa membaca layar yang isinya data klien.

## 4. Panggilan video? Pakai kesepakatan tak tertulis

Butuh meeting? Pakai earphone, duduk jauh dari meja penuh, dan bicara dengan volume "kafe", bukan "ruang rapat". Lebih baik lagi: pilih kafe dengan area outdoor atau ruang meeting.

## 5. Jadilah pelanggan yang diingat

Sapa barista, tumpahkan sendiri remah-remah, dan — ini penting — **jangan pakai colokan tanpa memesan apa pun.** Listrik itu bagian dari harga kopi, bukan hak gratis.

## Bonus: setup yang bikin kerja makin nyaman

Kopi jadi teman kerja, tapi jangan biarkan tenggat jadi drama. Saya selalu menyisipkan [Pomodoro Timer](/tools/pomodoro-timer) di satu tab dan menyimpan ide mendadak di [Catatan](/dashboard/catatan) RuangKumpul.

> Kafe yang baik adalah mitra kerja. Perlakukan mereka seperti mitra, dan mereka akan menyimpan kursi favoritmu.`,
  },
];

// ---------------------------------------------------------------------------
// 5. Diskusi (posts) — tersebar di komunitas
// ---------------------------------------------------------------------------
const POSTS = [
  { community: "frontend-indonesia", authorIdx: 0, daysAgo: 5, type: "discussion", views: 143,
    title: "Tailwind vs CSS Modules di 2026 — sekarang kalian tim mana?",
    content: `Awalnya saya full Tailwind, sekarang proyek kantor pakai CSS Modules karena designer minta kontrol penuh atas class.

Jujur dua-duanya enak, tapi beda konteks:
- Tailwind: cepat untuk prototyping dan proyek solo, konsisten kalau timnya disiplin
- CSS Modules: lebih aman untuk design system besar, tapi butuh disiplin naming

Di tim kalian sekarang pakai apa? Dan apa alasan paling nyata (bukan sekadar "kebiasaan")? Curious dengan pengalaman Indonesia banget: proyek klien yang sering ganti-ganti arah tengah jalan.` },
  { community: "frontend-indonesia", authorIdx: 5, daysAgo: 4, type: "question", views: 97,
    title: "Cara handle state kompleks tanpa langsung pakai library state management?",
    content: `Saya lagi buat aplikasi booking dengan alur form panjang (5 langkah, bisa mundur-maju, draft tersimpan).

Sekarang state-nya mulai susah dilacak dengan useState biasa. Kawan-kawan biasanya langsung lompat ke Zustand/Redux, atau ada pola lain yang lebih sederhana dulu? Kalau ada referensi proyek open source Indonesia yang polanya rapi, boleh banget di-share.` },
  { community: "frontend-indonesia", authorIdx: 4, daysAgo: 2, type: "discussion", views: 61,
    title: "Roadmap belajar frontend 2026 versi kalian — apa yang SUDAH tidak relevan?",
    content: `Banyak roadmap di internet masih menyebut jQuery di posisi wajib. Menurut pengalaman teman-teman, apa saja yang SUDAH TIDAK wajib dipelajari pemula di 2026, dan apa yang justru makin penting (misal aksesibilitas, performa, understanding rendering)? Mari kita bikin roadmap versi pengalaman nyata, bukan versi marketing kursus online.` },
  { community: "umkm-naik-kelas", authorIdx: 2, daysAgo: 5, type: "discussion", views: 121,
    title: "Pengalaman daftar NIB online — ternyata cuma 20 menit, ini langkahnya",
    content: `Baru sadar ternyata daftar NIB (Nomor Induk Berusaha) sekarang gampang banget, gratis, dan selesai dalam satu duduk. Ringkasan langkah yang saya lewati:

1. Siapkan KTP dan nomor HP aktif
2. Daftar akun di layanan OSS
3. Isi data usaha (nama, bidang, alamat)
4. NIB langsung terbit dalam bentuk PDF

Yang paling sering bikin bingung: memilih KBLI. Untuk usaha makanan rumahan saya pakai KBLI 10792 (industri makanan olahan). Ada yang mau saya bantu jelaskan bagian tertentu? Tanya di komentar.` },
  { community: "umkm-naik-kelas", authorIdx: 1, daysAgo: 3, type: "question", views: 88,
    title: "UMMK makanan: paling untung jualan lewat marketplace atau WA langsung?",
    content: `Selamat siang para pelaku usaha. Saya penjual frozen food rumahan, sekarang masih 100% lewat WA + story Instagram.

Tergoda daftar ke marketplace besar karena traffic-nya, tapi potongan biaya dan persaingan harga bikin ragu. Buat yang sudah mencoba keduanya: setelah semua biaya dipotong, dari mana margin kalian lebih sehat? Dan yang paling penting — pelanggan dari mana yang lebih loyal?` },
  { community: "umkm-naik-kelas", authorIdx: 3, daysAgo: 1, type: "announcement", views: 45,
    title: "Tantangan minggu ini: hitung HPP satu menu andalanmu, share hasilnya di sini",
    content: `Semenkagu terakhir kita sering bahas harga. Supaya tidak berhenti jadi teori, mari kita praktik bersama:

1. Pilih SATU menu paling laris
2. Hitung HPP-nya (bahan + kemasan + gas/l + penyusutan)
3. Bandingkan dengan harga jual sekarang
4. Share di sini: HPP berapa, jual berapa, menurut kalian sehat atau tidak

Yang jujur bilang "ternyata saya rugi tanpa sadar" itu PENTING — itu justru akan menyelamatkan banyak anggota lain. Mulai dari yang berani. 💪` },
  { community: "skripsi-survivors", authorIdx: 4, daysAgo: 4, type: "discussion", views: 132,
    title: "Dari semua bab skripsi, kenapa ya Bab 4 (hasil) yang paling sering bikin stuck?",
    content: `Pengamatan saya dari teman-teman satu angkatan (dan diri sendiri): Bab 1-3 bisa kelar dengan disiplin, tapi Bab 4 seperti punya kehidupan sendiri. Data sudah ada, tabel sudah jadi, tapi begitu disuruh "menginterpretasikan" semua langsung blank.

Teori saya: kita terlalu takut salah menyimpulkan, padahal dosen biasanya hanya minta kita JELAS, bukan jenius. Gimana pengalaman kalian? Bagian mana yang paling lama dikerjakan?` },
  { community: "skripsi-survivors", authorIdx: 0, daysAgo: 2, type: "question", views: 74,
    title: "Tools apa yang paling menyelamatkan kalian waktu skripsi? (poll santai)",
    content: `Saya mulai dulu: Pomodoro timer menyelamatkan saya dari menulis 3 jam tanpa arah — 25 menit terasa mungkin, 3 jam tidak.

Kalau kalian, satu tools (apa pun: aplikasi, spreadsheet, bahkan teknik manual) apa yang paling banyak menghemat waktu skripsi kalian? Sebutkan satu saja yang paling berdampak, biar jadi rekomendasi yang benar-benar teruji.` },
  { community: "remote-worker-id", authorIdx: 5, daysAgo: 3, type: "discussion", views: 109,
    title: "Jam kerja remote kalian mulai jam berapa? Dan kalian JUJUR produktif jam berapa?",
    content: `Saya mulai sadar: jam kerja resmi saya 9-5, tapi jam paling produktif saya ternyata 07.00-10.00 pagi. Setelah jam 3 sore, otak mulai seperti WiFi penuh tapi kecepatan 2G.

Menariknya, banyak perusahaan remote tetap maksa jam 9. Yang saya tanya: kalian yang remote, apakah kalian berani negosiasi jam kerja mengikuti jam produktif kalian? Atau lebih aman ikut jam tim saja? Share pengalaman nyatanya ya, bukan teorinya.` },
  { community: "remote-worker-id", authorIdx: 1, daysAgo: 1, type: "discussion", views: 67,
    title: "Rate untuk klien luar negeri — kalian pakai patokan apa sekarang?",
    content: `Dulu saya pakai acuan "rate klien lokal × 1,5". Tapi belakangan banyak freelancer Indonesia yang langsung pakai standar global (misal $30-50/jam untuk writing/design tingkat menengah).

Bagi yang rutin dapat klien luar: rate kalian sekarang masuk range mana, dan apa yang paling membantu saat negosiasi naik rate — portfolio, testimoni, atau keberanian saja? 😄` },
  { community: "desain-ui-ux", authorIdx: 3, daysAgo: 2, type: "discussion", views: 95,
    title: "Kritik portofolio minggu ini: apa kesan pertama dari halaman awal kasus studi kalian?",
    content: `Rutinitas baru di komunitas: setiap minggu, 2 orang volunter share link portofolio, lalu kita review 15 menit bersama-sama. Aturannya satu — kritik karya, bukan orang.

Minggu ini saya mulai dulu. Yang saya sadar setelah review portofolio sendiri: halaman kasus studi saya langsung nempel gambar mockup TANPA satu kalimat pun menjelaskan masalahnya. Padahal di artikel yang saya tulis, aturan nomor 2 justru "mulai dengan masalah". Praktiknya susah ya 😅

Yang mau ikut minggu depan, tinggal drop link di komentar.` },
  { community: "belajar-menulis", authorIdx: 1, daysAgo: 1, type: "announcement", views: 58,
    title: "Tantangan menulis #12: 300 kata tentang 'hal kecil yang mengubah cara kerjamu'",
    content: `Tantangan rutin mingguan kita!

**Tema minggu ini:** hal kecil yang mengubah cara kerjamu — bisa sebuah tools, kebiasaan, kalimat dari buku, apa saja.

**Aturan:**
1. Maksimal 300 kata, diposting langsung di komunitas ini
2. Beri satu masukan spesifik untuk tulisan anggota di ATAS postinganmu (bukan yang di bawah)
3. Tidak ada koreksi tata bahasa yang tidak diminta — fokus ke ide

Deadline: Minggu malam. Draft bisa ditulis langsung, tidak perlu sempurna. Yang penting KELAR, bukan SEMPURNA. 🖊️` },
];

// ---------------------------------------------------------------------------
// 6. Komentar (postSlugKey → komentar)
// ---------------------------------------------------------------------------
const COMMENTS = [
  { post: 0, items: [
    { authorIdx: 4, content: "Tim Tailwind untuk proyek pribadi, CSS Modules untuk kerja. Yang bikin saya bertahan di Tailwind sekarang adalah konsistensinya pakai design tokens — ganti tema sekali, semua ikut." },
    { authorIdx: 5, content: "Pengalaman saya kebalikannya: klien suka minta revisi gaya mendadak, dan Tailwind justru nyelametin karena perubahan jadi cepat. CSS Modules lebih rapi tapi revisi rasanya lebih lama." },
    { authorIdx: 3, content: "Dari sisi designer: yang penting bukan tools-nya, tapi apakah hasilnya konsisten dengan design system. Kalau timnya disiplin, dua-duanya bisa bagus." },
  ]},
  { post: 1, items: [
    { authorIdx: 0, content: "Coba dulu turunkan state ke komponen yang lebih kecil (lifting state down / composition). Sering kali 'state kompleks' sebenarnya cuma state yang salah tempat." },
    { authorIdx: 3, content: "+1 untuk zustand kalau memang sudah kompleks. Untuk multi-step form, saya biasanya simpan seluruh draft di satu object state dengan reducer — lebih gampang ditrack mundur-majunya." },
  ]},
  { post: 2, items: [
    { authorIdx: 5, content: "Yang menurut saya makin penting: memahami bagaimana rendering bekerja (server vs client), aksesibilitas dasar, dan debugging. Yang makin tidak: hafalan API framework tertentu — API-nya berubah tiap tahun." },
    { authorIdx: 1, content: "Setuju. Tambah satu: membaca dokumentasi resmi dengan baik itu skill yang makin langka dan makin berharga." },
  ]},
  { post: 3, items: [
    { authorIdx: 1, content: "Ini sangat membantu! Kebingungan saya biasanya di bagian alamat usaha — kalau usahanya di rumah, pakai alamat rumah langsung saja ya?" },
    { authorIdx: 3, content: "Wah kebetulan minggu lalu saya daftar juga. Tambahan: setelah NIB terbit, jangan lupa cek kewajiban pelaporan per kategorinya di dashboard OSS-nya." },
    { authorIdx: 2, content: "@Sari betul, alamat rumah langsung bisa untuk pola usaha rumahan. @Dewi iya itu penting — banyak yang lupa sampai butuh untuk daftar marketplace 😅" },
  ]},
  { post: 4, items: [
    { authorIdx: 2, content: "Pengalaman saya: WA untuk pelanggan repeat, marketplace untuk pelanggan baru. Dua-duanya dipakai dengan harga sedikit berbeda supaya tidak saling makan." },
    { authorIdx: 5, content: "Frozen food sebaiknya tetap punya toko marketplace minimal satu, karena orang mencari produk seperti itu lewat pencarian — tidak lewat story." },
  ]},
  { post: 5, items: [
    { authorIdx: 5, content: "Ikutan! Menu andalan saya bakso kuah — baru sadar setelah dihitung, kemasan dan gas itu 12% dari HPP. Baru pertama kali dihitung sejelas ini 😳" },
  ]},
  { post: 6, items: [
    { authorIdx: 1, content: "Setuju banget. Yang akhirnya mengubah saya: menulis interpretasi dengan pola 'angka menunjukkan X, hal ini karena Y, sejalan dengan teori Z'. Pola kaku tapi menyelesaikan." },
    { authorIdx: 0, content: "Dosen pembimbing saya pernah bilang: 'Bab 4 itu cerita datamu, bukan esai kebetulan.' Kalimat itu langsung mengubah cara saya menulisnya." },
  ]},
  { post: 7, items: [
    { authorIdx: 2, content: "Spreadsheet rekap jadwal bimbingan! Sederhana tapi menyelamatkan dari drama 'dosen bilang saya jarang datang'." },
  ]},
  { post: 8, items: [
    { authorIdx: 4, content: "07.00-10.00 juga! Yang saya lakukan: mulai kerja sebelum jam tim, lalu pakai sore untuk tugas yang butuh otak rendah (revisi kecil, email)." },
    { authorIdx: 3, content: "Saya malah night owl — 21.00-23.00 paling produktif. Untung tim saya asynch, deliverable-nya yang dilihat, bukan jamnya." },
  ]},
  { post: 10, items: [
    { authorIdx: 0, content: "Ini fitur komunitas yang bagus — kritik rutin itu yang membuat anggota betah. Kalau butuh bantuan review dari sisi developer (bukan desain), saya ikut." },
  ]},
];

// ---------------------------------------------------------------------------
// 7. Event mendatang
// ---------------------------------------------------------------------------
const EVENTS = [
  { authorIdx: 0, daysAhead: 8, format: "online", category: "Webinar", max: 200,
    title: "Webinar: CV & Portfolio Lolos Screening ATS",
    description: `Banyak CV bagus yang gugur sebelum dibaca manusia — karena sistem ATS (Applicant Tracking System) menolaknya lebih dulu.

Di webinar ini kita bedah:
- Apa yang dicari ATS di CV-mu (dan yang membuatmu ditolak otomatis)
- Struktur portofolio untuk developer, designer, dan non-teknis
- Live review 3 CV peserta (daftar sukarela saat sesi)

**Pembicara:** Budi Santoso — 5 tahun di industri, pernah menyaring ratusan lamaran.

Gratis untuk semua peserta RuangKumpul. Pendaftaran ditutup saat kuota penuh.`,
    location: null, online: true },
  { authorIdx: 4, daysAhead: 15, format: "online", category: "Workshop", max: 100,
    title: "Workshop: JSON & API untuk Pemula (Hands-on)",
    description: `Workshop praktik untuk pemula yang ingin paham cara kerja API:

- Apa itu JSON dan kenapa hampir semua API memakainya
- Membaca response API tanpa takut: format, nesting, error
- Praktik langsung: format & validasi JSON dengan tools gratis
- Tanya jawab bebas di akhir sesi

Bawa laptop, tanpa install apa pun — semua tools dipakai lewat browser. Sertifikat partisipasi digital diberikan untuk hadir penuh.`,
    location: null, online: true },
  { authorIdx: 0, daysAhead: 22, format: "offline", category: "Meetup", max: 60,
    title: "Frontend Indonesia Meetup — Jakarta #14",
    description: `Kopdar rutin komunitas Frontend Indonesia! Edisi kali ini:

- **18.30** — Registrasi & networking (disediakan coffee & snack)
- **19.00** — Talk 1: "Perjalanan migrasi design system besar tanpa mematikan produksi"
- **19.45** — Talk 2: "Open source pertama: dari takut PR sampai maintainer"
- **20.30** — Lightning talks 5 menit (daftar on-site, dipilih undian)
- **21.00** — Networking bebas

Lokasi: area Sudirman, Jakarta (detail venue dikirim via email ke peserta terdaftar). Kuota 60 orang — daftar sekarang, datang santai.`,
    location: "Jakarta Selatan", online: false },
  { authorIdx: 2, daysAhead: 28, format: "hybrid", category: "Webinar", max: 150,
    title: "Modal Gratis, Ide Banyak: Memulai UMKM Digital di 2027",
    description: `Webinar untuk calon dan pelaku UMKM yang ingin mulai berjualan digital tanpa modal besar:

- Menghitung HPP dan menentukan harga yang sehat (dengan contoh nyata)
- Membuat katalog produk sederhana dengan HP saja
- Memilih kanal: marketplace, WA, atau keduanya?
- Tanya jawab studi kasus peserta

Sesi ini hybrid: hadir online via link, atau offline di ruang komunitas Jakarta Timur (kuota terbatas). Pembicara: Andi Pratama — pemilik catering yang tumbuh dari 0 ke 400 porsi/minggu.`,
    location: "Jakarta Timur", online: true },
];

// ---------------------------------------------------------------------------
// 8. Lowongan kerja
// ---------------------------------------------------------------------------
const JOBS = [
  { authorIdx: 0, daysAgo: 3,
    company: "Nusantara Tech Lab", title: "Frontend Developer (React) — Remote Indonesia",
    type: "full_time", location: "Jakarta (Remote-friendly)", remote: true,
    salaryMin: 9000000, salaryMax: 16000000, period: "bulan",
    apply: "https://karier.nusantaratech.example.com/frontend-dev",
    description: `Kami membangun platform layanan keuangan digital yang dipakai jutaan pengguna Indonesia.

**Tanggung jawab:**
- Membangun dan merawat antarmuka web dengan React + TypeScript
- Berkolaborasi dengan designer untuk menerjemahkan design system menjadi komponen
- Menjaga performa dan aksesibilitas aplikasi

**Kualifikasi:**
- 2+ tahun pengalaman React (portofolio atau proyek nyata boleh menggantikan)
- Memahami TypeScript, REST API, dan state management
- Peduli pada detail UI dan pengalaman pengguna

**Benefit:** gaji di atas pasar untuk level junior-mid, kerja remote penuh, 2x setahun offline gathering, anggaran belajar tahunan.`,
  },
  { authorIdx: 1, daysAgo: 2,
    company: "Kilat Media", title: "Content Writer Freelance (Teknologi & Gaya Hidup)",
    type: "freelance", location: "Remote", remote: true,
    salaryMin: null, salaryMax: null, period: "proyek",
    apply: "https://kilatmedia.example.com/karier/writer",
    description: `Media digital dengan fokus gaya hidup dan teknologi mencari penulis freelance jangka panjang (3-5 artikel/bulan).

**Yang dibutuhkan:**
- Menulis Bahasa Indonesia yang rapi, ringan, dan tidak berputar-putar
- Terbiasa riset mandiri dan menyertakan sumber
- Bonus: paham dasar SEO (judul, struktur, intent)

**Skema:** bayar per artikel, rate mengikuti kualitas portofolio. Kirim 2 contoh tulisan terbaik melalui tautan lamaran.`,
  },
  { authorIdx: 3, daysAgo: 1,
    company: "Studio Arah", title: "UI/UX Designer (Mid Level)",
    type: "full_time", location: "Bandung", remote: false,
    salaryMin: 8000000, salaryMax: 14000000, period: "bulan",
    apply: "https://studioarah.example.com/careers/uiux-mid",
    description: `Studio produk digital di Bandung mencari designer yang berpikir dengan masalah, bukan sekadar estetika.

**Kamu akan:**
- Memegang kasus klien dari riset hingga handoff
- Menyusun dan merawat design system proyek
- Presentasi keputusan desain ke klien

**Kami cari:**
- 2-3 tahun pengalaman (Figma wajib)
- Kasus studi yang menunjukkan proses berpikir, bukan hanya visual
- Nyaman menerima dan memberi kritik desain

Kantor di dekat area Dago, fleksibel 2 hari remote per minggu.`,
  },
  { authorIdx: 2, daysAgo: 4,
    company: "Dapur Rasa Nusantara", title: "Social Media Officer (Part-time)",
    type: "part_time", location: "Surabaya", remote: false,
    salaryMin: 2500000, salaryMax: 3500000, period: "bulan",
    apply: "https://dapurrasa.example.id/karier/socmed",
    description: `Usaha makanan olahan rumahan yang tumbuh 3x dalam setahun mencari social media officer part-time.

**Tugas:** merancang konten mingguan (IG + TikTok), membalas DM/pertanyaan pelanggan, dan melaporkan perkembangan mingguan.

**Kriteria:** berdomisili Surabaya, mengenal dunia konten makanan, punya HP kamera yang layak. Pengalaman profesional tidak wajib — portofolio kecil (akun pribadi yang dirapikan pun boleh) justru kami nilai.`,
  },
  { authorIdx: 5, daysAgo: 5,
    company: "Talenta Hub", title: "Magang Digital Marketing (Batch Januari 2027)",
    type: "internship", location: "Jakarta", remote: false,
    salaryMin: 1500000, salaryMax: 2000000, period: "bulan",
    apply: "https://talentahub.example.com/internship/digital-marketing",
    description: `Program magang 4 bulan untuk mahasiswa tingkat akhir atau fresh graduate yang serius mendalami digital marketing.

**Akan dipelajari:** SEO dasar, content planning, analitik, dan email marketing — dengan mentoring 1-on-1 dua minggu sekali.

**Kriteria:** mahasiswa tingkat akhir/fresh graduate, menulis dengan rapi, ingin belajar cepat. Lulusan program mendapat prioritas rekomendasi ke perusahaan mitra.`,
  },
];

// ---------------------------------------------------------------------------
// EKSEKUSI
// ---------------------------------------------------------------------------

async function listAllAuthUsers() {
  const usersByEmail = new Map();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`gagal mengambil daftar user auth (hal. ${page}): ${error.message}`);
    const batch = data?.users ?? [];
    for (const user of batch) {
      if (user.email) usersByEmail.set(user.email, user);
    }
    if (batch.length < perPage) break;
  }
  return usersByEmail;
}

async function insertOrThrow(table, payload, context) {
  const { error } = await db.from(table).insert(payload);
  if (error) throw new Error(`gagal insert ${context} (${table}): ${error.message}`);
}

async function main() {
  console.log("🌱 RuangKumpul Content Seeder\n");

  // -- Persona: buat/ambil user auth ------------------------------------------
  const existingUsersByEmail = await listAllAuthUsers();
  const personaIds = [];
  for (const p of PERSONAS) {
    const found = existingUsersByEmail.get(p.email);
    if (found) {
      personaIds.push(found.id);
      console.log(`  persona ada: ${p.username}`);
      continue;
    }
    const { data: created, error } = await db.auth.admin.createUser({
      email: p.email,
      password: randomBytes(18).toString("hex"),
      email_confirm: true,
      user_metadata: { full_name: p.full_name },
    });
    if (error || !created?.user) throw new Error(`gagal buat persona ${p.email}: ${error?.message}`);
    personaIds.push(created.user.id);
    console.log(`  persona dibuat: ${p.username}`);
  }

  // -- Profil: username + bio --------------------------------------------------
  for (let i = 0; i < PERSONAS.length; i++) {
    const { error } = await db.from("profiles").update({
      username: PERSONAS[i].username,
      full_name: PERSONAS[i].full_name,
      bio: PERSONAS[i].bio,
    }).eq("id", personaIds[i]);
    if (error) throw new Error(`gagal perbarui profil ${PERSONAS[i].username}: ${error.message}`);
  }

  // -- Role contributor untuk semua persona ------------------------------------
  const { data: existingRoles } = await db.from("user_roles").select("user_id, role");
  const roleSet = new Set((existingRoles ?? []).map((r) => `${r.user_id}:${r.role}`));
  for (const id of personaIds) {
    if (!roleSet.has(`${id}:contributor`)) {
      await insertOrThrow("user_roles", { user_id: id, role: "contributor" }, `role ${id}`);
    }
  }
  console.log("  role contributor: ok");

  // -- Kategori artikel ---------------------------------------------------------
  for (const c of CATEGORIES) {
    await db.from("article_categories").upsert(c, { onConflict: "slug" });
  }
  console.log(`  kategori artikel: ${CATEGORIES.length}`);

  const { data: catRows } = await db.from("article_categories").select("id, slug");
  const catMap = new Map((catRows ?? []).map((c) => [c.slug, c.id]));

  // -- Tag artikel ---------------------------------------------------------------
  const tagMap = new Map();
  for (const a of ARTICLES) {
    for (const tag of a.tags) {
      if (tagMap.has(tag)) continue;
      const slug = slugify(tag);
      const { data: existing } = await db.from("tags").select("id").eq("slug", slug).maybeSingle();
      if (existing) { tagMap.set(tag, existing.id); continue; }
      const { data: created, error } = await db.from("tags").insert({ name: tag, slug }).select("id").single();
      if (!error && created) tagMap.set(tag, created.id);
    }
  }
  console.log(`  tag artikel: ${tagMap.size}`);

  // -- Artikel --------------------------------------------------------------------
  const articleSlugMap = new Map();
  for (const a of ARTICLES) {
    const slug = slugify(a.title).slice(0, 200);
    const { data: existing } = await db.from("articles").select("id").eq("slug", slug).maybeSingle();
    if (existing) { articleSlugMap.set(a.title, existing.id); continue; }

    const { data: created, error } = await db.from("articles").insert({
      author_id: personaIds[a.authorIdx],
      category_id: catMap.get(a.category) ?? null,
      title: a.title,
      slug,
      excerpt: a.excerpt,
      content: markdownToBlocks(a.md),
      status: "published",
      published_at: daysAgo(a.publishedDaysAgo, 10, 30),
      seo_title: a.seoTitle,
      seo_description: a.seoDescription,
      view_count: a.views,
      created_at: daysAgo(a.publishedDaysAgo, 10, 15),
      updated_at: daysAgo(a.publishedDaysAgo, 10, 30),
    }).select("id").single();
    if (error) throw new Error(`gagal buat artikel "${a.title}": ${error.message}`);

    const relations = a.tags.map((t) => ({ article_id: created.id, tag_id: tagMap.get(t) })).filter((r) => r.tag_id);
    if (relations.length) await db.from("article_tag_relations").insert(relations);
    articleSlugMap.set(a.title, created.id);
  }
  console.log(`  artikel: ${ARTICLES.length}`);

  // -- Komunitas (owner = persona; trigger auto-jadikan owner anggota) -------------
  const communityMap = new Map(); // slug -> id
  for (const c of COMMUNITIES) {
    const { data: existing } = await db.from("communities").select("id").eq("slug", c.slug).maybeSingle();
    if (existing) { communityMap.set(c.slug, existing.id); continue; }
    const { data: created, error } = await db.from("communities").insert({
      owner_id: personaIds[c.ownerIdx],
      name: c.name,
      slug: c.slug,
      description: c.description,
      visibility: c.visibility,
      created_at: daysAgo(10 + c.ownerIdx),
    }).select("id").single();
    if (error) throw new Error(`gagal buat komunitas ${c.slug}: ${error.message}`);
    communityMap.set(c.slug, created.id);
  }
  console.log(`  komunitas: ${COMMUNITIES.length}`);

  // -- Keanggotaan: semua persona gabung semua komunitas ---------------------------
  const { data: memberRows } = await db.from("community_members").select("community_id, user_id");
  const memberSet = new Set((memberRows ?? []).map((m) => `${m.community_id}:${m.user_id}`));
  let addedMembers = 0;
  for (const c of COMMUNITIES) {
    for (const uid of personaIds) {
      const key = `${communityMap.get(c.slug)}:${uid}`;
      if (memberSet.has(key)) continue;
      await insertOrThrow(
        "community_members",
        { community_id: communityMap.get(c.slug), user_id: uid, role: "member", status: "approved" },
        `keanggotaan ${c.slug}`,
      );
      addedMembers++;
    }
  }
  console.log(`  keanggotaan baru: ${addedMembers}`);

  // -- Diskusi (posts) ----------------------------------------------------------------
  const postIdList = [];
  for (let i = 0; i < POSTS.length; i++) {
    const p = POSTS[i];
    const slug = `${slugify(p.title).slice(0, 180)}-seed${i + 1}`;
    const { data: existing } = await db.from("posts").select("id").eq("slug", slug).maybeSingle();
    if (existing) { postIdList.push(existing.id); continue; }
    const { data: created, error } = await db.from("posts").insert({
      community_id: communityMap.get(p.community),
      author_id: personaIds[p.authorIdx],
      title: p.title,
      slug,
      content: p.content,
      post_type: p.type,
      status: "published",
      view_count: p.views,
      created_at: daysAgo(p.daysAgo, 8 + (i % 6), 15),
      updated_at: daysAgo(p.daysAgo, 8 + (i % 6), 15),
    }).select("id").single();
    if (error) throw new Error(`gagal buat post "${p.title}": ${error.message}`);
    postIdList.push(created.id);
  }
  console.log(`  diskusi: ${POSTS.length}`);

  // -- Komentar -------------------------------------------------------------------------
  const { data: existingComments } = await db.from("comments").select("post_id, author_id, content");
  const commentKeys = new Set((existingComments ?? []).map((c) => `${c.post_id}:${c.author_id}:${c.content.slice(0, 40)}`));
  let addedComments = 0;
  for (const group of COMMENTS) {
    const postId = postIdList[group.post];
    for (let j = 0; j < group.items.length; j++) {
      const item = group.items[j];
      const key = `${postId}:${personaIds[item.authorIdx]}:${item.content.slice(0, 40)}`;
      if (commentKeys.has(key)) continue;
      await insertOrThrow(
        "comments",
        {
          post_id: postId,
          author_id: personaIds[item.authorIdx],
          content: item.content,
          created_at: daysAgo(Math.max(0, POSTS[group.post].daysAgo - 1), 10 + j, 30),
        },
        `komentar diskusi #${group.post}`,
      );
      addedComments++;
    }
  }
  console.log(`  komentar baru: ${addedComments}`);

  // -- Likes (reactions) — deterministik: persona ke-i menyukai post tertentu -----------
  const { data: existingReactions } = await db.from("reactions").select("user_id, target_id");
  const reactionSet = new Set((existingReactions ?? []).map((r) => `${r.user_id}:${r.target_id}`));
  let addedLikes = 0;
  for (let i = 0; i < postIdList.length; i++) {
    for (let u = 0; u < personaIds.length; u++) {
      if ((i + u) % 3 === 0) continue; // pola sebaran alami
      const key = `${personaIds[u]}:${postIdList[i]}`;
      if (reactionSet.has(key)) continue;
      await insertOrThrow(
        "reactions",
        {
          user_id: personaIds[u], target_type: "post", target_id: postIdList[i], reaction_type: "like",
          created_at: daysAgo(Math.max(0, POSTS[i].daysAgo), 12, u * 7),
        },
        `reaction post #${i}`,
      );
      addedLikes++;
    }
  }
  console.log(`  like baru: ${addedLikes}`);

  // -- Komentar artikel (2 artikel pertama) -----------------------------------------------
  const { data: existingArticleComments, error: articleCommentErr } = await db
    .from("article_comments")
    .select("article_id, author_id, content");
  if (articleCommentErr) throw new Error(`gagal mengambil komentar artikel: ${articleCommentErr.message}`);
  const articleCommentKeys = new Set(
    (existingArticleComments ?? []).map((c) => `${c.article_id}:${c.author_id}:${c.content.slice(0, 40)}`),
  );
  const articleCommentSeeds = [
    { idx: 0, items: [
      { authorIdx: 4, content: "UUID generator-nya benar-benar sering saya pakai untuk seed data. Fitur favorit satu klik ratusan." },
      { authorIdx: 5, content: "Terima kasih, halaman tools-nya ringan banget dibuka dari HP. Bookmark semua!" },
    ]},
    { idx: 1, items: [
      { authorIdx: 1, content: "Pomodoro itu benar-benar game changer. Sudah saya rekomendasikan ke adik kelas." },
      { authorIdx: 2, content: "Semoga sukses sidangnya kak! Tulisan seperti ini yang bikin semangat mahasiswa tingkat akhir." },
      { authorIdx: 0, content: "Saran: untuk bab metodologi, konverter satuan di sini juga membantu banget soal konversi cm-m responden." },
    ]},
  ];
  for (const group of articleCommentSeeds) {
    const articleId = articleSlugMap.get(ARTICLES[group.idx].title);
    for (let j = 0; j < group.items.length; j++) {
      const item = group.items[j];
      const key = `${articleId}:${personaIds[item.authorIdx]}:${item.content.slice(0, 40)}`;
      if (articleCommentKeys.has(key)) continue;
      await insertOrThrow(
        "article_comments",
        {
          article_id: articleId,
          author_id: personaIds[item.authorIdx],
          content: item.content,
          created_at: daysAgo(Math.max(0, ARTICLES[group.idx].publishedDaysAgo - 1), 11 + j, 20),
        },
        `komentar artikel #${group.idx}`,
      );
    }
  }
  console.log("  komentar artikel: ok");

  // -- Event --------------------------------------------------------------------------------
  for (const e of EVENTS) {
    const slug = slugify(e.title).slice(0, 200);
    const { data: existing } = await db.from("events").select("id").eq("slug", slug).maybeSingle();
    if (existing) continue;
    await insertOrThrow(
      "events",
      {
        organizer_id: personaIds[e.authorIdx],
        title: e.title,
        slug,
        description: e.description,
        format: e.format,
        location: e.location,
        online_url: e.online ? "https://meet.example.com/ruangkumpul-live" : null,
        starts_at: daysAhead(e.daysAhead, 19),
        ends_at: daysAhead(e.daysAhead, 21),
        category: e.category,
        status: "published",
        max_participants: e.max,
        created_at: daysAgo(2),
      },
      `event "${e.title}"`,
    );
  }
  console.log(`  event: ${EVENTS.length}`);

  // -- Pendaftaran event: persona ikut 2 event pertama ---------------------------------------
  const { data: eventRows } = await db.from("events").select("id, slug").order("starts_at", { ascending: true });
  const { data: regRows } = await db.from("event_registrations").select("event_id, user_id");
  const regSet = new Set((regRows ?? []).map((r) => `${r.event_id}:${r.user_id}`));
  let addedRegs = 0;
  for (const ev of (eventRows ?? []).slice(0, 2)) {
    for (let u = 0; u < personaIds.length; u++) {
      if (u % 2 === 0) continue;
      const key = `${ev.id}:${personaIds[u]}`;
      if (regSet.has(key)) continue;
      await insertOrThrow(
        "event_registrations",
        { event_id: ev.id, user_id: personaIds[u] },
        `pendaftaran event ${ev.slug}`,
      );
      addedRegs++;
    }
  }
  console.log(`  pendaftaran event baru: ${addedRegs}`);

  // -- Lowongan -------------------------------------------------------------------------------
  for (const j of JOBS) {
    const slug = slugify(`${j.company} ${j.title}`).slice(0, 200);
    const { data: existing } = await db.from("job_listings").select("id").eq("slug", slug).maybeSingle();
    if (existing) continue;
    await insertOrThrow(
      "job_listings",
      {
        posted_by: personaIds[j.authorIdx],
        company_name: j.company,
        title: j.title,
        slug,
        description: j.description,
        job_type: j.type,
        location: j.location,
        is_remote: j.remote,
        salary_min: j.salaryMin,
        salary_max: j.salaryMax,
        salary_period: j.period,
        apply_url: j.apply,
        status: "published",
        created_at: daysAgo(j.daysAgo, 9, 45),
        updated_at: daysAgo(j.daysAgo, 9, 45),
      },
      `lowongan "${j.title}"`,
    );
  }
  console.log(`  lowongan: ${JOBS.length}`);

  console.log("\n✅ Seeder selesai. Semua konten realistis kini hidup di database.");
  console.log("   Cek: beranda, /artikel, /komunitas, /event, /karier");
}

main().catch((err) => {
  console.error("✗ Seeder gagal:", err.message);
  process.exit(1);
});
