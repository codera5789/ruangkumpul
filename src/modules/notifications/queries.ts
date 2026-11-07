import type { Tables } from "@/types/database";

export type NotificationWithActor = Tables<"notifications"> & {
  actor: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

/** Konversi tipe + id notifikasi ke href tujuan. */
export function notificationHref(n: Pick<NotificationWithActor, "type" | "resource_type" | "resource_id">): string | null {
  if (!n.resource_type || !n.resource_id) return null;
  return "/dashboard/notifikasi";
}

/** Daftar notifikasi milik pengguna (dengan aktor untuk avatar). */
export async function listNotifications(limit = 50): Promise<NotificationWithActor[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `*,
       actor:profiles!notifications_actor_id_fkey (username, full_name, avatar_url)`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[notifications] listNotifications gagal:", error.message);
    return [];
  }
  return (data ?? []) as NotificationWithActor[];
}

/** Jumlah notifikasi belum dibaca — untuk badge bell. */
export async function countUnreadNotifications(): Promise<number> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    return count ?? 0;
  } catch (err) {
    console.error("[notifications] countUnread gagal:", err);
    return 0;
  }
}
