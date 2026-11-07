import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, FileText, Flag, Mail, Users, Wrench } from "lucide-react";
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
    { count: newsletterCount },
    { data: recentUsers },
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
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id, username, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stats = [
    { label: "Pengguna", value: profileCount ?? 0, icon: Users, href: "/admin/users" },
    { label: "Tools", value: toolCount ?? 0, icon: Wrench, href: "/admin/konten" },
    { label: "Artikel", value: articleCount ?? 0, icon: FileText, href: "/admin/konten" },
    { label: "Komunitas", value: communityCount ?? 0, icon: Users, href: "/admin/moderation" },
    { label: "Diskusi", value: postCount ?? 0, icon: FileText, href: "/admin/moderation" },
    { label: "Laporan pending", value: pendingReports ?? 0, icon: Flag, href: "/admin/moderation" },
    { label: "Event aktif", value: eventCount ?? 0, icon: CalendarDays, href: "/admin/moderation" },
    { label: "Lowongan aktif", value: jobCount ?? 0, icon: Wrench, href: "/admin/moderation" },
    { label: "Pelanggan newsletter", value: newsletterCount ?? 0, icon: Mail, href: "/admin/users" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Statistik platform</h1>
        <p className="mt-1 text-sm text-ink-secondary">Ringkasan aktivitas RuangKumpul.</p>
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

      <section aria-labelledby="pengguna-terbaru">
        <h2 id="pengguna-terbaru" className="mb-3 text-lg font-extrabold text-ink">
          Pengguna terbaru
        </h2>
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
    </div>
  );
}
