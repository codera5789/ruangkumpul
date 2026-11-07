import type { Metadata } from "next";
import Link from "next/link";
import { ToolDirectory } from "@/modules/tools/components/tool-directory";
import { TOOL_CATEGORIES, TOOL_COUNT } from "@/modules/tools/tools-registry/registry";

export const metadata: Metadata = {
  title: "Tools Online Gratis — 21+ Tools Praktis Tanpa Login",
  description:
    "Koleksi tools online gratis: penghitung kata, JSON formatter, generator QR code, kompres gambar, gabung PDF, dan lainnya. Semua berjalan di browser, tanpa login.",
  keywords: ["tools online gratis", "web tools indonesia", "tools praktis"],
  alternates: { canonical: "/tools" },
};

export default function ToolsDirectoryPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-accent-600">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-16 size-72 rounded-full bg-accent-400/25 blur-3xl animate-float" />
          <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-brand-300/20 blur-3xl animate-float [animation-delay:-3.5s]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="animate-slide-up-far">
            <p className="text-sm font-semibold text-brand-200">Ruang Tools</p>
            <h1 className="mt-1 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {TOOL_COUNT}+ tools gratis, langsung pakai.
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-brand-100">
              Tidak perlu daftar, tidak perlu install. Semua tool berjalan
              langsung di browser kamu — cepat dan 100% privat.
            </p>
          </div>
        </div>
      </section>

      {/* Direktori dengan pencarian + filter kategori */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ToolDirectory />
      </section>

      {/* Info kategori (SEO) */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-card border border-slate-200/80 bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-ink">Kategori tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOL_CATEGORIES.map((cat) => (
              <div key={cat.slug}>
                <h3 className="font-bold text-brand-800">{cat.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
                  {cat.description}.
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-ink-secondary">
            Tidak menemukan tool yang kamu butuhkan?{" "}
            <Link href="/kontak" className="font-semibold text-brand-700 hover:underline">
              Sarankan tool baru
            </Link>{" "}
            — kami membangun RuangKumpul berdasarkan kebutuhan pengguna.
          </p>
        </div>
      </section>
    </div>
  );
}
