"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

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

  try {
    await enforceRateLimit(`community-create:${user.id}`, 3, 3600);
  } catch {
    return { error: "Batas membuat komunitas tercapai (3 per jam). Coba lagi nanti.", success: null };
  }

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

export async function actionJoinCommunity(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const slug = String(formData.get("slug") || "");
  if (!slug) return { error: "Komunitas tidak valid.", success: null };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/komunitas/${slug}`);

  const { data: community } = await supabase
    .from("communities")
    .select("id, visibility, status")
    .eq("slug", slug)
    .single();

  if (!community || community.status !== "active") {
    return { error: "Komunitas tidak ditemukan atau tidak aktif.", success: null };
  }

  // Cek keanggotaan existing agar status banned/pending terlihat jelas.
  const { data: membership } = await supabase
    .from("community_members")
    .select("status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.status === "banned") {
    return { error: "Kamu tidak bisa bergabung ke komunitas ini.", success: null };
  }
  if (membership?.status === "pending") {
    return { error: null, success: "Permintaan gabung sudah dikirim — menunggu persetujuan." };
  }
  if (membership?.status === "approved") {
    return { error: null, success: "Kamu sudah menjadi anggota komunitas ini." };
  }

  const status = community.visibility === "public" ? "approved" : "pending";

  const { error } = await supabase.from("community_members").upsert(
    {
      community_id: community.id,
      user_id: user.id,
      status,
      role: "member",
    },
    { onConflict: "community_id,user_id" },
  );

  if (error) {
    console.error("[community] gagal bergabung:", error.message);
    return { error: "Gagal bergabung ke komunitas. Coba lagi.", success: null };
  }

  revalidatePath(`/komunitas/${slug}`);
  return {
    error: null,
    success:
      status === "approved"
        ? "Berhasil bergabung! Selamat datang."
        : "Permintaan gabung dikirim — menunggu persetujuan pemilik.",
  };
}

export async function actionLeaveCommunity(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const slug = String(formData.get("slug") || "");
  if (!slug) return { error: "Komunitas tidak valid.", success: null };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/komunitas/${slug}`);

  const { data: community } = await supabase
    .from("communities")
    .select("id, owner_id")
    .eq("slug", slug)
    .single();

  if (!community) return { error: "Komunitas tidak ditemukan.", success: null };
  if (community.owner_id === user.id) {
    return { error: "Pemilik tidak bisa keluar dari komunitasnya sendiri.", success: null };
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", community.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[community] gagal keluar komunitas:", error.message);
    return { error: "Gagal keluar dari komunitas. Coba lagi.", success: null };
  }

  revalidatePath(`/komunitas/${slug}`);
  return { error: null, success: "Kamu telah keluar dari komunitas." };
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

  try {
    await enforceRateLimit(`post-create:${user.id}`, 5, 600);
  } catch {
    return { error: "Kamu membuat diskusi terlalu cepat. Tunggu beberapa menit.", success: null };
  }

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

  try {
    await enforceRateLimit(`comment:${user.id}`, 8, 60);
  } catch {
    return { error: "Kamu berkomentar terlalu cepat. Tunggu sebentar.", success: null };
  }

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

