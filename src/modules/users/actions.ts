"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasPasswordIdentity } from "@/lib/auth";
import { zodFieldErrors, type ActionState } from "@/lib/form";

export type ProfileActionState = ActionState;

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.-]{3,32}$/, "Username 3-32 karakter: huruf kecil, angka, titik, garis"),
  fullName: z.string().trim().max(120, "Nama terlalu panjang").optional().or(z.literal("")),
  bio: z.string().trim().max(500, "Bio maksimal 500 karakter").optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/.+\..+/.test(v), "URL harus dimulai https://")
    .optional()
    .or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function actionUpdateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    bio: formData.get("bio"),
    websiteUrl: formData.get("websiteUrl"),
    location: formData.get("location"),
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesi berakhir. Masuk kembali.", success: null };

  // Pastikan username unik (RLS membatasi update ke profil sendiri).
  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .neq("id", user.id)
    .single();

  if (taken) {
    return {
      error: null,
      success: null,
      fieldErrors: { username: "Username sudah dipakai pengguna lain." },
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      full_name: parsed.data.fullName || null,
      bio: parsed.data.bio || null,
      website_url: parsed.data.websiteUrl || null,
      location: parsed.data.location || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[profile] update gagal:", error.message);
    return { error: "Gagal menyimpan profil. Coba lagi.", success: null };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profil");
  revalidatePath(`/pengguna/${parsed.data.username}`);
  return { error: null, success: "Profil berhasil diperbarui." };
}

// ---------------------------------------------------------------------------
// Upload avatar (Supabase Storage, bucket avatars, folder per user)
// ---------------------------------------------------------------------------

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export async function actionUploadAvatar(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesi berakhir. Masuk kembali.", success: null };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file gambar terlebih dahulu.", success: null };
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { error: "Format harus JPG, PNG, atau WebP.", success: null };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Ukuran maksimal 2 MB.", success: null };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[profile] upload avatar gagal:", uploadError.message);
    return { error: "Gagal mengunggah gambar. Coba lagi.", success: null };
  }

  const { data } = await supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)
    .select("username")
    .single();

  if (updateError) {
    console.error("[profile] gagal menyimpan avatar:", updateError.message);
    return { error: "Gagal menyimpan avatar.", success: null };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profil");
  if (updatedProfile?.username) {
    revalidatePath(`/pengguna/${updatedProfile.username}`);
  }
  return { error: null, success: "Avatar diperbarui." };
}

// ---------------------------------------------------------------------------
// Ganti email (via Supabase Auth — kirim email konfirmasi)
// ---------------------------------------------------------------------------

export async function actionChangeEmail(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email("Email tidak valid"),
      currentPassword: z.string().optional().or(z.literal("")),
    })
    .safeParse({
      email: formData.get("email"),
      currentPassword: formData.get("currentPassword"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid", success: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesi berakhir. Masuk kembali.", success: null };

  if (user.email === parsed.data.email) {
    return { error: "Email sudah digunakan akun ini.", success: null };
  }

  // Verifikasi password hanya untuk akun yang memang punya password.
  // Akun OAuth (mis. Google) tidak punya password dan tetap bisa ganti email
  // setelah konfirmasi dari Supabase.
  if (hasPasswordIdentity(user)) {
    const currentPassword = parsed.data.currentPassword ?? "";
    if (currentPassword.length < 6) {
      return { error: "Password minimal 6 karakter.", success: null };
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password: currentPassword,
    });
    if (verifyError) {
      return { error: "Password salah.", success: null };
    }
  }

  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (error) {
    console.error("[settings] gagal ganti email:", error.message);
    return { error: "Gagal memproses. Email mungkin sudah terdaftar.", success: null };
  }

  return {
    error: null,
    success: "Email konfirmasi dikirim. Cek kotak masuk email barumu untuk menyelesaikan perubahan.",
  };
}

// ---------------------------------------------------------------------------
// Preferensi notifikasi (tabel user_settings)
// ---------------------------------------------------------------------------

const prefsSchema = z.object({
  notifyComments: z.boolean(),
  notifyLikes: z.boolean(),
  notifyMentions: z.boolean(),
  notifyProduct: z.boolean(),
});

export async function actionUpdateNotificationPrefs(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesi berakhir. Masuk kembali.", success: null };

  const parsed = prefsSchema.safeParse({
    notifyComments: formData.get("notifyComments") === "on",
    notifyLikes: formData.get("notifyLikes") === "on",
    notifyMentions: formData.get("notifyMentions") === "on",
    notifyProduct: formData.get("notifyProduct") === "on",
  });

  if (!parsed.success) return { error: "Input tidak valid.", success: null };

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    notify_comments: parsed.data.notifyComments,
    notify_likes: parsed.data.notifyLikes,
    notify_mentions: parsed.data.notifyMentions,
    notify_product: parsed.data.notifyProduct,
  }, { onConflict: "user_id" });

  if (error) {
    console.error("[settings] gagal simpan preferensi:", error.message);
    return { error: "Gagal menyimpan preferensi.", success: null };
  }

  revalidatePath("/dashboard/pengaturan");
  return { error: null, success: "Preferensi notifikasi disimpan." };
}

// ---------------------------------------------------------------------------
// Hapus akun (GDPR/UU PDP). Tanpa service role: bersihkan konten via RLS
// lalu sign-out + arahkan ke admin. Dengan service role: hapus permanen.
// ---------------------------------------------------------------------------

export async function actionDeleteAccount(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmation") || "");

  if (confirmation !== "HAPUS") {
    return { error: "Ketik HAPUS untuk konfirmasi.", success: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesi berakhir. Masuk kembali.", success: null };

  // Verifikasi password hanya untuk akun dengan identitas email/password.
  if (hasPasswordIdentity(user)) {
    if (!password) {
      return { error: "Masukkan password untuk konfirmasi.", success: null };
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password,
    });
    if (verifyError) {
      return { error: "Password salah.", success: null };
    }
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  if (admin) {
    // Jalur lengkap: hapus akun auth (cascade ke profiles, bookmarks, dst.).
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[settings] gagal hapus akun:", error.message);
      return { error: "Gagal menghapus akun. Coba lagi atau hubungi admin.", success: null };
    }
    await supabase.auth.signOut();
    return { error: null, success: "Akun berhasil dihapus. Terima kasih telah menggunakan RuangKumpul." };
  }

  // Jalur fallback (tanpa SUPABASE_SERVICE_ROLE_KEY): anonimkan profil + hapus konten sendiri.
  await supabase.from("posts").delete().eq("author_id", user.id);
  await supabase.from("comments").delete().eq("author_id", user.id);
  await supabase.from("article_comments").delete().eq("author_id", user.id);
  await supabase.from("reactions").delete().eq("user_id", user.id);
  await supabase.from("event_registrations").delete().eq("user_id", user.id);
  await supabase.from("tool_favorites").delete().eq("user_id", user.id);
  await supabase.from("bookmarks").delete().eq("user_id", user.id);
  await supabase.from("notes").delete().eq("user_id", user.id);
  await supabase.from("tasks").delete().eq("user_id", user.id);
  await supabase
    .from("profiles")
    .update({
      full_name: "[akun dihapus]",
      bio: null,
      website_url: null,
      location: null,
      avatar_url: null,
    })
    .eq("id", user.id);

  await supabase.auth.signOut();
  return {
    error: null,
    success: "Data kontenmu telah dihapus dan akun dianonimkan. Untuk penghapusan penuh, hubungi admin.",
  };
}
