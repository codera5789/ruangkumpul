import Link from "next/link";
import type { Metadata } from "next";
import { Bell, Heart, MessageSquare, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarkAllReadButton } from "@/modules/notifications/components/mark-all-read-button";
import { actionMarkAllNotificationsRead } from "@/modules/notifications/actions";
import {
  listNotifications,
  resolveNotificationHrefs,
  type NotificationWithActor,
} from "@/modules/notifications/queries";
import { timeAgoId } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifikasi" };

type ResolvedNotif = NotificationWithActor & { href: string | null };

function typeIcon(type: string) {
  if (type === "like") return Heart;
  if (type === "comment") return MessageSquare;
  if (type === "welcome") return Sparkles;
  return Bell;
}

export default async function NotifikasiPage() {
  const notifications = await listNotifications(50);

  const hrefMap = await resolveNotificationHrefs(notifications);

  const resolved: ResolvedNotif[] = notifications.map((row) => ({
    ...row,
    href:
      row.resource_type && row.resource_id
        ? hrefMap.get(`${row.resource_type}:${row.resource_id}`) ?? null
        : null,
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
              const actorName = notif.actor?.full_name || notif.actor?.username || null;

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
