import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  Bookmark,
  LayoutDashboard,
  Settings,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profil", label: "Profil Saya", icon: UserRound },
  { href: "/dashboard/bookmark", label: "Bookmark", icon: Bookmark },
  { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-medium text-ink-secondary hover:text-ink sm:block"
            >
              ← Kembali ke beranda
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <nav aria-label="Menu dashboard" className="sticky top-24 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
              >
                <item.icon className="size-4.5" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-16 md:pb-0">{children}</main>
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
