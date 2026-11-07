import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KumpulMotif } from "@/components/shared/kumpul-motif";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Tentang RuangKumpul",
  description: siteConfig.description,
  alternates: { canonical: "/tentang" },
};

const pillars = [
  {
    icon: Compass,
    title: "Tools gratis",
    description:
      "21+ tools praktis yang berjalan langsung di browser: privat, cepat, tanpa login.",
  },
  {
    icon: BookOpen,
    title: "Pengetahuan terbuka",
    description:
      "Artikel dan tutorial dari kontributor yang peduli dengan perkembangan skill masyarakat Indonesia.",
  },
  {
    icon: Users,
    title: "Komunitas yang sehat",
    description:
      "Ruang diskusi yang dimoderasi: tempat bertanya, berbagi, dan terhubung dengan sesama.",
  },
];

export default function TentangPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-balance text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Tentang RuangKumpul
      </h1>

      <p className="mt-5 text-pretty leading-relaxed text-ink-secondary">
        <strong className="text-ink">{siteConfig.name}</strong> adalah platform digital lengkap untuk masyarakat Indonesia: satu tempat untuk
        menemukan tools, mendapatkan informasi, belajar, berbagi ide, membangun
        komunitas, dan menemukan berbagai peluang digital.
      </p>

      <p className="mt-4 text-pretty leading-relaxed text-ink-secondary">
        Kami percaya internet Indonesia layak mendapatkan produk yang bagus:
        cepat, gratis dari halangan, menghormati privasi, dan dalam Bahasa
        Indonesia. Misi kami sederhana: membuat pengguna punya alasan untuk
        kembali setiap hari karena semuanya berguna.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-card border border-slate-200/80 bg-surface p-5 shadow-card"
          >
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-800 text-white">
              <pillar.icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="font-bold text-ink">{pillar.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-extrabold text-ink">Prinsip produk kami</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-secondary">
        <li>
          <strong className="text-ink">Useful first</strong>: manfaat nyata
          bahkan tanpa registrasi.
        </li>
        <li>
          <strong className="text-ink">Discoverable</strong>: setiap konten
          mudah ditemukan lewat mesin pencari.
        </li>
        <li>
          <strong className="text-ink">Fast &amp; accessible</strong>: ringan
          di perangkat apa pun, ramah semua kalangan.
        </li>
        <li>
          <strong className="text-ink">Privacy-respecting</strong>: data
          pribadi minimum, proses lokal bila memungkinkan.
        </li>
        <li>
          <strong className="text-ink">Community-driven</strong>: dikembangkan
          berdasarkan umpan balik pengguna.
        </li>
      </ol>

      <div className="relative mt-12 overflow-hidden rounded-card bg-brand-900 p-8 text-center">
        <KumpulMotif className="absolute -top-16 -right-12 size-56 text-brand-300/15" />
        <KumpulMotif className="absolute -bottom-20 -left-12 size-64 text-brand-300/10" />
        <h2 className="text-xl font-extrabold text-white">Ikut tumbuh bersama kami</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-brand-100">
          Daftar gratis, bergabung ke komunitas, atau berkontribusi menulis
          artikel.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-white text-brand-800 hover:bg-brand-50">
            <Link href="/register">Daftar Gratis</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/kontak">Hubungi Kami</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
