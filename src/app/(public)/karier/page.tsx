import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { JobCard } from "@/modules/careers/components/job-card";
import { JOB_TYPE_LABELS, listPublishedJobsPaginated } from "@/modules/careers/services";
import type { Tables } from "@/types/database";
import { cn, toJsonLd } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Ruang Karier · Lowongan Kerja, Freelance, dan Magang",
  description:
    "Temukan lowongan kerja, proyek freelance, dan magang di Indonesia. Terbaru setiap hari, langsung lamar ke perusahaan.",
  keywords: ["lowongan kerja indonesia", "job vacancy", "freelance indonesia", "lowongan magang"],
  alternates: { canonical: "/karier" },
};

const PAGE_SIZE = 12;

type JobType = Tables<"job_listings">["job_type"];

const TYPE_FILTERS: { value: JobType | ""; label: string }[] = [
  { value: "", label: "Semua" },
  ...(Object.entries(JOB_TYPE_LABELS) as [JobType, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

function isJobType(v: string | undefined): v is JobType {
  return !!v && v in JOB_TYPE_LABELS;
}

async function KarierContent({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string; page?: string }>;
}) {
  const { tipe: tipeParam, page: pageParam } = await searchParams;
  const jobType = isJobType(tipeParam) ? tipeParam : undefined;
  const page = Math.max(1, Math.min(100, Number(pageParam) || 1));

  const { jobs, total } = await listPublishedJobsPaginated({
    page,
    pageSize: PAGE_SIZE,
    jobType,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RuangKumpul Karier",
    url: `${siteConfig.url}/karier`,
  };

  return (
    <div className="animate-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(JSON_LD) }}
      />

      <PageHero
        eyebrow="Ruang Karier"
        title="Temukan pekerjaan berikutnya."
        description="Lowongan kerja, proyek freelance, dan magang dari perusahaan di seluruh Indonesia."
      >
        <Button asChild size="lg" className="bg-white text-brand-800 shadow-lg shadow-brand-950/25 hover:bg-brand-50">
          <Link href="/karier/buat">
            <Plus className="size-5" aria-hidden="true" />
            Pasang Lowongan
          </Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6" aria-labelledby="loker-list">
        <h2 id="loker-list" className="sr-only">Daftar lowongan</h2>

        {/* Filter tipe */}
        <div className="mb-8 flex flex-wrap gap-2 animate-fade-in">
          {TYPE_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={f.value ? `/karier?tipe=${f.value}` : "/karier"}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95",
                (jobType ?? "") === f.value
                  ? "border-brand-800 bg-brand-800 text-white shadow-sm shadow-brand-900/20"
                  : "border-slate-200 bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {jobs.length > 0 ? (
          <>
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

            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath="/karier"
                query={jobType ? { tipe: jobType } : undefined}
                className="mt-10"
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Briefcase}
            title={jobType ? "Belum ada lowongan dengan tipe ini" : "Belum ada lowongan"}
            description={
              jobType
                ? "Coba lihat semua tipe lowongan, lowongan baru masuk setiap hari."
                : "Punya perusahaan atau tahu lowongan? Pasang gratis dan bantu sesama mencari pekerjaan."
            }
            action={
              jobType ? (
                <Link href="/karier" className="text-sm font-semibold text-brand-700 hover:underline">
                  Lihat semua lowongan
                </Link>
              ) : (
                <Link
                  href="/karier/buat"
                  className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-900 active:scale-95"
                >
                  Pasang Lowongan Pertama
                </Link>
              )
            }
          />
        )}
      </section>
    </div>
  );
}

export default function KarierPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <KarierContent searchParams={searchParams} />
    </Suspense>
  );
}
