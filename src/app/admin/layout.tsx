import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Flag, Users, Wrench } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { createClient } from "@/lib/supabase/server";

const adminNav = [
  { href: "/admin/dashboard", label: "Statistik", icon: BarChart3 },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/konten", label: "Tools & Artikel", icon: Wrench },
  { href: "/admin/moderation", label: "Moderasi", icon: Flag },
];

function ShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6" aria-hidden="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="mt-6 h-64 animate-pulse rounded-card bg-slate-200/50" />
    </div>
  );
}

async function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/dashboard");

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-brand-800 px-2.5 py-0.5 text-xs font-bold text-white">
              Admin
            </span>
          </div>
          <Link href="/" className="text-sm font-medium text-ink-secondary hover:text-ink">
            ← Lihat situs
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav aria-label="Menu admin" className="sticky top-24 space-y-1">
            {adminNav.map((item) => (
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

        <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-surface md:hidden">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-secondary"
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>

        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-secondary">
      <Suspense fallback={<ShellSkeleton />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}
