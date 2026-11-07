import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  DashboardMobileNav,
  DashboardSidebar,
} from "@/components/layout/dashboard-sidebar";
import { createClient } from "@/lib/supabase/server";

function ShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6" aria-hidden="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="mt-6 h-64 animate-pulse rounded-card bg-slate-200/50" />
    </div>
  );
}

async function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-medium text-ink-secondary transition-all duration-200 hover:-translate-x-0.5 hover:text-ink sm:block"
            >
              ← Kembali ke beranda
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <DashboardSidebar />
        </aside>

        <main className="min-w-0 flex-1 pb-16 animate-fade-in md:pb-0">
          <DashboardMobileNav />
          {children}
        </main>
      </div>

      <MobileNav />
    </>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-secondary">
      <Suspense fallback={<ShellSkeleton />}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </div>
  );
}
