"use client";

import {
  Bell,
  Bookmark,
  FileText,
  LayoutDashboard,
  ListTodo,
  NotebookPen,
  Settings,
  Store,
  UserRound,
} from "lucide-react";
import { SidebarLink } from "@/components/layout/sidebar-link";

/**
 * Navigasi sidebar dashboard. Client component karena menerima state
 * pathname dari SidebarLink; konfigurasi item (beserta komponen ikon)
 * tinggal di sini agar tidak menyeberangi batas Server -> Client.
 */
export const dashboardNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profil", label: "Profil Saya", icon: UserRound },
  { href: "/dashboard/artikel", label: "Artikel Saya", icon: FileText },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/catatan", label: "Catatan", icon: NotebookPen },
  { href: "/dashboard/tugas", label: "Tugas", icon: ListTodo },
  { href: "/dashboard/bookmark", label: "Bookmark", icon: Bookmark },
  { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

export function DashboardSidebar() {
  return (
    <nav aria-label="Menu dashboard" className="sticky top-24 space-y-1">
      {dashboardNavItems.map((item) => (
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

/** Baris navigasi horizontal untuk layar sempit (tampil < md, saat sidebar tersembunyi). */
export function DashboardMobileNav() {
  return (
    <nav
      aria-label="Menu dashboard"
      className="mb-6 flex gap-1.5 overflow-x-auto pb-1 md:hidden"
    >
      {dashboardNavItems.map((item) => (
        <span key={item.href} className="shrink-0">
          <SidebarLink href={item.href} label={item.label} icon={item.icon} />
        </span>
      ))}
    </nav>
  );
}
