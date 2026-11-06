"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export interface CommunityActionState {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
}

function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Buat komunitas
// ---------------------------------------------------------------------------

const createCommunitySchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(2000, "Deskripsi maksimal 2000 karakter"),
  visibility: z.enum(["public", "private"]),
});

export async function actionCreateCommunity(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const parsed = createCommunitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    visibility: formData.get("visibility") || "public",
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Kamu harus masuk untuk membuat komunitas.", success: null };

  const baseSlug = slugify(parsed.data.name).slice(0, 80) || "komunitas";

  // Coba slug dasar, lalu variasikan dengan angka jika bentrok.
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", slug)
      .single();
    if (!existing) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  const { data: community, error } = await supabase
    .from("communities")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
    })
    .select("slug")
    .single();

  if (error || !community) {
    console.error("[community] gagal membuat komunitas:", error?.message);
    return {
      error: "Gagal membuat komunitas. Nama mungkin sudah dipakai — coba nama lain.",
      success: null,
    };
  }

  revalidatePath("/komunitas");
  redirect(`/komunitas/${community.slug}`);
}

// ---------------------------------------------------------------------------
// Gabung / keluar komunitas
// ---------------------------------------------------------------------------

export async function actionJoinCommunity(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/komunitas/${slug}`);

  const { data: community } = await supabase
    .from("communities")
    .select("id, visibility, status")
    .eq("slug", slug)
    .single();

  if (!community || community.status !== "active") return;

  const status = community.visibility === "public" ? "approved" : "pending";

  await supabase.from("community_members").upsert(
    {
      community_id: community.id,
      user_id: user.id,
      status,
      role: "member",
    },
    { onConflict: "community_id,user_id" },
  );

  revalidatePath(`/komunitas/${slug}`);
}

export async function actionLeaveCommunity(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const { data: community } = await supabase
    .from("communities")
    .select("id, owner_id")
    .eq("slug", slug)
    .single();

  if (!community || community.owner_id === user.id) return; // owner tidak bisa keluar

  await supabase
    .from("community_members")
    .delete()
    .eq("community_id", community.id)
    .eq("user_id", user.id);

  revalidatePath(`/komunitas/${slug}`);
}

// ---------------------------------------------------------------------------
// Buat postingan diskusi
// ---------------------------------------------------------------------------

const createPostSchema = z.object({
  communitySlug: z.string().trim().min(1),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200, "Judul maksimal 200 karakter"),
  content: z.string().trim().min(10, "Isi diskusi minimal 10 karakter").max(20000, "Terlalu panjang"),
  postType: z.enum(["discussion", "question", "announcement"]).default("discussion"),
});

export async function actionCreatePost(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const parsed = createPostSchema.safeParse({
    communitySlug: formData.get("communitySlug"),
    title: formData.get("title"),
    content: formData.get("content"),
    postType: formData.get("postType") || "discussion",
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Kamu harus masuk untuk membuat diskusi.", success: null };

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", parsed.data.communitySlug)
    .single();

  if (!community) return { error: "Komunitas tidak ditemukan.", success: null };

  // RLS juga memvalidasi keanggotaan — ini sekadar UX yang lebih ramah.
  const { data: membership } = await supabase
    .from("community_members")
    .select("id, status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "approved") {
    return { error: "Gabung komunitas dulu sebelum membuat diskusi.", success: null };
  }

  const baseSlug = slugify(parsed.data.title).slice(0, 200) || "diskusi";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      community_id: community.id,
      author_id: user.id,
      title: parsed.data.title,
      slug,
      content: parsed.data.content,
      post_type: parsed.data.postType,
      status: "published",
    })
    .select("slug")
    .single();

  if (error || !post) {
    console.error("[community] gagal membuat diskusi:", error?.message);
    return { error: "Gagal membuat diskusi. Coba lagi.", success: null };
  }

  revalidatePath(`/komunitas/${parsed.data.communitySlug}`);
  redirect(`/diskusi/${post.slug}`);
}

// ---------------------------------------------------------------------------
// Komentar diskusi
// ---------------------------------------------------------------------------

export async function actionAddPostComment(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const parsed = z
    .object({
      postSlug: z.string().trim().min(1),
      content: z.string().trim().min(3, "Komentar minimal 3 karakter").max(5000, "Komentar terlalu panjang"),
    })
    .safeParse({ postSlug: formData.get("postSlug"), content: formData.get("content") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid", success: null };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Kamu harus masuk untuk berkomentar.", success: null };

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", parsed.data.postSlug)
    .eq("status", "published")
    .single();

  if (!post) return { error: "Diskusi tidak ditemukan.", success: null };

  const { error } = await supabase.from("comments").insert({
    post_id: post.id,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    console.error("[community] gagal berkomentar:", error.message);
    return { error: "Gagal mengirim komentar. Coba lagi.", success: null };
  }

  revalidatePath(`/diskusi/${parsed.data.postSlug}`);
  return { error: null, success: "Komentar terkirim!" };
}

// ---------------------------------------------------------------------------
// Suka / batal suka diskusi
// ---------------------------------------------------------------------------

export async function actionTogglePostLike(formData: FormData): Promise<void> {
  const postSlug = String(formData.get("postSlug") || "");
  if (!postSlug) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/diskusi/${postSlug}`);

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", postSlug)
    .single();
  if (!post) return;

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", "post")
    .eq("target_id", post.id)
    .eq("reaction_type", "like")
    .single();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("reactions")
      .insert({ user_id: user.id, target_type: "post", target_id: post.id, reaction_type: "like" });
  }

  revalidatePath(`/diskusi/${postSlug}`);
}

// ---------------------------------------------------------------------------
// Lapor konten
// ---------------------------------------------------------------------------

export async function actionReportContent(formData: FormData): Promise<void> {
  const targetType = String(formData.get("targetType") || "");
  const targetId = String(formData.get("targetId") || "");
  const reason = String(formData.get("reason") || "lainnya");
  const redirectTo = String(formData.get("redirectTo") || "/");

  if (!targetType || !targetId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(redirectTo)}`);

  await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
  });

  revalidatePath(redirectTo);
}
