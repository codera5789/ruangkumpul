import Link from "next/link";
import type { Metadata } from "next";
import {
  Briefcase,
  CalendarDays,
  FileText,
  Flag,
  Mail,
  MessageSquare,
  ScrollText,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCompactId, timeAgoId } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Statistik" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: profileCount },
    { count: toolCount },
    { count: articleCount },
    { count: communityCount },
    { count: postCount },
    { count: pendingReports },
    { count: eventCount },
    { count: jobCount },
    { count: marketplaceCount },
    { count: newsletterCount },
    { data: recentUsers },
    { data: recentAudits },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tools").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("communities").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("job_listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("marketplace_products")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id, username, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("audit_logs")
      .select("id, action, resource_type, created_at, profiles (username)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const stats = [
    { label: "Pengguna", value: profileCount ?? 0, icon: Users, href: "/admin/users" },
    { label: "Pelanggan newsletter", value: newsletterCount ?? 0, icon: Mail, href: "/admin/users?tab=newsletter" },
    { label: "Tools", value: toolCount ?? 0, icon: Wrench, href: "/admin/konten?tab=tools" },
    { label: "Artikel", value: articleCount ?? 0, icon: FileText, href: "/admin/konten?tab=artikel" },
    { label: "Komunitas", value: communityCount ?? 0, icon: Users, href: "/admin/konten?tab=komunitas" },
    { label: "Produk marketplace", value: marketplaceCount ?? 0, icon: Store, href: "/admin/konten?tab=marketplace" },
    { label: "Event aktif", value: eventCount ?? 0, icon: CalendarDays, href: "/admin/konten?tab=event" },
    { label: "Lowongan aktif", value: jobCount ?? 0, icon: Briefcase, href: "/admin/konten?tab=lowongan" },
    { label: "Diskusi", value: postCount ?? 0, icon: MessageSquare, href: "/admin/moderation" },
    { label: "Laporan pending", value: pendingReports ?? 0, icon: Flag, href: "/admin/moderation?status=pending" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Statistik platform</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Ringkasan aktivitas RuangKumpul. Klik kartu mana pun untuk membuka halaman pengelolaannya.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-card-hover">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <stat.icon className="size-5.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-ink">
                  {formatCompactId(stat.value)}
                </p>
                <p className="text-sm text-ink-secondary">{stat.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="pengguna-terbaru">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="pengguna-terbaru" className="text-lg font-extrabold text-ink">
              Pengguna terbaru
            </h2>
            <Link href="/admin/users" className="text-xs font-semibold text-brand-700 hover:underline">
              Kelola pengguna →
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-slate-100">
              {(recentUsers ?? []).map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {u.full_name || u.username}
                    </p>
                    <p className="text-xs text-ink-muted">@{u.username}</p>
                  </div>
                  <time className="shrink-0 text-xs text-ink-muted" dateTime={u.created_at}>
                    {timeAgoId(u.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section aria-labelledby="aktivitas-audit">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="aktivitas-audit" className="flex items-center gap-2 text-lg font-extrabold text-ink">
              <ScrollText className="size-4 text-brand-700" aria-hidden="true" />
              Audit log terbaru
            </h2>
            <Link href="/admin/audit" className="text-xs font-semibold text-brand-700 hover:underline">
              Lihat semua →
            </Link>
          </div>
          <Card>
            {(recentAudits ?? []).length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {(recentAudits ?? []).map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {log.resource_type}
                        </Badge>
                        <span className="truncate text-xs font-semibold text-ink">{log.action}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        oleh @{log.profiles?.username ?? "sistem"}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-ink-muted" dateTime={log.created_at}>
                      {timeAgoId(log.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-center text-sm text-ink-secondary">
                Belum ada catatan audit log.
              </p>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
