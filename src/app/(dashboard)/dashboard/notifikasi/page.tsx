import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarkAllReadButton } from "@/modules/notifications/components/mark-all-read-button";
import { actionMarkAllNotificationsRead } from "@/modules/notifications/actions";
import { createClient } from "@/lib/supabase/server";
import { timeAgoId } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifikasi" };

export default async function NotifikasiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/notifikasi");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

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

      {notifications && notifications.length > 0 ? (
        <Card>
          <ul className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`flex items-start gap-3 p-4 ${notif.is_read ? "" : "bg-brand-50/40"}`}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Bell className="size-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {notif.title}
                    {!notif.is_read ? (
                      <span className="ml-2 inline-block size-2 rounded-full bg-brand-600" aria-label="belum dibaca" />
                    ) : null}
                  </p>
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
        <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center text-sm text-ink-secondary">
          Belum ada notifikasi. Aktivitas pada konten kamu akan muncul di sini.
        </p>
      )}
    </div>
  );
}
