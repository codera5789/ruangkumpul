import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type PublicMediaBucket = "avatars" | "communities" | "articles";

export const ALLOWED_MEDIA_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_MEDIA_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

/** Validasi file gambar unggahan (JPG/PNG/WebP maksimal 2 MB). */
export function validateMediaImageFile(
  file: unknown,
): { ok: true; file: File; ext: string } | { ok: false; error: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih file gambar terlebih dahulu." };
  }
  if (!ALLOWED_MEDIA_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_MEDIA_IMAGE_TYPES)[number])) {
    return { ok: false, error: "Format harus JPG, PNG, atau WebP." };
  }
  if (file.size > MAX_MEDIA_IMAGE_BYTES) {
    return { ok: false, error: "Ukuran maksimal 2 MB." };
  }
  return { ok: true, file, ext: EXT_BY_MIME[file.type] ?? "jpg" };
}

/**
 * Unggah gambar ke bucket media publik Supabase (`avatars`, `communities`, `articles`)
 * di bawah folder `userId` agar sesuai policy RLS `media_owner_write`.
 */
export async function uploadPublicMediaImage(
  supabase: SupabaseClient<Database>,
  {
    bucket,
    userId,
    prefix,
    file,
  }: {
    bucket: PublicMediaBucket;
    userId: string;
    prefix: string;
    file: unknown;
  },
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  const checked = validateMediaImageFile(file);
  if (!checked.ok) {
    return { url: null, error: checked.error };
  }

  const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "media";
  const path = `${userId}/${safePrefix}-${Date.now()}.${checked.ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, checked.file, { contentType: checked.file.type, upsert: false });

  if (uploadError) {
    console.error(`[storage] upload ${bucket} gagal:`, uploadError.message);
    return { url: null, error: "Gagal mengunggah gambar. Coba lagi." };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
