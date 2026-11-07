"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export type BookmarkResourceType = "tool" | "article" | "post" | "event" | "job";

const VALID_TYPES: BookmarkResourceType[] = ["tool", "article", "post", "event", "job"];

/**
 * Toggle bookmark milik pengguna. Mengembalikan status akhir (true = tersimpan).
 * RLS menjamin bookmark hanya milik pengguna itu sendiri.
 */
export async function actionToggleBookmark(
  resourceType: BookmarkResourceType,
  resourceId: string,
): Promise<{ ok: boolean; saved: boolean; error?: string }> {
  if (!VALID_TYPES.includes(resourceType) || !resourceId || resourceId.length > 300) {
    return { ok: false, saved: false, error: "Resource tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, saved: false, error: "login" };
  }

  try {
    await enforceRateLimit(`bookmark:${user.id}`, 40, 60);
  } catch {
    return { ok: false, saved: false, error: "Terlalu cepat. Tunggu sebentar." };
  }

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", existing.id);
    if (error) {
      console.error("[bookmark] gagal hapus:", error.message);
      return { ok: false, saved: true, error: "Gagal menghapus bookmark." };
    }
    revalidatePath("/dashboard/bookmark");
    return { ok: true, saved: false };
  }

  const { error } = await supabase.from("bookmarks").insert({
    user_id: user.id,
    resource_type: resourceType,
    resource_id: resourceId,
  });

  if (error) {
    console.error("[bookmark] gagal simpan:", error.message);
    return { ok: false, saved: false, error: "Gagal menyimpan bookmark." };
  }

  revalidatePath("/dashboard/bookmark");
  return { ok: true, saved: true };
}
