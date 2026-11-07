import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Bookmark,
  MessageSquare,
  Users,
  Wrench,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { timeAgoId } from "@/lib/utils";
import { TOOL_COUNT } from "@/modules/tools/tools-registry/registry";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { count: bookmarkCount }, { count: unreadCount }, { count: memberCount }, { data: notifications }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, full_name, avatar_url, bio, is_verified")
        .eq("id", user.id)
        .single(),
      supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
      supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (!profile) redirect("/login");

  const stats = [
    { label: "Bookmark", value: bookmarkCount ?? 0, icon: Bookmark, href: "/dashboard/bookmark" },
    { label: "Notifikasi belum dibaca", value: unreadCount ?? 0, icon: Bell, href: "/dashboard/notifikasi" },
    { label: "Komunitas diikuti", value: memberCount ?? 0, icon: Users, href: "/komunitas" },
    { label: "Tools tersedia", value: TOOL_COUNT, icon: Wrench, href: "/tools" },
  ];

  return (
    <div className="space-y-8">
      {/* Sambutan */}
      <section className="flex flex-wrap items-center gap-4 animate-slide-up-far">
        <Avatar
          src={profile.avatar_url}
          name={profile.full_name || profile.username}
          className="size-16 animate-pop-in"
        />
        <div className="min-w-0 animate-slide-up-far [animation-delay:100ms]">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            Halo, {profile.full_name || profile.username}
          </h1>
          <p className="text-sm text-ink-secondary">
            @{profile.username}
            {profile.is_verified ? " · Terverifikasi" : ""}
          </p>
        </div>
      </section>

      {/* Statistik */}
      <section aria-label="Statistik aktivitas">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Link
              key={stat.label}
              href={stat.href}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group rounded-card border border-slate-200/80 bg-surface p-5 shadow-card transition-all duration-300 ease-out-expo animate-slide-up-far hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-all duration-300 ease-out-expo group-hover:scale-110 group-hover:bg-brand-800 group-hover:text-white">
                  <stat.icon className="size-5" aria-hidden="true" />
                </span>
                <ArrowRight
                  className="size-4 -translate-x-1 text-ink-muted opacity-0 transition-all duration-300 ease-out-expo group-hover:translate-x-0 group-hover:text-brand-700 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-ink">{stat.value}</p>
              <p className="text-sm text-ink-secondary">{stat.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Notifikasi terbaru */}
      <section aria-labelledby="notif-terbaru" className="animate-slide-up-far [animation-delay:250ms]">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="notif-terbaru" className="text-lg font-extrabold text-ink">
            Notifikasi terbaru
          </h2>
          <Link
            href="/dashboard/notifikasi"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        {notifications && notifications.length > 0 ? (
          <Card>
            <ul className="divide-y divide-slate-100">
              {notifications.map((notif, i) => (
                <li
                  key={notif.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="flex items-start gap-3 p-4 animate-fade-in transition-colors hover:bg-surface-secondary"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <MessageSquare className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{notif.title}</p>
                    {notif.message ? (
                      <p className="mt-0.5 text-sm text-ink-secondary">{notif.message}</p>
                    ) : null}
                  </div>
                  <time className="shrink-0 text-xs text-ink-muted" dateTime={notif.created_at}>
                    {timeAgoId(notif.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-10 text-center text-sm text-ink-secondary">
            Belum ada notifikasi. Mulai aktif di komunitas untuk menerima update!
          </p>
        )}
      </section>
    </div>
  );
}
