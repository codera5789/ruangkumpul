import { cache } from "react";
import { withFailSoft } from "@/lib/supabase/query";
import type { Tables } from "@/types/database";

export type ArticleWithAuthor = Tables<"articles"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
  article_categories: Pick<Tables<"article_categories">, "name" | "slug"> | null;
};

/**
 * Artikel terbaru yang published — untuk homepage dan listing.
 * Gagal koneksi database mengembalikan array kosong (halaman tetap tampil).
 */
export async function listLatestArticles(limit = 6): Promise<ArticleWithAuthor[]> {
  return withFailSoft("[knowledge] listLatestArticles gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_CARD_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as ArticleWithAuthor[];
  });
}

/**
 * Kolom ringkas untuk kartu/listing — tanpa kolom `content` (JSONB besar)
 * yang tidak pernah dirender di kartu.
 */
const ARTICLE_CARD_SELECT = `id, title, slug, excerpt, featured_image, published_at,
  view_count, category_id, author_id, created_at, updated_at,
  profiles (username, full_name, avatar_url),
  article_categories (name, slug)` as const;

const ARTICLE_SELECT = `*,
  profiles (username, full_name, avatar_url),
  article_categories (name, slug)` as const;

/** Listing artikel published dengan filter kategori + pagination. */
export async function listPublishedArticles({
  kategoriSlug,
  page = 1,
  pageSize = 9,
}: {
  kategoriSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ articles: ArticleWithAuthor[]; total: number }> {
  return withFailSoft("[knowledge] listPublishedArticles gagal:", { articles: [], total: 0 }, async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let categoryId: string | null = null;
    if (kategoriSlug) {
      const { data: cat } = await supabase
        .from("article_categories")
        .select("id")
        .eq("slug", kategoriSlug)
        .single();
      if (!cat) return { articles: [], total: 0 };
      categoryId = cat.id;
    }

    let query = supabase
      .from("articles")
      .select(ARTICLE_CARD_SELECT, { count: "exact" })
      .eq("status", "published");

    if (categoryId) query = query.eq("category_id", categoryId);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    return { articles: (data ?? []) as ArticleWithAuthor[], total: count ?? 0 };
  });
}

/** Semua kategori artikel (untuk filter listing). */
export async function listArticleCategories(): Promise<{ name: string; slug: string }[]> {
  return withFailSoft("[knowledge] listArticleCategories gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("article_categories")
      .select("name, slug")
      .order("name");
    if (error) throw error;
    return data ?? [];
  });
}

export type ArticleDetail = ArticleWithAuthor & {
  article_tag_relations: {
    tags: Pick<Tables<"tags">, "name" | "slug">;
  }[];
};

/** Detail artikel published berdasarkan slug. Null jika tidak ditemukan.
 *  Di-cache per request: dipanggil generateMetadata + komponen halaman tanpa query ganda. */
export const getArticleBySlug = cache(async (slug: string) =>
  getArticleBySlugUncached(slug),
);

async function getArticleBySlugUncached(slug: string): Promise<ArticleDetail | null> {
  return withFailSoft("[knowledge] getArticleBySlug gagal:", null, async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(
        `${ARTICLE_SELECT},
         article_tag_relations (tags (name, slug))`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) return null;
    return data as ArticleDetail;
  });
}

/** Artikel terkait: kategori sama, published, bukan artikel ini. */
export async function listRelatedArticles(
  articleId: string,
  categoryId: string | null,
  limit = 3,
): Promise<ArticleWithAuthor[]> {
  return withFailSoft("[knowledge] listRelatedArticles gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let query = supabase
      .from("articles")
      .select(ARTICLE_CARD_SELECT)
      .eq("status", "published")
      .neq("id", articleId)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      // Fallback: artikel terbaru lain
      const { data: fallback } = await supabase
        .from("articles")
        .select(ARTICLE_CARD_SELECT)
        .eq("status", "published")
        .neq("id", articleId)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      return (fallback ?? []) as ArticleWithAuthor[];
    }

    return data as ArticleWithAuthor[];
  });
}

/** Artikel published milik satu penulis — dipakai halaman profil publik. */
export async function listArticlesByAuthor(
  authorId: string,
  limit = 6,
): Promise<ArticleWithAuthor[]> {
  return withFailSoft("[knowledge] listArticlesByAuthor gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_CARD_SELECT)
      .eq("author_id", authorId)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as ArticleWithAuthor[];
  });
}

/** Komentar artikel beserta penulisnya. */
export type ArticleCommentWithAuthor = Tables<"article_comments"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

export async function listArticleComments(
  articleId: string,
  limit = 50,
): Promise<ArticleCommentWithAuthor[]> {
  return withFailSoft("[knowledge] listArticleComments gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("article_comments")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
      )
      .eq("article_id", articleId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as ArticleCommentWithAuthor[];
  });
}
