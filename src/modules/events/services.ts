import type { Tables } from "@/types/database";

export type EventWithOrganizer = Tables<"events"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

/** Event published mendatang (dan yang baru lewat di bawah). */
export async function listUpcomingEvents(limit = 24): Promise<EventWithOrganizer[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
      )
      .eq("status", "published")
      .gte("starts_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as EventWithOrganizer[];
  } catch (err) {
    console.error("[events] listUpcomingEvents gagal:", err);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<EventWithOrganizer | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
      )
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return data as EventWithOrganizer;
  } catch (err) {
    console.error("[events] getEventBySlug gagal:", err);
    return null;
  }
}
