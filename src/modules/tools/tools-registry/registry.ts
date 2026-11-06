/**
 * Registry 21 tools peluncuran RuangKumpul.
 * Sumber kebenaran untuk: direktori /tools, landing page SEO, sitemap,
 * dan seed database. Semua tool berjalan lokal di browser (tanpa upload server).
 */

export type ToolCategorySlug =
  | "teks"
  | "developer"
  | "encoding"
  | "generator"
  | "kalkulator"
  | "produktivitas"
  | "desain"
  | "file";

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  category: ToolCategorySlug;
  icon: string;
  route: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  howTo: string[];
  faqs: ToolFaq[];
}

export const TOOL_CATEGORIES: {
  slug: ToolCategorySlug;
  name: string;
  description: string;
}[] = [
  { slug: "teks", name: "Teks", description: "Tools pengolahan teks sehari-hari" },
  { slug: "developer", name: "Developer", description: "Tools untuk programmer dan developer" },
  { slug: "encoding", name: "Encoding", description: "Encode dan decode berbagai format" },
  { slug: "generator", name: "Generator", description: "Generate QR code, password, dan lainnya" },
  { slug: "kalkulator", name: "Kalkulator", description: "Hitung persen, umur, tanggal, dan satuan" },
  { slug: "produktivitas", name: "Produktivitas", description: "Kelola waktu dan tugas dengan efektif" },
  { slug: "desain", name: "Desain", description: "Warna, gradient, dan kebutuhan desain" },
  { slug: "file", name: "File", description: "Olah gambar dan PDF langsung di browser" },
];