export async function actionTogglePostLike(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const postSlug = String(formData.get("postSlug") || "");
  if (!postSlug) return { error: "Diskusi tidak valid.", success: null };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/diskusi/${postSlug}`);

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", postSlug)
    .single();
  if (!post) return { error: "Diskusi tidak ditemukan.", success: null };

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", "post")
    .eq("target_id", post.id)
    .eq("reaction_type", "like")
    .single();

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) {
      console.error("[community] gagal batal suka:", error.message);
      return { error: "Gagal menghapus suka. Coba lagi.", success: null };
    }
  } else {
    const { error } = await supabase
      .from("reactions")
      .insert({ user_id: user.id, target_type: "post", target_id: post.id, reaction_type: "like" });
    if (error) {
      console.error("[community] gagal menyukai:", error.message);
      return { error: "Gagal menyukai diskusi. Coba lagi.", success: null };
    }
  }

  revalidatePath(`/diskusi/${postSlug}`);
  return { error: null, success: null };
}

// ---------------------------------------------------------------------------
// Edit / hapus postingan (pemilik) — status 'deleted' = soft delete
// ---------------------------------------------------------------------------

const updatePostSchema = z.object({
  postSlug: z.string().trim().min(1),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200, "Judul maksimal 200 karakter"),
  content: z.string().trim().min(10, "Isi diskusi minimal 10 karakter").max(20000, "Terlalu panjang"),
});

export async function actionUpdatePost(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const parsed = updatePostSchema.safeParse({
    postSlug: formData.get("postSlug"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali.", success: null };

  // RLS: hanya penulis atau moderator yang boleh update.
  const { error } = await supabase
    .from("posts")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .eq("slug", parsed.data.postSlug);

  if (error) {
    console.error("[community] gagal mengedit diskusi:", error.message);
    return { error: "Gagal menyimpan perubahan.", success: null };
  }

  revalidatePath(`/diskusi/${parsed.data.postSlug}`);
  return { error: null, success: "Perubahan disimpan." };
}

export async function actionDeletePost(formData: FormData): Promise<void> {
  const postSlug = String(formData.get("postSlug") || "");
  if (!postSlug) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  // Cari komunitas tujuan redirect sebelum soft delete.
  const { data: post } = await supabase
    .from("posts")
    .select("id, communities (slug)")
    .eq("slug", postSlug)
    .single();
  if (!post) return;

  // Soft delete: penulis atau moderator (diizinkan RLS).
  await supabase.from("posts").update({ status: "deleted" }).eq("slug", postSlug);

  const communitySlug = Array.isArray(post.communities)
    ? post.communities[0]?.slug
    : post.communities?.slug;
  revalidatePath(`/diskusi/${postSlug}`);
  if (communitySlug) redirect(`/komunitas/${communitySlug}`);
  redirect("/komunitas");
}

// ---------------------------------------------------------------------------
// Edit / hapus komentar
// ---------------------------------------------------------------------------

export async function actionUpdatePostComment(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const parsed = z
    .object({
      commentId: z.string().uuid(),
      content: z.string().trim().min(3, "Komentar minimal 3 karakter").max(5000, "Komentar terlalu panjang"),
    })
    .safeParse({ commentId: formData.get("commentId"), content: formData.get("content") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid", success: null };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Sesi berakhir. Masuk kembali.", success: null };

  const { error } = await supabase
    .from("comments")
    .update({ content: parsed.data.content })
    .eq("id", parsed.data.commentId);

  if (error) {
    console.error("[community] gagal mengedit komentar:", error.message);
    return { error: "Gagal menyimpan komentar.", success: null };
  }

  return { error: null, success: "Komentar diperbarui." };
}

export async function actionDeletePostComment(formData: FormData): Promise<void> {
  const commentId = String(formData.get("commentId") || "");
  const postSlug = String(formData.get("postSlug") || "");
  if (!commentId) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase.from("comments").delete().eq("id", commentId);

  if (postSlug) revalidatePath(`/diskusi/${postSlug}`);
}

// ---------------------------------------------------------------------------
// Kelola anggota komunitas (owner/moderator)
// ---------------------------------------------------------------------------

async function requireStaffOf(supabase: Awaited<ReturnType<typeof createClient>>, communitySlug: string, userId: string) {
  const { data: community } = await supabase
    .from("communities")
    .select("id, owner_id")
    .eq("slug", communitySlug)
    .single();
  if (!community) return null;

  if (community.owner_id === userId) return community;

  const { data: staff } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", community.id)
    .eq("user_id", userId)
    .eq("role", "moderator")
    .eq("status", "approved")
    .single();

  return staff ? community : null;
}

export async function actionApproveMember(formData: FormData): Promise<void> {
  const communitySlug = String(formData.get("communitySlug") || "");
  const memberId = String(formData.get("memberId") || "");
  if (!communitySlug || !/^[0-9a-f-]{36}$/i.test(memberId)) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const community = await requireStaffOf(supabase, communitySlug, user.id);
  if (!community) return;

  await supabase
    .from("community_members")
    .update({ status: "approved" })
    .eq("id", memberId)
    .eq("community_id", community.id);

  revalidatePath(`/komunitas/${communitySlug}/anggota`);
  revalidatePath(`/komunitas/${communitySlug}`);
}

export async function actionRejectMember(formData: FormData): Promise<void> {
  const communitySlug = String(formData.get("communitySlug") || "");
  const memberId = String(formData.get("memberId") || "");
  if (!communitySlug || !/^[0-9a-f-]{36}$/i.test(memberId)) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const community = await requireStaffOf(supabase, communitySlug, user.id);
  if (!community) return;

  await supabase
    .from("community_members")
    .delete()
    .eq("id", memberId)
    .eq("community_id", community.id);

  revalidatePath(`/komunitas/${communitySlug}/anggota`);
}

export async function actionSetMemberRole(formData: FormData): Promise<void> {
  const communitySlug = String(formData.get("communitySlug") || "");
  const memberId = String(formData.get("memberId") || "");
  const nextRole = String(formData.get("nextRole") || "");

  if (!communitySlug || !/^[0-9a-f-]{36}$/i.test(memberId)) return;
  if (nextRole !== "moderator" && nextRole !== "member") return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  // Hanya owner yang boleh mengangkat/menurunkan moderator.
  const { data: community } = await supabase
    .from("communities")
    .select("id, owner_id")
    .eq("slug", communitySlug)
    .single();
  if (!community || community.owner_id !== user.id) return;

  await supabase
    .from("community_members")
    .update({ role: nextRole })
    .eq("id", memberId)
    .eq("community_id", community.id)
    .neq("role", "owner");

  revalidatePath(`/komunitas/${communitySlug}/anggota`);
}

export async function actionRemoveMember(formData: FormData): Promise<void> {
  const communitySlug = String(formData.get("communitySlug") || "");
  const memberId = String(formData.get("memberId") || "");
  if (!communitySlug || !/^[0-9a-f-]{36}$/i.test(memberId)) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  const community = await requireStaffOf(supabase, communitySlug, user.id);
  if (!community) return;

  await supabase
    .from("community_members")
    .delete()
    .eq("id", memberId)
    .eq("community_id", community.id)
    .neq("role", "owner");

  revalidatePath(`/komunitas/${communitySlug}/anggota`);
  revalidatePath(`/komunitas/${communitySlug}`);
}

// ---------------------------------------------------------------------------
// Lapor konten — dengan validasi target + dedup
// ---------------------------------------------------------------------------

const REPORT_TARGET_TABLES: Record<string, string> = {
  post: "posts",
  comment: "comments",
  article: "articles",
  community: "communities",
  user: "profiles",
};

export async function actionReportContent(formData: FormData): Promise<void> {
  const targetType = String(formData.get("targetType") || "");
  const targetId = String(formData.get("targetId") || "");
  const reason = String(formData.get("reason") || "lainnya");
  const redirectTo = String(formData.get("redirectTo") || "/");

  if (!REPORT_TARGET_TABLES[targetType] || !/^[0-9a-f-]{36}$/i.test(targetId)) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(redirectTo)}`);

  // 1) Target harus benar-benar ada (anti sampah data).
  const { data: target } = await supabase
    .from(REPORT_TARGET_TABLES[targetType])
    .select("id")
    .eq("id", targetId)
    .single();
  if (!target) return;

  // 2) Satu pengguna satu laporan per target (index unik di DB).
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
  });

  if (error) {
    // 23505 = unique violation — laporan duplikat; abaikan diam-diam.
    if (error.code !== "23505") {
      console.error("[community] gagal melapor:", error.message);
    }
  }

  revalidatePath(redirectTo);
}
