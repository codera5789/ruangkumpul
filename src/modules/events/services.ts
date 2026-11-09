import { unstable_rethrow } from "next/navigation";
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
    unstable_rethrow(err);
    console.error("[events] listUpcomingEvents gagal:", err);
    return [];
  }
}

/** Event published mendatang dengan pagination + filter format. */
export async function listUpcomingEventsPaginated({
  page = 1,
  pageSize = 12,
  format,
}: {
  page?: number;
  pageSize?: number;
  format?: "online" | "offline" | "hybrid";
}): Promise<{ events: EventWithOrganizer[]; total: number }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let query = supabase
      .from("events")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
        { count: "exact" },
      )
      .eq("status", "published")
      .gte("starts_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());

    if (format) query = query.eq("format", format);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order("starts_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    return { events: (data ?? []) as EventWithOrganizer[], total: count ?? 0 };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[events] listUpcomingEventsPaginated gagal:", err);
    return { events: [], total: 0 };
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
    unstable_rethrow(err);
    console.error("[events] getEventBySlug gagal:", err);
    return null;
  }
}
