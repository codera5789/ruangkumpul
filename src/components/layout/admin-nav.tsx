"use client";

import Link from "next/link";
import { BarChart3, Flag, Users, Wrench } from "lucide-react";
import { SidebarLink } from "@/components/layout/sidebar-link";

/**
 * Navigasi admin: sidebar desktop + bottom bar mobile. Client component
 * karena konfigurasi item memuat komponen ikon yang tidak boleh
 * dikirim sebagai props dari Server Component.
 */
const adminNav = [
  { href: "/admin/dashboard", label: "Statistik", icon: BarChart3 },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/konten", label: "Tools & Artikel", icon: Wrench },
  { href: "/admin/moderation", label: "Moderasi", icon: Flag },
];

export function AdminSidebar() {
  return (
    <nav aria-label="Menu admin" className="sticky top-24 space-y-1 animate-fade-in">
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
    <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-surface md:hidden">
      {adminNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-secondary transition-all duration-200 active:scale-90"
        >
          <item.icon className="size-5" aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </div>
  );
}
