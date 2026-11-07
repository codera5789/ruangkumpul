"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Link sidebar dengan indikator halaman aktif (presentational).
 * Aktif = path sama persis atau prefix (mis. /dashboard/artikel/baru).
 */
export function SidebarLink({ href, label, icon: Icon }: SidebarLinkProps) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-0.5 hover:bg-surface hover:text-ink active:translate-x-0",
        active
          ? "bg-surface text-brand-800 shadow-xs"
          : "text-ink-secondary",
      )}
    >
      {/* Indikator aktif */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-700 transition-all duration-300 ease-out-expo",
          active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
        )}
      />
      <Icon
        className={cn(
          "size-4.5 transition-transform duration-200",
          active ? "text-brand-700" : "group-hover:scale-110",
        )}
        aria-hidden="true"
        strokeWidth={active ? 2.4 : 2}
      />
      {label}
    </Link>
  );
}
