/** Skeleton generik untuk konten halaman yang di-stream via Suspense. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-hidden="true">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-card bg-slate-200/50" />
        ))}
      </div>
    </div>
  );
}
