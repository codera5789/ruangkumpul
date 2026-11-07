import type { Tables } from "@/types/database";

export type NotificationWithActor = Tables<"notifications"> & {
  actor: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

/** Daftar notifikasi milik pengguna (dengan aktor untuk avatar). */
export async function listNotifications(limit = 50): Promise<NotificationWithActor[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `*,
         actor:profiles!notifications_actor_id_fkey (username, full_name, avatar_url)`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as NotificationWithActor[];
  } catch (err) {
    console.error("[notifications] listNotifications gagal:", err);
    return [];
  }
}

/** Resolusi tipe+id resource menjadi href nyata (batch per tabel). */
export async function resolveNotificationHrefs(
  rows: Pick<NotificationWithActor, "resource_type" | "resource_id">[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const postIds = rows
      .filter((r) => r.resource_type === "post" && r.resource_id)
      .map((r) => r.resource_id!);
    const articleIds = rows
      .filter((r) => r.resource_type === "article" && r.resource_id)
      .map((r) => r.resource_id!);

    const [posts, articles] = await Promise.all([
      postIds.length
        ? supabase.from("posts").select("id, slug").in("id", postIds)
        : Promise.resolve({ data: null as { id: string; slug: string }[] | null, error: null }),
      articleIds.length
        ? supabase.from("articles").select("id, slug").in("id", articleIds)
        : Promise.resolve({ data: null as { id: string; slug: string }[] | null, error: null }),
    ]);

    for (const p of posts.data ?? []) map.set(`post:${p.id}`, `/diskusi/${p.slug}`);
    for (const a of articles.data ?? []) map.set(`article:${a.id}`, `/artikel/${a.slug}`);
  } catch (err) {
    console.error("[notifications] resolveNotificationHrefs gagal:", err);
  }

  return map;
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
