## Deskripsi Perubahan
<!-- Jelaskan secara ringkas perubahan yang dilakukan dan mengapa perubahan ini diperlukan. -->

## Tipe Perubahan
- [ ] `feat`: Fitur atau tool baru
- [ ] `fix`: Perbaikan bug atau celah keamanan
- [ ] `docs`: Pembaruan dokumentasi atau panduan
- [ ] `style`: Penyesuaian antarmuka/desain (wajib merujuk DESIGN.md)
- [ ] `refactor`: Refaktorisasi kode tanpa mengubah fungsionalitas
- [ ] `test`: Penambahan atau perbaikan unit test / SQL test
- [ ] `chore`: Pemeliharaan build, dependensi, atau konfigurasi CI

## Terkait dengan Issue
<!-- Contoh: Fixes #123 atau Relates to #456 -->
Fixes / Relates to: 

## Daftar Periksa (Checklist)
Pastikan seluruh poin berikut terpenuhi sebelum meminta review:
- [ ] Mengikuti konvensi kode proyek, prinsip DRY (*Rule of Three*), dan standar TypeScript ketat.
- [ ] Sudah menggunakan helper bersama di `src/lib/` dan komponen `src/components/ui/` (tanpa duplikasi validasi/boilerplate baru).
- [ ] Berjalan bersih pada `npx tsc --noEmit` (tanpa error tipe).
- [ ] Berjalan bersih pada `npm run lint` (tanpa pelanggaran lint).
- [ ] Pengujian lolos melalui `npm test` (unit test & PGlite SQL smoke test).
- [ ] Mematuhi aturan desain di `DESIGN.md` (jika mengubah UI).
- [ ] Sudah diuji manual di peramban lokal (desktop dan mobile responsive).
- [ ] Tidak memasukkan kredensial rahasia atau berkas `.env.local`.

## Tangkapan Layar / Bukti Visual (Jika Relevan)
<!-- Lampirkan tangkapan layar tampilan sebelum dan sesudah jika ada perubahan UI -->
| Sebelum | Sesudah |
| --- | --- |
| *(opsional)* | *(opsional)* |
