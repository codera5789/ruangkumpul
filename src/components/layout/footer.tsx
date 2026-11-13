import { UsersRound } from "lucide-react";
import Link from "next/link";
import { KumpulMotif } from "@/components/shared/kumpul-motif";
import { NewsletterForm } from "@/modules/newsletter/components/newsletter-form";
import { Reveal } from "@/components/shared/reveal";

const columns = [
  {
    title: "Produk",
    links: [
      { href: "/tools", label: "Tools" },
      { href: "/artikel", label: "Artikel" },
      { href: "/komunitas", label: "Komunitas" },
      { href: "/event", label: "Event" },
      { href: "/karier", label: "Karier" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/jelajahi", label: "Jelajahi" },
    ],
  },
  {
    title: "Dukungan",
    links: [
      { href: "/tentang", label: "Tentang Kami" },
      { href: "/kontak", label: "Kontak" },
      { href: "/panduan", label: "Panduan" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privasi", label: "Kebijakan Privasi" },
      { href: "/syarat", label: "Syarat & Ketentuan" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-surface">
      {/* Watermark motif: identitas tanpa jadi dekorasi berlebihan (DESIGN.md). */}
      <KumpulMotif className="absolute -right-20 -bottom-24 size-80 text-brand-800/5 dark:text-brand-300/10" />

      <Reveal className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1.6fr]">
          {/* Blok brand + newsletter: konten berbeda sifat, bukan kolom kembar. */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-800 text-white">
                <UsersRound className="size-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-ink">
                Ruang<span className="text-brand-800">Kumpul</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-secondary">
              Satu tempat untuk menemukan tools, informasi, komunitas, dan
              peluang digital, gratis untuk semua orang Indonesia.
            </p>
            <div className="max-w-xs space-y-2 pt-2">
              <p className="text-sm font-bold text-ink">Kabar RuangKumpul</p>
              <p className="text-xs leading-relaxed text-ink-secondary">
                Fitur baru dan konten pilihan, sebulan sekali. Tanpa spam.
              </p>
              <NewsletterForm />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="mb-3 text-sm font-bold text-ink">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-block text-sm text-ink-secondary transition-all duration-200 hover:translate-x-1 hover:text-brand-800"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-ink-muted">
            © 2026 RuangKumpul. Dibuat dengan bangga di Indonesia.
          </p>
          <p className="text-xs text-ink-muted">ruangkumpul.my.id</p>
        </div>
      </Reveal>
    </footer>
  );
}
