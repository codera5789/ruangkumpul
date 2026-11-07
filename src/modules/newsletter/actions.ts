"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export interface NewsletterActionState {
  error: string | null;
  success: string | null;
}

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

  // Re-subscribe mengaktifkan kembali baris lama (index unik lower(email)).
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, is_active")
    .ilike("email", parsed.data.email)
    .maybeSingle();

  if (existing) {
    if (existing.is_active) {
      return { error: null, success: "Email ini sudah terdaftar. Terima kasih!" };
    }
    await supabase
      .from("newsletter_subscribers")
      .update({ is_active: true, unsubscribed_at: null })
      .eq("id", existing.id);
    return { error: null, success: "Berhasil berlangganan kembali. Sampai jumpa di inbox!" };
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: parsed.data.email,
    source: parsed.data.source,
  });

  if (error) {
    console.error("[newsletter] gagal berlangganan:", error.message);
    return { error: "Gagal berlangganan. Coba lagi.", success: null };
  }

  return {
    error: null,
    success: "Terima kasih! Kamu akan menerima kabar terbaik dari RuangKumpul.",
  };
}
