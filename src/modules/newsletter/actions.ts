"use server";

import { z } from "zod";
import type { ActionState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export type NewsletterActionState = ActionState;

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid").max(255),
  source: z.string().trim().max(50).default("footer"),
});

export async function actionSubscribeNewsletter(
  _prev: NewsletterActionState,
  formData: FormData,
): Promise<NewsletterActionState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") || "footer",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email tidak valid", success: null };
  }

  try {
    await enforceRateLimit(`newsletter:${parsed.data.email}`, 3, 3600);
  } catch {
    return { error: "Terlalu banyak percobaan. Coba lagi nanti.", success: null };
  }

  const supabase = await createClient();

  // RPC SECURITY DEFINER: insert atau aktifkan kembali tanpa perlu SELECT tabel
  // (tabel newsletter hanya bisa dibaca admin lewat RLS).
  const { data, error } = await supabase.rpc("subscribe_newsletter", {
    p_email: parsed.data.email,
    p_source: parsed.data.source,
  });

  if (error) {
    console.error("[newsletter] gagal berlangganan:", error.message);
    return { error: "Gagal berlangganan. Coba lagi.", success: null };
  }

  if (data === "invalid") {
    return { error: "Email tidak valid.", success: null };
  }

  return {
    error: null,
    success: "Terima kasih! Kamu akan menerima kabar terbaik dari RuangKumpul.",
  };
}
