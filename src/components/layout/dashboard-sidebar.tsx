"use client";

import {
  Bell,
  Bookmark,
  FileText,
  LayoutDashboard,
  ListTodo,
  NotebookPen,
  Settings,
  UserRound,
} from "lucide-react";
import { SidebarLink } from "@/components/layout/sidebar-link";

/**
 * Navigasi sidebar dashboard. Client component karena menerima state
 * pathname dari SidebarLink; konfigurasi item (beserta komponen ikon)
 * tinggal di sini agar tidak menyeberangi batas Server -> Client.
 */
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profil", label: "Profil Saya", icon: UserRound },
  { href: "/dashboard/artikel", label: "Artikel Saya", icon: FileText },
  { href: "/dashboard/catatan", label: "Catatan", icon: NotebookPen },
  { href: "/dashboard/tugas", label: "Tugas", icon: ListTodo },
  { href: "/dashboard/bookmark", label: "Bookmark", icon: Bookmark },
  { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

export function DashboardSidebar() {
  return (
    <nav aria-label="Menu dashboard" className="sticky top-24 space-y-1 animate-fade-in">
      {navItems.map((item) => (
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
