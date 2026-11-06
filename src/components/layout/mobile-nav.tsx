"use client";

import { Compass, Home, Users, Wrench, PenLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/jelajahi", label: "Jelajahi", icon: Compass },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/artikel", label: "Artikel", icon: PenLine },
  { href: "/komunitas", label: "Komunitas", icon: Users },
];

/** Navigasi bawah khusus mobile (tampil < md). */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-brand-800" : "text-ink-secondary",
                )}
              >
                <item.icon
                  className="size-5"
                  aria-hidden="true"
                  strokeWidth={active ? 2.4 : 2}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
