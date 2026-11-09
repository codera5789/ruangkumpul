import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Banknote,
  Briefcase,
  Bookmark,
  ChevronRight,
  ExternalLink,
  MapPin,
  Trash2,
  Wifi,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/shared/bookmark-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { createClient } from "@/lib/supabase/server";
import { formatDateId, formatCompactId, toJsonLd } from "@/lib/utils";
import { actionCloseJob } from "@/modules/careers/actions";
import { JOB_TYPE_LABELS, getJobBySlug } from "@/modules/careers/services";

interface JobDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: "Lowongan tidak ditemukan" };

  return {
    title: `${job.title} di ${job.company_name}`,
    description: job.description.slice(0, 160),
    alternates: { canonical: `/karier/${job.slug}` },
    openGraph: {
      title: `${job.title} · ${job.company_name}`,
      description: job.description.slice(0, 160),
      url: `/karier/${job.slug}`,
      type: "article",
    },
  };
}

function formatSalary(job: NonNullable<Awaited<ReturnType<typeof getJobBySlug>>>): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) => formatCompactId(n);
  if (job.salary_min && job.salary_max) {
    return `Rp${fmt(job.salary_min)} – Rp${fmt(job.salary_max)} / ${job.salary_period}`;
  }
  const n = job.salary_min ?? job.salary_max!;
  return `Rp${fmt(n)} / ${job.salary_period}`;
}

async function JobDetailContent({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = Boolean(user && job.posted_by === user.id);
  const salary = formatSalary(job);
  const posterName = job.profiles?.full_name || job.profiles?.username || "Pengguna";

  // Google Jobs memakai enum schema.org, bukan enum internal (full_time, dst).
  const employmentType: Record<string, string> = {
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    contract: "CONTRACTOR",
    freelance: "CONTRACTOR",
    internship: "INTERN",
  };
  const salaryUnit: Record<string, string> = {
    bulan: "MONTH",
    tahun: "YEAR",
    proyek: "OTHER",
    jam: "HOUR",
  };

  const jobJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    validThrough: job.expires_at ?? undefined,
    employmentType: employmentType[job.job_type] ?? job.job_type,
    hiringOrganization: { "@type": "Organization", name: job.company_name },
    jobLocationType: job.is_remote ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: job.is_remote
      ? { "@type": "Country", name: "Indonesia" }
      : undefined,
    jobLocation: !job.is_remote && job.location
      ? {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "ID" },
        }
      : undefined,
    baseSalary: salary
      ? {
          "@type": "MonetaryAmount",
          currency: "IDR",
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salary_min ?? undefined,
            maxValue: job.salary_max ?? undefined,
            unitText: salaryUnit[job.salary_period] ?? job.salary_period,
          },
        }
      : undefined,
  };

  return (
    <div className="animate-slide-up-far">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jobJsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-6 text-sm text-ink-secondary sm:px-6"
      >
        <Link href="/" className="hover:text-brand-800">Beranda</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <Link href="/karier" className="hover:text-brand-800">Karier</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <span className="truncate font-medium text-ink">{job.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{JOB_TYPE_LABELS[job.job_type]}</Badge>
          {job.is_remote ? (
            <Badge variant="success">
              <Wifi className="size-3" aria-hidden="true" />
              Remote
            </Badge>
          ) : null}
          {job.status === "closed" ? <Badge variant="danger">Ditutup</Badge> : null}
          <div className="ml-auto">
            <BookmarkButton resourceType="job" resourceId={job.id} isLoggedIn={Boolean(user)} />
          </div>
        </div>

        <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink">
          {job.title}
        </h1>
        <p className="mt-1 text-lg font-semibold text-ink-secondary">{job.company_name}</p>

        <Card className="mt-5 p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {job.location ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-ink-secondary">
                <MapPin className="size-4 text-ink-muted" aria-hidden="true" />
                {job.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-secondary">
              <Briefcase className="size-4 text-ink-muted" aria-hidden="true" />
              {JOB_TYPE_LABELS[job.job_type]}
            </span>
            {salary ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <Banknote className="size-4" aria-hidden="true" />
                {salary}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <Bookmark className="size-4" aria-hidden="true" />
              Dipasang {formatDateId(job.created_at, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {job.status === "published" ? (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <Button asChild size="lg" className="w-full">
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer nofollow">
                  Lamar Sekarang
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <p className="mt-2 text-center text-xs text-ink-muted">
                Kamu akan diarahkan ke situs luaran perusahaan.
              </p>
            </div>
          ) : null}

          {isOwner ? (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm text-ink-secondary">Kamu memasang lowongan ini.</p>
              {job.status === "published" ? (
                <form action={actionCloseJob}>
                  <input type="hidden" name="jobSlug" value={job.slug} />
                  <Button type="submit" variant="outline" size="sm">
                    Tutup Lowongan
                  </Button>
                </form>
              ) : (
                <form action={actionCloseJob}>
                  <input type="hidden" name="jobSlug" value={job.slug} />
                  <Button type="submit" variant="ghost" size="sm" className="text-ink-muted">
                    <Trash2 className="size-4" aria-hidden="true" />
                    Sudah ditutup
                  </Button>
                </form>
              )}
            </div>
          ) : null}
        </Card>

        <div className="mt-6 space-y-4">
          {job.description.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="text-pretty leading-relaxed whitespace-pre-wrap text-ink-secondary">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-card border border-slate-200/80 bg-surface p-4">
          <Avatar src={job.profiles?.avatar_url} name={posterName} className="size-10" />
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">Dipasang oleh</p>
            <Link
              href={`/pengguna/${job.profiles?.username}`}
              className="text-sm font-bold text-ink hover:underline"
            >
              {posterName}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  return (
    <Suspense fallback={<PageSkeleton cards={1} />}>
      <JobDetailContent params={params} />
    </Suspense>
  );
}
