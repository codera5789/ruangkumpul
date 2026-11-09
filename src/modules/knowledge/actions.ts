"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { markdownToBlocks } from "@/modules/knowledge/markdown";

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

  try {
    await enforceRateLimit(`article-comment:${user.id}`, 8, 60);
  } catch {
    return { error: "Kamu berkomentar terlalu cepat. Tunggu sebentar.", success: false };
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

// ---------------------------------------------------------------------------
// Editor artikel (contributor+)
// ---------------------------------------------------------------------------

export interface ArticleActionState {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
}

const articleSchema = z.object({
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200, "Judul maksimal 200 karakter"),
  excerpt: z.string().trim().max(500, "Ringkasan maksimal 500 karakter").optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  content: z.string().trim().min(50, "Isi artikel minimal 50 karakter").max(100000, "Artikel terlalu panjang"),
  status: z.enum(["draft", "review", "published"]),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
});

async function requireContributor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };

  const { data: allowed } = await supabase.rpc("has_any_role", {
    roles: ["contributor", "moderator", "admin", "super_admin"],
  });
  if (!allowed) return { supabase, user: null };
  return { supabase, user };
}

function parseArticleForm(formData: FormData) {
  return articleSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    categoryId: formData.get("categoryId"),
    tags: formData.get("tags"),
    content: formData.get("content"),
    status: formData.get("status") || "draft",
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
}

function fieldErrorsOf(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function resolveTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagsInput: string,
): Promise<string[]> {
  const names = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length <= 50)
    .slice(0, 8);

  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .single();
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const { data: created, error } = await supabase
      .from("tags")
      .insert({ name, slug })
      .select("id")
      .single();
    if (!error && created) ids.push(created.id);
  }
  return ids;
}

export async function actionCreateArticle(
  _prev: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { supabase, user } = await requireContributor();
  if (!user) {
    return { error: "Menulis artikel membutuhkan role kontributor. Hubungi admin.", success: null };
  }

  try {
    await enforceRateLimit(`article-create:${user.id}`, 5, 3600);
  } catch {
    return { error: "Batas membuat artikel tercapai. Coba lagi nanti.", success: null };
  }

  const baseSlug = slugify(parsed.data.title).slice(0, 200) || "artikel";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      author_id: user.id,
      category_id: parsed.data.categoryId || null,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt || null,
      content: markdownToBlocks(parsed.data.content),
      status: parsed.data.status,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
    })
    .select("id")
    .single();

  if (error || !article) {
    console.error("[knowledge] gagal membuat artikel:", error?.message);
    return { error: "Gagal menyimpan artikel. Coba lagi.", success: null };
  }

  const tagIds = await resolveTags(supabase, parsed.data.tags || "");
  if (tagIds.length > 0) {
    await supabase
      .from("article_tag_relations")
      .insert(tagIds.map((tag_id) => ({ article_id: article.id, tag_id })));
  }

  revalidatePath("/dashboard/artikel");
  revalidatePath("/artikel");
  redirect(`/dashboard/artikel?created=1`);
}

export async function actionUpdateArticle(
  _prev: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const parsed = parseArticleForm(formData);
  const articleId = String(formData.get("articleId") || "");

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: fieldErrorsOf(parsed.error) };
  }
  if (!/^[0-9a-f-]{36}$/i.test(articleId)) {
    return { error: "Artikel tidak valid.", success: null };
  }

  const { supabase, user } = await requireContributor();
  if (!user) {
    return { error: "Akses ditolak.", success: null };
  }

  // Verifikasi kepemilikan (RLS juga membatasi, ini untuk pesan yang jelas).
  const { data: existing } = await supabase
    .from("articles")
    .select("id, slug, author_id, published_at")
    .eq("id", articleId)
    .single();
  if (!existing) return { error: "Artikel tidak ditemukan.", success: null };

  // Pertahankan tanggal terbit asli saat artikel sudah pernah terbit.
  const nextPublishedAt =
    parsed.data.status === "published"
      ? (existing.published_at ?? new Date().toISOString())
      : existing.published_at;

  const { data: updated, error } = await supabase
    .from("articles")
    .update({
      category_id: parsed.data.categoryId || null,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt || null,
      content: markdownToBlocks(parsed.data.content),
      status: parsed.data.status,
      published_at: nextPublishedAt,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
    })
    .eq("id", articleId)
    .select("id");

  if (error) {
    console.error("[knowledge] gagal memperbarui artikel:", error.message);
    return { error: "Gagal menyimpan perubahan.", success: null };
  }

  // RLS mengembalikan 0 baris (bukan error) bila bukan penulis/moderator.
  if (!updated || updated.length === 0) {
    return { error: "Kamu tidak punya izin mengubah artikel ini.", success: null };
  }

  if (parsed.data.tags !== undefined) {
    await supabase.from("article_tag_relations").delete().eq("article_id", articleId);
    const tagIds = await resolveTags(supabase, parsed.data.tags || "");
    if (tagIds.length > 0) {
      await supabase
        .from("article_tag_relations")
        .insert(tagIds.map((tag_id) => ({ article_id: articleId, tag_id })));
    }
  }

  revalidatePath("/dashboard/artikel");
  revalidatePath("/artikel");
  revalidatePath(`/artikel/${existing.slug}`);
  return { error: null, success: "Perubahan disimpan." };
}

export async function actionDeleteArticle(formData: FormData): Promise<void> {
  const articleId = String(formData.get("articleId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(articleId)) return;

  const { supabase, user } = await requireContributor();
  if (!user) return;

  const { data: deleted } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId)
    .select("id");
  revalidatePath("/dashboard/artikel");
  revalidatePath("/artikel");
  if (deleted && deleted.length > 0) {
    revalidatePath("/");
  }
}

