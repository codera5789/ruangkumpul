import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
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
    unstable_rethrow(err);
    console.error("[careers] listPublishedJobs gagal:", err);
    return [];
  }
}

/** Lowongan published dengan pagination + filter tipe. */
export async function listPublishedJobsPaginated({
  page = 1,
  pageSize = 12,
  jobType,
}: {
  page?: number;
  pageSize?: number;
  jobType?: Tables<"job_listings">["job_type"];
}): Promise<{ jobs: JobWithPoster[]; total: number }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let query = supabase
      .from("job_listings")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
        { count: "exact" },
      )
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    if (jobType) query = query.eq("job_type", jobType);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    return { jobs: (data ?? []) as JobWithPoster[], total: count ?? 0 };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[careers] listPublishedJobsPaginated gagal:", err);
    return { jobs: [], total: 0 };
  }
}

/** Di-cache per request: dipanggil generateMetadata + komponen halaman tanpa query ganda. */
export const getJobBySlug = cache(async (slug: string) =>
  getJobBySlugUncached(slug),
);

async function getJobBySlugUncached(slug: string): Promise<JobWithPoster | null> {
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
    unstable_rethrow(err);
    console.error("[careers] getJobBySlug gagal:", err);
    return null;
  }
}
