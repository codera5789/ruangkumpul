"use client";

import { Bell, Bookmark, LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  user: {
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
    email: string;
  };
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profil", label: "Profil Saya", icon: UserRound },
  { href: "/dashboard/bookmark", label: "Bookmark", icon: Bookmark },
  { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Tutup menu saat klik di luar atau tekan Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-full transition-opacity hover:opacity-80"
      >
        <Avatar
          src={user.avatarUrl}
          name={user.fullName || user.username}
          className="size-9"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-slide-up absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-card border border-slate-200 bg-surface shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {user.fullName || user.username}
            </p>
            <p className="truncate text-xs text-ink-secondary">{user.email}</p>
          </div>
          <nav className="p-1.5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {signingOut ? "Keluar..." : "Keluar"}
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
