"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface CommentActionState {
  error: string | null;
  success: boolean;
}

const schema = z.object({
  slug: z.string().trim().min(1).max(220),
  content: z
    .string()
    .trim()
    .min(3, "Komentar minimal 3 karakter")
    .max(5000, "Komentar maksimal 5000 karakter"),
});

export async function actionAddArticleComment(
  _prev: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid", success: false };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Kamu harus masuk untuk berkomentar.", success: false };
  }

  const { data: article } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", parsed.data.slug)
    .eq("status", "published")
    .single();

  if (!article) {
    return { error: "Artikel tidak ditemukan.", success: false };
  }

  const { error } = await supabase.from("article_comments").insert({
    article_id: article.id,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    console.error("[knowledge] insert komentar gagal:", error.message);
    return { error: "Gagal mengirim komentar. Coba lagi.", success: false };
  }

  revalidatePath(`/artikel/${parsed.data.slug}`);
  return { error: null, success: true };
}
