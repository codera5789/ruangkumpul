import { Compass, Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SearchInput } from "@/components/layout/search-input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/jelajahi", label: "Jelajahi", icon: Compass },
  { href: "/komunitas", label: "Komunitas", icon: Users },
  { href: "/artikel", label: "Artikel" },
  { href: "/tools", label: "Tools" },
  { href: "/event", label: "Event" },
  { href: "/karier", label: "Karier" },
  { href: "/marketplace", label: "Marketplace" },
];

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; full_name: string | null; avatar_url: string | null } | null =
    null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        {/* Navigasi desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-all duration-200 hover:bg-surface-muted hover:text-ink active:scale-[0.96] after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-brand-600 after:transition-transform after:duration-300 after:ease-out-expo hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Pencarian desktop */}
        <div className="hidden min-w-0 flex-1 justify-end md:flex">
          <SearchInput className="max-w-md" />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {user && profile ? (
            <>
              <NotificationBell />
              <UserMenu
                user={{
                  username: profile.username,
                  fullName: profile.full_name,
                  avatarUrl: profile.avatar_url,
                  email: user.email ?? "",
                }}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Daftar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
