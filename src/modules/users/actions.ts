"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionState {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
}

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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: null, success: null, fieldErrors };
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
