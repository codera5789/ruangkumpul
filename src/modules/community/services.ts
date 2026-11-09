import { unstable_rethrow } from "next/navigation";
import type { Tables } from "@/types/database";

export type CommunitySummary = Tables<"communities">;

/**
 * Komunitas publik paling ramai — untuk homepage dan direktori.
 * Gagal koneksi database mengembalikan array kosong (halaman tetap tampil).
 */
export async function listTopCommunities(limit = 6): Promise<CommunitySummary[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .eq("visibility", "public")
      .eq("status", "active")
      .order("member_count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as CommunitySummary[];
  } catch (err) {
    unstable_rethrow(err);
    console.error("[community] listTopCommunities gagal:", err);
    return [];
  }
}

/** Direktori komunitas dengan pagination database (bukan slice di memori). */
export async function listPublicCommunitiesPaginated({
  page = 1,
  pageSize = 24,
}: {
  page?: number;
  pageSize?: number;
}): Promise<{ communities: CommunitySummary[]; total: number }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from("communities")
      .select("*", { count: "exact" })
      .eq("visibility", "public")
      .eq("status", "active")
      .order("member_count", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    return {
      communities: (data ?? []) as CommunitySummary[],
      total: count ?? 0,
    };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[community] listPublicCommunitiesPaginated gagal:", err);
    return { communities: [], total: 0 };
  }
}
