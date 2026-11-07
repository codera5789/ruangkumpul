import type { Tables } from "@/types/database";

export type JobWithPoster = Tables<"job_listings"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

export const JOB_TYPE_LABELS: Record<Tables<"job_listings">["job_type"], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Kontrak",
  freelance: "Freelance",
  internship: "Magang",
};

/** Lowongan published terbaru. */
export async function listPublishedJobs(limit = 30): Promise<JobWithPoster[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("job_listings")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
      )
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as JobWithPoster[];
  } catch (err) {
    console.error("[careers] listPublishedJobs gagal:", err);
    return [];
  }
}

export async function getJobBySlug(slug: string): Promise<JobWithPoster | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("job_listings")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
      )
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return data as JobWithPoster;
  } catch (err) {
    console.error("[careers] getJobBySlug gagal:", err);
    return null;
  }
}
