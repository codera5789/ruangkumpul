import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Ketentuan penggunaan layanan RuangKumpul.",
  alternates: { canonical: "/syarat" },
};

export default function SyaratPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">
        Syarat &amp; Ketentuan
      </h1>
      <p className="mt-2 text-sm text-ink-muted">Terakhir diperbarui: 7 November 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-secondary">
        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">1. Menerima ketentuan</h2>
          <p>
            Dengan menggunakan RuangKumpul, kamu menyetujui syarat ini. Jika
            tidak setuju, mohon berhenti menggunakan layanan.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">2. Akun pengguna</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Satu orang boleh memiliki satu akun.</li>
            <li>Gunakan username dan konten yang tidak menyesatkan atau melanggar hukum.</li>
            <li>Jaga kerahasiaan password kamu.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">3. Konten pengguna</h2>
          <p>
            Kamu memegang hak atas konten yang kamu buat. Dengan menerbitkannya
            di RuangKumpul, kamu memberi kami izin menampilkannya di platform.
            Dilarang keras memposting: ujaran kebencian, SARA, pornografi,
            penipuan, malware, atau konten ilegal lainnya. Pelanggaran berujung
            penghapusan konten dan/atau penonaktifan akun.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">4. Layanan tools</h2>
          <p>
            Tools disediakan apa adanya (as-is) untuk penggunaan wajar. Kami
            berhak membatasi penggunaan otomatis/abusive yang mengganggu
            layanan bagi pengguna lain.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">5. Batasan tanggung jawab</h2>
          <p>
            RuangKumpul tidak bertanggung jawab atas kerugian tidak langsung
            akibat penggunaan layanan. Layanan disediakan tanpa jaminan
            kesinambungan yang mutlak, meski kami berupaya menjaga
            ketersediaan terbaik.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">6. Perubahan ketentuan</h2>
          <p>
            Ketentuan dapat diperbarui sewaktu-waktu. Perubahan material akan
            diumumkan di halaman ini dan berlaku sejak dipublikasikan.
          </p>
        </section>
      </div>
    </div>
  );
}
