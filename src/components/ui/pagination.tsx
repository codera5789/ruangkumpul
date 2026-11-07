import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Query tambahan yang dipertahankan (mis. q untuk search). */
  query?: Record<string, string>;
  className?: string;
}

function href(basePath: string, page: number, query?: Record<string, string>) {
  const params = new URLSearchParams(query ?? {});
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function pageWindow(page: number, totalPages: number): number[] {
  const window = 2;
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - window; p <= page + window; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}

/** Navigasi halaman untuk listing. Angka tengah, elipsis otomatis. */
export function Pagination({ page, totalPages, basePath, query, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Navigasi halaman" className={cn("flex items-center justify-center gap-1", className)}>
      {page > 1 ? (
        <Link
          href={href(basePath, page - 1, query)}
          aria-label="Halaman sebelumnya"
          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-surface text-ink-secondary transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm active:translate-y-0 active:scale-95"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : null}

      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap ? <span className="px-1 text-ink-muted">…</span> : null}
            <Link
              href={href(basePath, p, query)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Halaman ${p}`}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all duration-200 ease-out-expo",
                p === page
                  ? "border-brand-700 bg-brand-800 text-white shadow-md shadow-brand-900/25"
                  : "border-slate-200 bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm active:translate-y-0 active:scale-95",
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link
          href={href(basePath, page + 1, query)}
          aria-label="Halaman berikutnya"
          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-surface text-ink-secondary transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm active:translate-y-0 active:scale-95"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
