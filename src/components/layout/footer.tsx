import { UsersRound } from "lucide-react";
import Link from "next/link";

const columns = [
  {
    title: "Produk",
    links: [
      { href: "/tools", label: "Tools" },
      { href: "/artikel", label: "Artikel" },
      { href: "/komunitas", label: "Komunitas" },
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
    <footer className="border-t border-slate-200/80 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
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
              peluang digital — gratis untuk semua orang Indonesia.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-3 text-sm font-bold text-ink">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-secondary transition-colors hover:text-brand-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-ink-muted">
            © 2026 RuangKumpul. Dibuat dengan bangga di Indonesia.
          </p>
          <p className="text-xs text-ink-muted">ruangkumpul.my.id</p>
        </div>
      </div>
    </footer>
  );
}
