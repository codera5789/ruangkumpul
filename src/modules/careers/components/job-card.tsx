import Link from "next/link";
import { Banknote, Briefcase, MapPin, Wifi } from "lucide-react";
import { formatCompactId, timeAgoId } from "@/lib/utils";
import { JOB_TYPE_LABELS, type JobWithPoster } from "@/modules/careers/services";

function formatSalary(job: JobWithPoster): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) => formatCompactId(n);
  if (job.salary_min && job.salary_max) {
    return `Rp${fmt(job.salary_min)} – Rp${fmt(job.salary_max)} / ${job.salary_period}`;
  }
  const n = job.salary_min ?? job.salary_max!;
  return `Rp${fmt(n)} / ${job.salary_period}`;
}

/** Baris lowongan untuk listing karier. */
export function JobCard({ job }: { job: JobWithPoster }) {
  const salary = formatSalary(job);

  return (
    <Link
      href={`/karier/${job.slug}`}
      className="group flex flex-col gap-3 rounded-card border border-slate-200/80 bg-surface p-5 shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800">
          <Briefcase className="size-3.5" aria-hidden="true" />
          {JOB_TYPE_LABELS[job.job_type]}
        </span>
        {job.is_remote ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Wifi className="size-3.5" aria-hidden="true" />
            Remote
          </span>
        ) : null}
        <span className="ml-auto text-xs text-ink-muted">{timeAgoId(job.created_at)}</span>
      </div>

      <div>
        <h3 className="line-clamp-1 font-bold text-ink group-hover:text-brand-800">{job.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-ink-secondary">{job.company_name}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-secondary">
        {job.location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-ink-muted" aria-hidden="true" />
            {job.location}
          </span>
        ) : null}
        {salary ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
            <Banknote className="size-4" aria-hidden="true" />
            {salary}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
