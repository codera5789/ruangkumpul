import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Bagaimana RuangKumpul mengumpulkan, menggunakan, dan melindungi data kamu.",
  alternates: { canonical: "/privasi" },
};

export default function PrivasiPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">
        Kebijakan Privasi
      </h1>
      <p className="mt-2 text-sm text-ink-muted">Terakhir diperbarui: 7 November 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-secondary">
        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">1. Data yang kami kumpulkan</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-ink">Data akun:</strong> email dan nama
              yang kamu berikan saat mendaftar.
            </li>
            <li>
              <strong className="text-ink">Data profil:</strong> username, bio,
              foto profil, dan informasi yang kamu isi sendiri.
            </li>
            <li>
              <strong className="text-ink">Data konten:</strong> komentar,
              postingan, dan komunitas yang kamu buat.
            </li>
            <li>
              <strong className="text-ink">Data teknis minimum:</strong> tidak
              ada alamat IP yang disimpan dalam log aktivitas tool; penggunaan
              tool dicatat tanpa identitas pribadi.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">2. Tools dan privasi</h2>
          <p>
            Semua tool (word counter, kompres gambar, PDF, dan lainnya) diproses{" "}
            <strong className="text-ink">sepenuhnya di browser kamu</strong>.
            File dan teks yang kamu olah tidak pernah diunggah ke server kami.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">3. Cara kami menggunakan data</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Menjalankan layanan inti: akun, komentar, komunitas, notifikasi.</li>
            <li>Meningkatkan kualitas platform secara agregat dan anonim.</li>
            <li>Keamanan: mencegah penyalahgunaan melalui moderasi dan audit log.</li>
          </ul>
          <p className="mt-2">
            Kami <strong className="text-ink">tidak menjual</strong> data pribadi
            kamu kepada pihak ketiga.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">4. Penyedia pihak ketiga</h2>
          <p>
            Kami menggunakan layanan infrastruktur terpercaya (hosting Vercel,
            database Supabase, autentikasi Google) yang memiliki standar
            keamanan industri. Data hanya dibagikan sebatas yang diperlukan
            untuk menjalankan layanan.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">5. Hak kamu</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Mengubah atau menghapus konten milikmu kapan saja.</li>
            <li>Meminta penghapusan akun beserta datanya melalui halaman kontak.</li>
            <li>Mengunduh konten yang kamu buat.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-ink">6. Kontak</h2>
          <p>
            Pertanyaan tentang privasi:{" "}
            <a
              href="mailto:halo@ruangkumpul.my.id"
              className="font-semibold text-brand-700 hover:underline"
            >
              halo@ruangkumpul.my.id
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
