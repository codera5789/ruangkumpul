"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

/** Toggle favorit tool (tabel tool_favorites, keyed by tool slug → uuid di-resolve server). */
export async function actionToggleToolFavorite(
  toolSlug: string,
): Promise<{ ok: boolean; saved: boolean; error?: string }> {
  const slug = toolSlug.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) {
    return { ok: false, saved: false, error: "Tool tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, saved: false, error: "login" };

  const { data: tool } = await supabase
    .from("tools")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!tool) return { ok: false, saved: false, error: "Tool tidak ditemukan." };

  const { data: existing } = await supabase
    .from("tool_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("tool_id", tool.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("tool_favorites").delete().eq("id", existing.id);
    if (error) return { ok: false, saved: true, error: "Gagal menghapus favorit." };
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("tool_favorites")
    .insert({ user_id: user.id, tool_id: tool.id });

  if (error) {
    console.error("[tools] gagal simpan favorit:", error.message);
    return { ok: false, saved: false, error: "Gagal menyimpan favorit." };
  }

  return { ok: true, saved: true };
}

/**
 * Catat satu pemakaian tool (dipanggil dari route handler — bukan dari client langsung).
 * Gagal logging tidak boleh mengganggu pemakaian tool.
 */
export async function logToolUsage(
  toolSlug: string,
): Promise<void> {
  const slug = toolSlug.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return;

  const supabase = await createClient();

  const { data: tool } = await supabase
    .from("tools")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!tool) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await enforceRateLimit(`tool-usage:${slug}`, 20, 60);
  } catch {
    return; // melebihi kuota logging — abaikan
  }

  await supabase.from("tool_usage_logs").insert({
    tool_id: tool.id,
    user_id: user?.id ?? null,
  });

  const { error: rpcError } = await supabase.rpc("increment_tool_usage", { p_tool: tool.id });
  if (rpcError) console.error("[tools] increment usage gagal:", rpcError.message);
}
