import { Logo } from "@/components/layout/logo";

/** Placeholder header saat sesi pengguna dimuat (streaming Suspense). */
export function HeaderSkeleton() {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200/80" />
          <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-200/80" />
        </div>
      </div>
    </div>
  );
}
