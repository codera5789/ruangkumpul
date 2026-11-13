"use client";

import Link from "next/link";
import {
  BarChart3,
  Flag,
  ScrollText,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { SidebarLink } from "@/components/layout/sidebar-link";

/**
 * Navigasi admin: sidebar desktop + bottom bar mobile. Client component
 * karena konfigurasi item memuat komponen ikon yang tidak boleh
 * dikirim sebagai props dari Server Component.
 */
const adminNav = [
  { href: "/admin/dashboard", label: "Statistik", icon: BarChart3 },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/konten", label: "Konten", icon: Wrench },
  { href: "/admin/moderation", label: "Moderasi", icon: Flag },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

export function AdminSidebar() {
  return (
    <nav aria-label="Menu admin" className="sticky top-24 space-y-1">
      {adminNav.map((item) => (
        <SidebarLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
        />
      ))}
    </nav>
  );
}

export function AdminMobileNav() {
  return (
    <nav
      aria-label="Menu admin"
      className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-slate-200 bg-surface md:hidden"
    >
      {adminNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-w-17 shrink-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium text-ink-secondary transition-all duration-200 active:scale-90"
        >
          <item.icon className="size-5" aria-hidden="true" />
          <span className="whitespace-nowrap">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
