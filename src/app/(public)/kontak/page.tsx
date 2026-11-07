import type { Metadata } from "next";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi tim RuangKumpul untuk pertanyaan, saran, atau kerja sama.",
  alternates: { canonical: "/kontak" },
};

export default function KontakPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Hubungi kami</h1>
      <p className="mt-4 leading-relaxed text-ink-secondary">
        Ada pertanyaan, saran tool baru, laporan bug, atau tawaran kerja sama?
        Kami senang mendengar dari kamu. Tim kami biasanya membalas dalam 1-2
        hari kerja.
      </p>

      <div className="mt-8 rounded-card border border-slate-200/80 bg-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-ink">Email</h2>
            <a
              href="mailto:halo@ruangkumpul.my.id"
              className="mt-0.5 block text-sm font-semibold text-brand-700 hover:underline"
            >
              halo@ruangkumpul.my.id
            </a>
            <p className="mt-2 text-sm text-ink-secondary">
              Untuk laporan konten yang melanggar, sertakan tautan halaman dan
              penjelasan singkat agar moderasi lebih cepat.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-slate-200/80 bg-surface p-6 shadow-card">
        <h2 className="font-bold text-ink">Saran tool baru</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Punya ide tool yang seharusnya ada di RuangKumpul? Kirim ke email di
          atas dengan subjek <strong className="text-ink">[SARAN TOOL]</strong>{" "}
          : tool dengan permintaan terbanyak akan diprioritaskan dibangun.
        </p>
      </div>
    </div>
  );
}
