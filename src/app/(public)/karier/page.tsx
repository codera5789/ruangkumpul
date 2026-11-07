import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { JobCard } from "@/modules/careers/components/job-card";
import { listPublishedJobs } from "@/modules/careers/services";

export const metadata: Metadata = {
  title: "Ruang Karier — Lowongan Kerja, Freelance, dan Magang",
  description:
    "Temukan lowongan kerja, proyek freelance, dan magang di Indonesia. Terbaru setiap hari, langsung lamar ke perusahaan.",
  keywords: ["lowongan kerja indonesia", "job vacancy", "freelance indonesia", "lowongan magang"],
  alternates: { canonical: "/karier" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RuangKumpul Karier",
  url: "https://ruangkumpul.my.id/karier",
};

async function KarierContent() {
  const jobs = await listPublishedJobs(30);

  return (
    <div className="animate-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-accent-600">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-16 size-72 rounded-full bg-accent-400/25 blur-3xl animate-float" />
          <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-brand-300/20 blur-3xl animate-float [animation-delay:-3.5s]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6 animate-slide-up-far">
            <div>
              <p className="text-sm font-semibold text-brand-200">Ruang Karier</p>
              <h1 className="mt-1 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Temukan pekerjaan berikutnya.
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-brand-100">
                Lowongan kerja, proyek freelance, dan magang dari perusahaan di seluruh Indonesia.
              </p>
            </div>
            <Button asChild size="lg" className="bg-white text-brand-800 shadow-lg shadow-brand-950/25 hover:bg-brand-50">
              <Link href="/karier/buat">
                <Plus className="size-5" aria-hidden="true" />
                Pasang Lowongan
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6" aria-labelledby="loker-list">
        <h2 id="loker-list" className="sr-only">Daftar lowongan</h2>
        {jobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((job, i) => (
              <div
                key={job.id}
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                className="animate-slide-up-far"
              >
                <JobCard job={job} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-16 text-center animate-slide-up-far">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 animate-pop-in">
              <Briefcase className="size-6" aria-hidden="true" />
            </span>
            <p className="font-semibold text-ink">Belum ada lowongan</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
              Punya perusahaan atau tahu lowongan? Pasang gratis dan bantu sesama mencari pekerjaan.
            </p>
            <Button asChild className="mt-4">
              <Link href="/karier/buat">Pasang Lowongan Pertama</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function KarierPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <KarierContent />
    </Suspense>
  );
}
