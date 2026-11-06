import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Panduan Menggunakan RuangKumpul",
  description:
    "Panduan singkat menggunakan RuangKumpul: tools, artikel, komunitas, bookmark, dan akun.",
  alternates: { canonical: "/panduan" },
};

const sections = [
  {
    icon: Wrench,
    title: "1. Gunakan tools tanpa login",
    body: (
      <>
        Buka{" "}
        <Link href="/tools" className="font-semibold text-brand-700 hover:underline">
          halaman Tools
        </Link>
        , pilih tool yang dibutuhkan, dan langsung gunakan. Semua proses
        berjalan di browser kamu — tidak ada data yang dikirim ke server.
      </>
    ),
  },
  {
    icon: BookOpen,
    title: "2. Baca artikel & tutorial",
    body: (
      <>
        Jelajahi{" "}
        <Link href="/artikel" className="font-semibold text-brand-700 hover:underline">
          Ruang Pengetahuan
        </Link>{" "}
        berdasarkan kategori. Komentar terbuka untuk pengguna terdaftar.
      </>
    ),
  },
  {
    icon: Users,
    title: "3. Bergabung dengan komunitas",
    body: (
      <>
        Masuk ke{" "}
        <Link href="/komunitas" className="font-semibold text-brand-700 hover:underline">
          Ruang Komunitas
        </Link>
        , cari komunitas sesuai minatmu, klik Gabung, lalu mulai diskusi atau
        jawab pertanyaan anggota lain.
      </>
    ),
  },
  {
    icon: Compass,
    title: "4. Simpan yang menarik",
    body: (
      <>
        Gunakan fitur bookmark dari dashboard untuk menyimpan artikel dan
        diskusi. Bookmark bersifat privat — hanya kamu yang bisa melihatnya.
      </>
    ),
  },
];

export default function PanduanPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">
        Panduan RuangKumpul
      </h1>
      <p className="mt-4 leading-relaxed text-ink-secondary">
        RuangKumpul dirancang agar bisa langsung dipakai tanpa perlu belajar.
        Panduan ini merangkum cara memanfaatkan setiap ruangnya.
      </p>

      <div className="mt-8 space-y-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-card border border-slate-200/80 bg-surface p-5 shadow-card"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <section.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold text-ink">{section.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
                  {section.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button asChild>
          <Link href="/tools">Mulai dari Tools</Link>
        </Button>
      </div>
    </div>
  );
}