export const TOOLS: ToolDefinition[] = [
  // ── Teks ────────────────────────────────────────────────────────────────
  {
    slug: "word-counter",
    name: "Penghitung Kata",
    description:
      "Hitung jumlah kata, karakter, kalimat, dan paragraf secara real-time. Dilengkapi estimasi waktu baca.",
    category: "teks",
    icon: "FileText",
    route: "/tools/word-counter",
    seoTitle: "Penghitung Kata Online Gratis — Hitung Kata & Karakter",
    seoDescription:
      "Hitung jumlah kata, karakter, kalimat, dan paragraf secara online dan gratis. Tanpa login, hasil real-time, privasi aman karena teks diproses di browser.",
    keywords: ["penghitung kata", "hitung kata online", "word counter indonesia", "hitung karakter"],
    howTo: [
      "Tempel atau ketik teks Anda ke dalam kotak yang tersedia.",
      "Lihat hasil penghitungan kata, karakter, kalimat, dan paragraf secara real-time.",
      "Gunakan informasi waktu baca untuk mengestimasi durasi konten.",
    ],
    faqs: [
      {
        question: "Apakah teks saya tersimpan di server?",
        answer:
          "Tidak. Semua penghitungan dilakukan langsung di browser Anda. Teks tidak pernah dikirim ke server mana pun.",
      },
      {
        question: "Apakah ada batas jumlah kata?",
        answer:
          "Tidak ada batas khusus. Tool ini mampu memproses teks puluhan ribu kata dengan tetap responsif.",
      },
    ],
  },
  {
    slug: "case-converter",
    name: "Konverter Huruf",
    description:
      "Ubah teks ke huruf besar, kecil, Title Case, Sentence case, camelCase, snake_case, dan lainnya sekaligus.",
    category: "teks",
    icon: "CaseSensitive",
    route: "/tools/case-converter",
    seoTitle: "Konverter Huruf Online — UPPERCASE, lowercase, Title Case",
    seoDescription:
      "Konversi teks ke berbagai format huruf: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case. Gratis dan tanpa login.",
    keywords: ["konverter huruf", "uppercase ke lowercase", "title case", "camelCase converter"],
    howTo: [
      "Masukkan teks yang ingin diubah formatnya.",
      "Pilih format huruf yang diinginkan.",
      "Salin hasil konversi dengan satu klik.",
    ],
    faqs: [
      {
        question: "Format huruf apa saja yang didukung?",
        answer:
          "UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, dan aLtErNaTiNg CaSe.",
      },
      {
        question: "Apakah bisa digunakan untuk kode program?",
        answer:
          "Bisa. Format camelCase, PascalCase, snake_case, dan kebab-case sangat berguna untuk penamaan variabel dan file.",
      },
    ],
  },
  {
    slug: "lorem-ipsum",
    name: "Lorem Ipsum",
    description:
      "Generate teks placeholder lorem ipsum sesuai jumlah paragraf, kalimat, atau kata yang dibutuhkan.",
    category: "teks",
    icon: "TextQuote",
    route: "/tools/lorem-ipsum",
    seoTitle: "Generator Lorem Ipsum Indonesia — Teks Placeholder Gratis",
    seoDescription:
      "Generate teks placeholder lorem ipsum untuk desain dan mockup. Atur jumlah paragraf, kalimat, atau kata. Gratis, cepat, tanpa login.",
    keywords: ["lorem ipsum generator", "teks placeholder", "dummy text"],
    howTo: [
      "Tentukan jumlah paragraf atau kata yang dibutuhkan.",
      "Klik tombol Generate untuk membuat teks placeholder.",
      "Salin hasilnya ke desain atau dokumen Anda.",
    ],
    faqs: [
      {
        question: "Apa itu lorem ipsum?",
        answer:
          "Lorem ipsum adalah teks standar industri desain sejak era 1500-an, digunakan sebagai placeholder sebelum konten asli tersedia.",
      },
      {
        question: "Apakah teksnya selalu sama?",
        answer:
          "Tidak, generator menghasilkan variasi acak dari kosakata lorem ipsum klasik sehingga setiap hasil sedikit berbeda.",
      },
    ],
  },

  // ── Developer ───────────────────────────────────────────────────────────
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    description:
      "Format, beautify, dan minify JSON dengan indentasi rapi. Validasi otomatis dengan pesan error yang jelas.",
    category: "developer",
    icon: "Braces",
    route: "/tools/json-formatter",
    seoTitle: "JSON Formatter & Beautify Online — Format JSON Rapi",
    seoDescription:
      "Format dan rapikan JSON online secara gratis. Beautify dengan indentasi 2 atau 4 spasi, minify untuk produksi, dan validasi error otomatis.",
    keywords: ["json formatter", "beautify json", "format json online", "minify json"],
    howTo: [
      "Tempel JSON Anda ke editor.",
      "Pilih indentasi 2 spasi, 4 spasi, atau minify.",
      "Klik Format dan salin hasilnya.",
    ],
    faqs: [
      {
        question: "Apakah JSON saya aman?",
        answer:
          "Aman. Proses formatting sepenuhnya terjadi di browser Anda, tidak ada data yang dikirim ke server.",
      },
      {
        question: "Berapa ukuran JSON maksimal?",
        answer:
          "Tool ini menangani JSON hingga beberapa megabyte dengan nyaman, tergantung perangkat Anda.",
      },
    ],
  },
  {
    slug: "json-validator",
    name: "JSON Validator",
    description:
      "Validasi struktur JSON dengan laporan error lengkap: baris, kolom, dan deskripsi masalahnya.",
    category: "developer",
    icon: "ShieldCheck",
    route: "/tools/json-validator",
    seoTitle: "JSON Validator Online — Cek Validitas JSON",
    seoDescription:
      "Validasi JSON online dengan laporan error detail (baris & kolom). Pastikan JSON Anda valid sebelum dipakai di API atau konfigurasi.",
    keywords: ["json validator", "cek json valid", "json error checker"],
    howTo: [
      "Tempel JSON yang ingin divalidasi.",
      "Klik Validasi untuk memeriksa struktur.",
      "Perbaiki error sesuai laporan baris dan kolom yang ditampilkan.",
    ],
    faqs: [
      {
        question: "Error apa saja yang terdeteksi?",
        answer:
          "Kurung/kurawal tidak tertutup, koma berlebih, tanda kutip tidak valid, tipe data salah, dan kesalahan sintaks lainnya lengkap dengan posisinya.",
      },
      {
        question: "Apa bedanya dengan JSON Formatter?",
        answer:
          "JSON Formatter memfokuskan pada mempercantik tampilan, sedangkan Validator memfokuskan pada pelaporan error yang detail. Keduanya sama-sama memvalidasi.",
      },
    ],
  },
  {
    slug: "uuid-generator",
    name: "Generator UUID",
    description:
      "Generate UUID v4 yang aman secara kriptografis, satu atau banyak sekaligus, siap dipakai untuk ID unik.",
    category: "developer",
    icon: "Fingerprint",
    route: "/tools/uuid-generator",
    seoTitle: "UUID Generator Online — Generate UUID v4 Bulk",
    seoDescription:
      "Generate UUID v4 (random) secara online, satu atau ratusan sekaligus. Menggunakan crypto API browser sehingga hasilnya acak dan aman.",
    keywords: ["uuid generator", "uuid v4", "guid generator online"],
    howTo: [
      "Tentukan jumlah UUID yang ingin dibuat.",
      "Klik Generate.",
      "Salin hasilnya dalam format yang Anda inginkan.",
    ],
    faqs: [
      {
        question: "Seberapa unik UUID v4?",
        answer:
          "UUID v4 memiliki 122 bit random — peluang duplikasi sangat kecil sehingga praktis mustahil terjadi bentrokan.",
      },
      {
        question: "Apakah cocok untuk primary key database?",
        answer:
          "Ya, UUID v4 umum dipakai sebagai primary key, termasuk di Supabase/PostgreSQL, karena tidak mengungkap jumlah record.",
      },
    ],
  },

  // ── Encoding ────────────────────────────────────────────────────────────
  {
    slug: "base64-encoder",
    name: "Base64 Encoder",
    description:
      "Encode teks ke Base64 atau decode Base64 kembali ke teks asli. Mendukung karakter Unicode penuh.",
    category: "encoding",
    icon: "Binary",
    route: "/tools/base64-encoder",
    seoTitle: "Base64 Encode & Decode Online — Gratis dan Aman",
    seoDescription:
      "Konversi teks ke Base64 dan sebaliknya secara online. Mendukung Unicode penuh termasuk emoji. Gratis, tanpa login, diproses di browser.",
    keywords: ["base64 encode", "base64 decode", "base64 converter online"],
    howTo: [
      "Pilih mode Encode (teks ke Base64) atau Decode (Base64 ke teks).",
      "Masukkan teks atau Base64 Anda.",
      "Hasil konversi muncul otomatis, siap disalin.",
    ],
    faqs: [
      {
        question: "Mengapa hasil Base64 saya tidak sesuai harapan?",
        answer:
          "Pastikan mode sudah benar (encode vs decode) dan input Base64 valid. Karakter non-Base64 akan ditandai sebagai error.",
      },
      {
        question: "Apakah Base64 itu enkripsi?",
        answer:
          "Bukan. Base64 hanyalah encoding representasi data — siapa pun bisa meng-decode-nya. Jangan gunakan untuk menyembunyikan data sensitif.",
      },
    ],
  },
  {
    slug: "url-encoder",
    name: "URL Encoder",
    description:
      "Encode atau decode URL (percent-encoding) agar aman dikirim sebagai parameter query.",
    category: "encoding",
    icon: "Link2",
    route: "/tools/url-encoder",
    seoTitle: "URL Encoder & Decoder Online — Percent Encoding",
    seoDescription:
      "Encode dan decode URL online dengan standar percent-encoding. Pastikan parameter query URL Anda valid dan aman.",
    keywords: ["url encoder", "url decoder", "percent encoding online"],
    howTo: [
      "Pilih mode Encode atau Decode.",
      "Masukkan URL atau teks Anda.",
      "Salin hasil konversi.",
    ],
    faqs: [
      {
        question: "Kapan URL perlu di-encode?",
        answer:
          "Saat teks dengan spasi atau karakter khusus (?, &, #, dll.) dikirim sebagai nilai parameter query, agar tidak merusak struktur URL.",
      },
      {
        question: "Apa bedanya encodeURI dan encodeURIComponent?",
        answer:
          "encodeURI mempertahankan karakter struktur URL, sedangkan encodeURIComponent meng-encode semua karakter khusus. Tool ini menyediakan keduanya.",
      },
    ],
  },

  // ── Generator ───────────────────────────────────────────────────────────
  {
    slug: "qr-code-generator",
    name: "Generator QR Code",
    description:
      "Buat QR code dari teks atau link. Atur ukuran dan tingkat koreksi error, lalu unduh sebagai PNG.",
    category: "generator",
    icon: "QrCode",
    route: "/tools/qr-code-generator",
    seoTitle: "QR Code Generator Online Gratis — Buat QR Code PNG",
    seoDescription:
      "Buat QR code untuk link, teks, WiFi, dan lainnya secara gratis. Atur ukuran dan koreksi error, unduh PNG resolusi tinggi tanpa watermark.",
    keywords: ["qr code generator", "buat qr code", "qr code indonesia gratis"],
    howTo: [
      "Masukkan teks atau URL tujuan.",
      "Atur ukuran dan tingkat koreksi error sesuai kebutuhan.",
      "Unduh QR code sebagai gambar PNG.",
    ],
    faqs: [
      {
        question: "Apakah QR code-nya kadaluarsa?",
        answer:
          "Tidak. QR code yang dihasilkan adalah QR statis — isinya tertanam langsung di gambar dan berlaku selamanya.",
      },
      {
        question: "Berapa banyak data yang bisa ditampung?",
        answer:
          "QR code menampung hingga ±4.296 karakter alfanumerik. Semakin panjang data, semakin padat pola titiknya.",
      },
    ],
  },
  {
    slug: "password-generator",
    name: "Generator Password",
    description:
      "Buat password acak yang kuat dengan crypto API browser. Atur panjang dan jenis karakter.",
    category: "generator",
    icon: "KeyRound",
    route: "/tools/password-generator",
    seoTitle: "Password Generator Aman Online — Buat Password Kuat",
    seoDescription:
      "Generate password acak yang kuat dan aman. Atur panjang hingga 64 karakter, sertakan simbol, angka, dan hindari karakter ambigu. Gratis.",
    keywords: ["password generator", "buat password kuat", "password acak aman"],
    howTo: [
      "Atur panjang password (disarankan minimal 16 karakter).",
      "Pilih jenis karakter: huruf besar, kecil, angka, simbol.",
      "Klik Generate dan salin password Anda.",
    ],
    faqs: [
      {
        question: "Apakah password yang dibuat disimpan?",
        answer:
          "Tidak. Password dibuat oleh crypto API di browser Anda dan tidak pernah dikirim atau disimpan di mana pun.",
      },
      {
        question: "Berapa panjang password yang disarankan?",
        answer:
          "Minimal 16 karakter dengan campuran huruf besar, kecil, angka, dan simbol untuk akun penting.",
      },
    ],
  },

  // ── Kalkulator ──────────────────────────────────────────────────────────
  {
    slug: "percentage-calculator",
    name: "Kalkulator Persen",
    description:
      "Hitung persen dari angka, kenaikan/penurunan persen, dan persentase dari dua nilai dengan cepat.",
    category: "kalkulator",
    icon: "Percent",
    route: "/tools/percentage-calculator",
    seoTitle: "Kalkulator Persen Online — Hitung Persen Cepat",
    seoDescription:
      "Kalkulator persen lengkap: X% dari Y, berapa persen X dari Y, serta kenaikan dan penurunan persen. Gratis dan mudah digunakan.",
    keywords: ["kalkulator persen", "hitung persen", "cara hitung persen"],
    howTo: [
      "Pilih jenis perhitungan persen yang dibutuhkan.",
      "Masukkan angka-angkanya.",
      "Hasil perhitungan muncul otomatis.",
    ],
    faqs: [
      {
        question: "Bagaimana menghitung kenaikan persen?",
        answer:
          "Rumusnya: ((nilai baru − nilai lama) ÷ nilai lama) × 100%. Tool ini menghitungnya otomatis untuk Anda.",
      },
      {
        question: "Apakah mendukung desimal?",
        answer: "Ya, semua input menerima angka desimal.",
      },
    ],
  },
  {
    slug: "age-calculator",
    name: "Kalkulator Umur",
    description:
      "Hitung umur persis dari tanggal lahir: tahun, bulan, hari, hingga total hari hidup.",
    category: "kalkulator",
    icon: "Cake",
    route: "/tools/age-calculator",
    seoTitle: "Kalkulator Umur Online — Hitung Usia dari Tanggal Lahir",
    seoDescription:
      "Hitung umur Anda secara detail dari tanggal lahir: tahun, bulan, hari, dan total hari hidup. Cepat, gratis, tanpa login.",
    keywords: ["kalkulator umur", "hitung umur", "usia calculator"],
    howTo: [
      "Pilih tanggal lahir Anda.",
      "Klik Hitung.",
      "Lihat detail umur: tahun, bulan, hari, dan total hari hidup.",
    ],
    faqs: [
      {
        question: "Apakah data tanggal lahir saya dikirim ke server?",
        answer:
          "Tidak. Perhitungan dilakukan sepenuhnya di browser Anda.",
      },
      {
        question: "Apakah perhitungannya memperhitungkan tahun kabisat?",
        answer: "Ya, kalkulator menggunakan perbandingan tanggal kalender yang akurat termasuk tahun kabisat.",
      },
    ],
  },
  {
    slug: "date-calculator",
    name: "Kalkulator Tanggal",
    description:
      "Hitung selisih hari antara dua tanggal, atau tambah/kurangi hari dari tanggal tertentu.",
    category: "kalkulator",
    icon: "CalendarDays",
    route: "/tools/date-calculator",
    seoTitle: "Kalkulator Selisih Tanggal Online — Hitung Hari",
    seoDescription:
      "Hitung selisih hari, minggu, dan bulan antara dua tanggal, atau tambah/kurangi hari dari tanggal tertentu. Gratis dan akurat.",
    keywords: ["kalkulator tanggal", "selisih tanggal", "hitung hari"],
    howTo: [
      "Pilih mode: selisih dua tanggal atau tambah/kurangi hari.",
      "Masukkan tanggal yang diperlukan.",
      "Hasil perhitungan ditampilkan seketika.",
    ],
    faqs: [
      {
        question: "Apakah hari akhir pekan ikut dihitung?",
        answer:
          "Ya, selisih kalender menghitung semua hari. Untuk hari kerja, gunakan indikator Sabtu-Minggu yang ditampilkan pada hasil.",
      },
      {
        question: "Format tanggal apa yang digunakan?",
        answer: "Tool menggunakan pemilih tanggal kalender sehingga tidak ada kebingungan format.",
      },
    ],
  },
  {
    slug: "unit-converter",
    name: "Konversi Satuan",
    description:
      "Konversi satuan panjang, berat, suhu, dan data digital dalam satu tempat.",
    category: "kalkulator",
    icon: "Ruler",
    route: "/tools/unit-converter",
    seoTitle: "Konversi Satuan Online — Panjang, Berat, Suhu, Data",
    seoDescription:
      "Konverter satuan lengkap: meter, kilogram, Celsius/Fahrenheit, KB/MB/GB, dan lainnya. Cepat, akurat, gratis.",
    keywords: ["konversi satuan", "konverter ukuran", "konversi celsius fahrenheit"],
    howTo: [
      "Pilih kategori satuan (panjang, berat, suhu, atau data).",
      "Masukkan nilai dan pilih satuan asal serta tujuan.",
      "Hasil konversi muncul otomatis.",
    ],
    faqs: [
      {
        question: "Satuan apa saja yang didukung?",
        answer:
          "Panjang (mm–km, inci, mil), berat (mg–ton, ounce, pound), suhu (Celsius, Fahrenheit, Kelvin), dan data digital (byte–TB).",
      },
      {
        question: "Seberapa akurat konversinya?",
        answer: "Konversi menggunakan faktor standar internasional dengan pembulatan hingga 6 desimal.",
      },
    ],
  },

  // ── Produktivitas ───────────────────────────────────────────────────────
  {
    slug: "pomodoro-timer",
    name: "Timer Pomodoro",
    description:
      "Timer pomodoro 25 menit dengan istirahat otomatis. Tingkatkan fokus kerja dan belajar Anda.",
    category: "produktivitas",
    icon: "Timer",
    route: "/tools/pomodoro-timer",
    seoTitle: "Timer Pomodoro Online Gratis — Fokus 25 Menit",
    seoDescription:
      "Timer pomodoro online dengan siklus fokus 25 menit dan istirahat 5 menit yang dapat diatur. Gratis, tanpa instalasi, dengan notifikasi suara.",
    keywords: ["pomodoro timer", "timer fokus", "teknik pomodoro online"],
    howTo: [
      "Atur durasi fokus dan istirahat sesuai keinginan.",
      "Klik Mulai dan kerjakan satu tugas hingga timer berbunyi.",
      "Ambil istirahat saat diminta, lalu ulangi siklusnya.",
    ],
    faqs: [
      {
        question: "Apa itu teknik pomodoro?",
        answer:
          "Teknik manajemen waktu dengan siklus fokus 25 menit dan istirahat 5 menit, terbukti membantu konsentrasi dan mencegah kelelahan.",
      },
      {
        question: "Apakah timer tetap jalan jika tab pindah?",
        answer:
          "Ya, timer berjalan berdasarkan waktu nyata sehingga tetap akurat meski Anda berpindah tab.",
      },
    ],
  },
  {
    slug: "checklist",
    name: "Checklist Harian",
    description:
      "Buat daftar tugas harian yang tersimpan otomatis di browser Anda. Sederhana dan cepat.",
    category: "produktivitas",
    icon: "ListChecks",
    route: "/tools/checklist",
    seoTitle: "Checklist Online — Daftar Tugas Harian Sederhana",
    seoDescription:
      "Buat dan kelola checklist tugas harian langsung di browser. Tersimpan otomatis, tanpa login, tanpa iklan.",
    keywords: ["checklist online", "to do list sederhana", "daftar tugas harian"],
    howTo: [
      "Tulis tugas baru lalu tekan Enter.",
      "Centang tugas yang sudah selesai.",
      "Hapus tugas yang tidak diperlukan kapan saja.",
    ],
    faqs: [
      {
        question: "Di mana data tugas saya disimpan?",
        answer:
          "Di penyimpanan lokal (localStorage) browser Anda. Tidak dikirim ke server, tetapi akan hilang jika Anda menghapus data browser.",
      },
      {
        question: "Bisa sinkron antar perangkat?",
        answer:
          "Untuk sinkronisasi antar perangkat, gunakan fitur bookmark dan akun RuangKumpul (akan hadir).",
      },
    ],
  },

  // ── Desain ──────────────────────────────────────────────────────────────
  {
    slug: "color-picker",
    name: "Color Picker",
    description:
      "Pilih warna dan dapatkan kode HEX, RGB, dan HSL sekaligus. Simpan palet warna favorit.",
    category: "desain",
    icon: "Palette",
    route: "/tools/color-picker",
    seoTitle: "Color Picker Online — Kode HEX, RGB, HSL",
    seoDescription:
      "Pilih warna dan konversi ke kode HEX, RGB, dan HSL sekaligus. Lihat preview langsung dan salin kode dengan satu klik.",
    keywords: ["color picker", "kode warna hex", "konversi rgb hex"],
    howTo: [
      "Pilih warna dari pemilih warna atau masukkan kode HEX.",
      "Lihat konversi otomatis ke RGB dan HSL.",
      "Salin kode warna yang Anda butuhkan.",
    ],
    faqs: [
      {
        question: "Format warna apa yang tersedia?",
        answer: "HEX, RGB, dan HSL — semuanya dihitung otomatis dari satu pilihan warna.",
      },
      {
        question: "Bisakah menyimpan beberapa warna?",
        answer: "Bisa, gunakan fitur palet untuk menyimpan dan membandingkan beberapa warna.",
      },
    ],
  },
  {
    slug: "gradient-generator",
    name: "Generator Gradient",
    description:
      "Buat gradient CSS linear dan radial yang indah. Salin kode CSS siap pakai.",
    category: "desain",
    icon: "Blend",
    route: "/tools/gradient-generator",
    seoTitle: "CSS Gradient Generator Online — Kode Gradient Siap Pakai",
    seoDescription:
      "Buat gradient CSS linear dan radial dengan preview real-time. Salin kode CSS langsung untuk website Anda. Gratis.",
    keywords: ["css gradient generator", "gradient warna css", "linear gradient online"],
    howTo: [
      "Pilih dua warna ujung gradient.",
      "Atur arah dan tipe (linear atau radial).",
      "Salin kode CSS yang dihasilkan.",
    ],
    faqs: [
      {
        question: "Gradient bisa dipakai di mana?",
        answer:
          "Di mana saja CSS didukung: background website, tombol, kartu, banner, aplikasi, dan lainnya.",
      },
      {
        question: "Apakah mendukung lebih dari 2 warna?",
        answer:
          "Untuk MVP, tool mendukung 2 warna dengan kontrol arah penuh. Warna tambahan akan hadir berikutnya.",
      },
    ],
  },

  // ── File ────────────────────────────────────────────────────────────────
  {
    slug: "image-compressor",
    name: "Kompres Gambar",
    description:
      "Kompres JPG dan PNG langsung di browser tanpa upload. Atur kualitas, lihat perbandingan ukuran.",
    category: "file",
    icon: "ImageDown",
    route: "/tools/image-compressor",
    seoTitle: "Kompres Gambar Online — JPG & PNG Tanpa Upload",
    seoDescription:
      "Kompres gambar JPG dan PNG langsung di browser tanpa diunggah ke server. Atur kualitas, hemat hingga 90% ukuran file. Gratis dan privat.",
    keywords: ["kompres gambar", "compress jpg online", "perkecil ukuran foto"],
    howTo: [
      "Pilih atau seret gambar JPG/PNG Anda.",
      "Atur tingkat kualitas kompresi.",
      "Unduh hasilnya yang lebih ringan.",
    ],
    faqs: [
      {
        question: "Apakah gambar saya diunggah ke server?",
        answer:
          "Tidak sama sekali. Kompresi memakai canvas API browser, gambar tidak pernah meninggalkan perangkat Anda.",
      },
      {
        question: "Berapa ukuran maksimal gambar?",
        answer:
          "Disarankan hingga 20 MB per file. Batas yang jelas ditampilkan di antarmuka agar proses tetap cepat.",
      },
    ],
  },
  {
    slug: "pdf-merge",
    name: "Gabung PDF",
    description:
      "Gabungkan beberapa file PDF menjadi satu dokumen, langsung di browser tanpa upload.",
    category: "file",
    icon: "Files",
    route: "/tools/pdf-merge",
    seoTitle: "Gabung PDF Online Gratis — Merge PDF Tanpa Upload",
    seoDescription:
      "Gabungkan file PDF menjadi satu dokumen langsung di browser. File tidak diunggah ke server — 100% privat. Atur urutan halaman dengan mudah.",
    keywords: ["gabung pdf", "merge pdf online", "cara menggabungkan pdf"],
    howTo: [
      "Pilih dua file PDF atau lebih.",
      "Susun urutan file sesuai keinginan.",
      "Klik Gabung dan unduh PDF hasilnya.",
    ],
    faqs: [
      {
        question: "Apakah PDF saya aman?",
        answer:
          "Aman. Penggabungan dilakukan di browser dengan pdf-lib; file Anda tidak pernah dikirim ke server mana pun.",
      },
      {
        question: "Berapa banyak file yang bisa digabung?",
        answer:
          "Hingga 10 file dengan total 50 MB per proses, tergantung kapabilitas perangkat Anda.",
      },
    ],
  },
  {
    slug: "pdf-split",
    name: "Pisah PDF",
    description:
      "Ekstrak halaman tertentu dari PDF atau pisahkan menjadi beberapa file, langsung di browser.",
    category: "file",
    icon: "Scissors",
    route: "/tools/pdf-split",
    seoTitle: "Pisah PDF Online — Ekstrak Halaman PDF Tanpa Upload",
    seoDescription:
      "Pisahkan dan ekstrak halaman dari file PDF langsung di browser. Pilih rentang halaman, unduh hasilnya. 100% privat, gratis.",
    keywords: ["pisah pdf", "ekstrak halaman pdf", "split pdf online"],
    howTo: [
      "Pilih file PDF Anda.",
      "Tentukan halaman atau rentang halaman yang ingin diekstrak.",
      "Klik Pisah dan unduh hasilnya.",
    ],
    faqs: [
      {
        question: "Bagaimana format rentang halamannya?",
        answer:
          "Gunakan angka dan tanda hubung, misalnya 1-3, 5, 8-10 untuk mengambil halaman 1 sampai 3, 5, dan 8 sampai 10.",
      },
      {
        question: "Apakah kualitas PDF berkurang?",
        answer:
          "Tidak. Halaman dipisahkan tanpa re-kompresi sehingga kualitas asli tetap utuh.",
      },
    ],
  },
];

export const TOOL_COUNT = TOOLS.length;

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategorySlug): ToolDefinition[] {
  return TOOLS.filter((t) => t.category === category);
}

export function getCategoryBySlug(slug: string) {
  return TOOL_CATEGORIES.find((c) => c.slug === slug);
}

/** Tool yang ditampilkan unggulan di homepage. */
export const FEATURED_TOOL_SLUGS = [
  "word-counter",
  "qr-code-generator",
  "json-formatter",
  "password-generator",
  "image-compressor",
  "pdf-merge",
  "pomodoro-timer",
  "color-picker",
] as const;
