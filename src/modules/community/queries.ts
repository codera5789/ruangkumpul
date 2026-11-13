import { cache } from "react";
import { withFailSoft } from "@/lib/supabase/query";
import type { Tables } from "@/types/database";
import type { CommunitySummary } from "@/modules/community/services";

export type PostWithAuthor = Tables<"posts"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
  communities: Pick<Tables<"communities">, "name" | "slug" | "visibility"> | null;
  reaction_count?: number;
  comment_count?: number;
  liked?: boolean;
};

interface CommunityContext {
  community: CommunitySummary;
  membership: {
    role: Tables<"community_members">["role"];
    status: Tables<"community_members">["status"];
  } | null;
  isOwner: boolean;
  isLoggedIn: boolean;
}

/** Detail komunitas + status keanggotaan pengguna saat ini.
 *  Di-cache per request: dipanggil generateMetadata + komponen halaman
 *  tanpa query ganda. */
export const getCommunityBySlug = cache(async (slug: string) =>
  getCommunityBySlugUncached(slug),
);

async function getCommunityBySlugUncached(
  slug: string,
): Promise<CommunityContext | null> {
  return withFailSoft("[community] getCommunityBySlug gagal:", null, async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: community, error } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !community) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let membership: CommunityContext["membership"] = null;
    if (user) {
      const { data: member } = await supabase
        .from("community_members")
        .select("role, status")
        .eq("community_id", community.id)
        .eq("user_id", user.id)
        .single();
      membership = member ?? null;
    }

    return {
      community: community as CommunitySummary,
      membership,
      isOwner: Boolean(user && community.owner_id === user.id),
      isLoggedIn: Boolean(user),
    };
  });
}

/** Postingan published milik komunitas. */
export async function listCommunityPosts(
  communityId: string,
  limit = 30,
): Promise<PostWithAuthor[]> {
  return withFailSoft("[community] listCommunityPosts gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posts")
      .select(
        `*,
         profiles (username, full_name, avatar_url),
         communities (name, slug)`,
      )
      .eq("community_id", communityId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const posts = (data ?? []) as PostWithAuthor[];

    // Hitung like + komentar per post (maksimal 1 query tambahan masing-masing).
    if (posts.length > 0) {
      const ids = posts.map((p) => p.id);

      const [{ data: reactions }, { data: commentCounts }] = await Promise.all([
        supabase.from("reactions").select("target_id").eq("target_type", "post").in("target_id", ids),
        supabase.from("comments").select("post_id").in("post_id", ids),
      ]);

      const likeMap = new Map<string, number>();
      for (const r of reactions ?? []) {
        likeMap.set(r.target_id, (likeMap.get(r.target_id) ?? 0) + 1);
      }
      const commentMap = new Map<string, number>();
      for (const c of commentCounts ?? []) {
        commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1);
      }

      for (const post of posts) {
        post.reaction_count = likeMap.get(post.id) ?? 0;
        post.comment_count = commentMap.get(post.id) ?? 0;
      }
    }

    return posts;
  });
}

/** Detail diskusi berdasarkan slug. Diskusi komunitas privat hanya untuk anggota approved.
 *  Di-cache per request (dipanggil generateMetadata + komponen halaman). */
export const getPostBySlug = cache(async (slug: string) =>
  getPostBySlugUncached(slug),
);

async function getPostBySlugUncached(slug: string): Promise<PostWithAuthor | null> {
  return withFailSoft("[community] getPostBySlug gagal:", null, async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posts")
      .select(
        `*,
         profiles (username, full_name, avatar_url),
         communities (name, slug, visibility)`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) return null;

    const post = data as PostWithAuthor;

    // Satu kali getUser dipakai untuk gate privat dan status suka.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // App-level gate untuk komunitas privat (RLS juga memvalidasi).
    if (post.communities?.visibility === "private") {
      let allowed = Boolean(user && post.author_id === user.id);
      if (!allowed && user) {
        const [{ data: membership }, { data: moderator }] = await Promise.all([
          supabase
            .from("community_members")
            .select("id")
            .eq("community_id", post.community_id!)
            .eq("user_id", user.id)
            .eq("status", "approved")
            .maybeSingle(),
          supabase.rpc("is_moderator"),
        ]);
        allowed = Boolean(membership) || Boolean(moderator);
      }
      if (!allowed) return null;
    }

    const [{ count: likeCount }, { count: commentCount }, { data: existingLike }] =
      await Promise.all([
        supabase.from("reactions").select("*", { count: "exact", head: true }).eq("target_type", "post").eq("target_id", post.id),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
        user
          ? supabase
              .from("reactions")
              .select("id")
              .eq("user_id", user.id)
              .eq("target_type", "post")
              .eq("target_id", post.id)
              .eq("reaction_type", "like")
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

    post.reaction_count = likeCount ?? 0;
    post.comment_count = commentCount ?? 0;
    post.liked = Boolean(existingLike);

    return post;
  });
}

/** Komentar diskusi. */
export type PostCommentWithAuthor = Tables<"comments"> & {
  profiles: Pick<Tables<"profiles">, "username" | "full_name" | "avatar_url"> | null;
};

export async function listPostComments(
  postId: string,
  limit = 100,
): Promise<PostCommentWithAuthor[]> {
  return withFailSoft("[community] listPostComments gagal:", [], async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("comments")
      .select(
        `*,
         profiles (username, full_name, avatar_url)`,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as PostCommentWithAuthor[];
  });
}
