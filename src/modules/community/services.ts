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
    console.error("[community] listTopCommunities gagal:", err);
    return [];
  }
}
