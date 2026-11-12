/** Skeleton transisi antar halaman dashboard (instant loading state). */
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto w-full max-w-3xl animate-fade-in px-4 py-10 sm:px-6"
      aria-hidden="true"
      aria-busy="true"
    >
      <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-200/60" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-card bg-surface shadow-card" />
        <div className="h-28 animate-pulse rounded-card bg-surface shadow-card" />
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-card bg-surface shadow-card" />
    </div>
  );
}
