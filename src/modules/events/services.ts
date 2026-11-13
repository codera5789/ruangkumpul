import { cache } from "react";
import { withFailSoft } from "@/lib/supabase/query";
import type { Tables } from "@/types/database";

export type EventWithOrganizer = Tables<"events"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

/** Event published mendatang (dan yang baru lewat di bawah). */
export async function listUpcomingEvents(limit = 24): Promise<EventWithOrganizer[]> {
  return withFailSoft("[events] listUpcomingEvents gagal:", [], async () => {
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
  });
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
  return withFailSoft("[events] listUpcomingEventsPaginated gagal:", { events: [], total: 0 }, async () => {
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
  });
}

/** Di-cache per request: dipanggil generateMetadata + komponen halaman tanpa query ganda. */
export const getEventBySlug = cache(async (slug: string) =>
  getEventBySlugUncached(slug),
);

async function getEventBySlugUncached(slug: string): Promise<EventWithOrganizer | null> {
  return withFailSoft("[events] getEventBySlug gagal:", null, async () => {
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
  });
}
