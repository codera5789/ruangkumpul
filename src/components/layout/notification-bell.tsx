import Link from "next/link";
import { Bell } from "lucide-react";
import { countUnreadNotifications } from "@/modules/notifications/queries";

/**
 * Ikon notifikasi dengan badge jumlah belum dibaca (server component).
 * Klik mengarah ke halaman notifikasi — sederhana dan andal.
 */
export async function NotificationBell() {
  const unread = await countUnreadNotifications();

  return (
    <Link
      href="/dashboard/notifikasi"
      aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""}`}
      className="relative flex size-9 items-center justify-center rounded-full text-ink-secondary transition-all duration-200 hover:bg-surface-muted hover:text-ink active:scale-90"
    >
      <Bell className="size-5 transition-transform duration-300 ease-out-expo hover:-rotate-12" aria-hidden="true" />
      {unread > 0 ? (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pop-in"
          aria-hidden="true"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
