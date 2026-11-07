import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bell, Heart, MessageSquare, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarkAllReadButton } from "@/modules/notifications/components/mark-all-read-button";
import { actionMarkAllNotificationsRead } from "@/modules/notifications/actions";
import { createClient } from "@/lib/supabase/server";
import { timeAgoId } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifikasi" };

type NotifRow = {
  id: string;
  actor_id: string | null;
  type: string;
  title: string;
  message: string | null;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
};

interface ResolvedNotif extends NotifRow {
  href: string | null;
  actor: { username: string; full_name: string | null; avatar_url: string | null } | null;
}

function typeIcon(type: string) {
  if (type === "like") return Heart;
  if (type === "comment") return MessageSquare;
  if (type === "welcome") return Sparkles;
  return Bell;
}

/** Resolusi tipe+id resource menjadi href nyata (batch per tabel). */
async function resolveHrefs(rows: NotifRow[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const supabase = await createClient();

  const postIds = rows.filter((r) => r.resource_type === "post").map((r) => r.resource_id!);
  const articleIds = rows.filter((r) => r.resource_type === "article").map((r) => r.resource_id!);

  const [posts, articles] = await Promise.all([
    postIds.length
      ? supabase.from("posts").select("id, slug").in("id", postIds)
      : Promise.resolve({ data: null as { id: string; slug: string }[] | null }),
    articleIds.length
      ? supabase.from("articles").select("id, slug").in("id", articleIds)
      : Promise.resolve({ data: null as { id: string; slug: string }[] | null }),
  ]);

  for (const p of posts.data ?? []) map.set(`post:${p.id}`, `/diskusi/${p.slug}`);
  for (const a of articles.data ?? []) map.set(`article:${a.id}`, `/artikel/${a.slug}`);
  return map;
}

export default async function NotifikasiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/notifikasi");

  const [{ data: notifications }, actorProfiles] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url"),
  ]);

  const rows = (notifications ?? []) as NotifRow[];
  const profileMap = new Map(
    ((actorProfiles.data ?? []) as { id: string; username: string; full_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );
  const hrefMap = await resolveHrefs(rows);

  const resolved: ResolvedNotif[] = rows.map((row) => ({
    ...row,
    href: row.resource_type && row.resource_id
      ? hrefMap.get(`${row.resource_type}:${row.resource_id}`) ?? null
      : null,
    actor: row.actor_id ? profileMap.get(row.actor_id) ?? null : null,
  }));

  const unreadCount = resolved.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Notifikasi</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca.`
              : "Semua notifikasi sudah dibaca."}
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={actionMarkAllNotificationsRead}>
            <MarkAllReadButton />
          </form>
        ) : null}
      </div>

      {resolved.length > 0 ? (
        <Card>
          <ul className="divide-y divide-slate-100">
            {resolved.map((notif) => {
              const Icon = typeIcon(notif.type);
              const actorName =
                notif.actor?.full_name || notif.actor?.username || null;

              const content = (
                <>
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {notif.title}
                      {!notif.is_read ? (
                        <span className="ml-2 inline-block size-2 rounded-full bg-brand-600" aria-label="belum dibaca" />
                      ) : null}
                    </p>
                    {notif.message ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-secondary">{notif.message}</p>
                    ) : null}
                  </div>
                  <time className="shrink-0 text-xs text-ink-muted" dateTime={notif.created_at}>
                    {timeAgoId(notif.created_at)}
                  </time>
                </>
              );

              return (
                <li
                  key={notif.id}
                  className={notif.is_read ? "" : "bg-brand-50/40"}
                >
                  {notif.href ? (
                    <Link href={notif.href} className="flex items-start gap-3 p-4 transition-colors hover:bg-surface-muted">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 p-4">{content}</div>
                  )}
                  {actorName ? (
                    <span className="sr-only">oleh {actorName}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center text-sm text-ink-secondary">
          Belum ada notifikasi. Aktivitas pada konten kamu akan muncul di sini.
        </p>
      )}
    </div>
  );
}
