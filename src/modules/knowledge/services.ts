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
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(
        `*,
         profiles (username, full_name, avatar_url),
         article_categories (name, slug)`,
      )
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as ArticleWithAuthor[];
  } catch (err) {
    console.error("[knowledge] listLatestArticles gagal:", err);
    return [];
  }
}

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
  try {
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
      .select(ARTICLE_SELECT, { count: "exact" })
      .eq("status", "published");

    if (categoryId) query = query.eq("category_id", categoryId);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    return { articles: (data ?? []) as ArticleWithAuthor[], total: count ?? 0 };
  } catch (err) {
    console.error("[knowledge] listPublishedArticles gagal:", err);
    return { articles: [], total: 0 };
  }
}

/** Semua kategori artikel (untuk filter listing). */
export async function listArticleCategories() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("article_categories")
      .select("name, slug")
      .order("name");
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error("[knowledge] listArticleCategories gagal:", err);
    return [];
  }
}

export type ArticleDetail = ArticleWithAuthor & {
  article_tag_relations: {
    tags: Pick<Tables<"tags">, "name" | "slug">;
  }[];
};

/** Detail artikel published berdasarkan slug. Null jika tidak ditemukan. */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  try {
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
  } catch (err) {
    console.error("[knowledge] getArticleBySlug gagal:", err);
    return null;
  }
}

/** Artikel terkait: kategori sama, published, bukan artikel ini. */
export async function listRelatedArticles(
  articleId: string,
  categoryId: string | null,
  limit = 3,
): Promise<ArticleWithAuthor[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let query = supabase
      .from("articles")
      .select(ARTICLE_SELECT)
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
        .select(ARTICLE_SELECT)
        .eq("status", "published")
        .neq("id", articleId)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      return (fallback ?? []) as ArticleWithAuthor[];
    }

    return data as ArticleWithAuthor[];
  } catch (err) {
    console.error("[knowledge] listRelatedArticles gagal:", err);
    return [];
  }
}

/** Komentar artikel beserta penulisnya. */
export type ArticleCommentWithAuthor = Tables<"article_comments"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

export async function listArticleComments(
  articleId: string,
  limit = 50,
): Promise<ArticleCommentWithAuthor[]> {
  try {
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
  } catch (err) {
    console.error("[knowledge] listArticleComments gagal:", err);
    return [];
  }
}
