"use client";

import { Compass, Home, CalendarDays, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/jelajahi", label: "Jelajahi", icon: Compass },
  { href: "/event", label: "Event", icon: CalendarDays },
  { href: "/komunitas", label: "Komunitas", icon: Users },
];

/** Navigasi bawah khusus mobile/tablet (tampil < lg — desktop memakai nav header). */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
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
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all duration-200 active:scale-90",
                  active ? "text-brand-800" : "text-ink-secondary",
                )}
              >
                <item.icon
                  className={cn(
                    "size-5 transition-transform duration-300 ease-out-expo",
                    active ? "-translate-y-0.5 scale-110" : "scale-100",
                  )}
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
