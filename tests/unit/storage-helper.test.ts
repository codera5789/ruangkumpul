import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  MAX_MEDIA_IMAGE_BYTES,
  uploadPublicMediaImage,
  validateMediaImageFile,
} from "@/lib/supabase/storage";

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("validateMediaImageFile", () => {
  it("menolak input non-File dan file kosong", () => {
    expect(validateMediaImageFile(null)).toEqual({
      ok: false,
      error: "Pilih file gambar terlebih dahulu.",
    });
    expect(validateMediaImageFile(makeFile("empty.png", "image/png", 0))).toEqual({
      ok: false,
      error: "Pilih file gambar terlebih dahulu.",
    });
  });

  it("menolak tipe MIME selain JPG, PNG, atau WebP", () => {
    expect(validateMediaImageFile(makeFile("anim.gif", "image/gif", 128))).toEqual({
      ok: false,
      error: "Format harus JPG, PNG, atau WebP.",
    });
    expect(validateMediaImageFile(makeFile("vec.svg", "image/svg+xml", 128))).toEqual({
      ok: false,
      error: "Format harus JPG, PNG, atau WebP.",
    });
  });

  it("menolak ukuran melebihi 2 MB", () => {
    expect(
      validateMediaImageFile(makeFile("big.jpg", "image/jpeg", MAX_MEDIA_IMAGE_BYTES + 1)),
    ).toEqual({
      ok: false,
      error: "Ukuran maksimal 2 MB.",
    });
  });

  it("menerima JPG, PNG, dan WebP beserta ekstensi yang sesuai", () => {
    const jpg = validateMediaImageFile(makeFile("a.jpg", "image/jpeg", 512));
    const png = validateMediaImageFile(makeFile("b.png", "image/png", 512));
    const webp = validateMediaImageFile(makeFile("c.webp", "image/webp", 512));

    expect(jpg.ok).toBe(true);
    expect(png.ok).toBe(true);
    expect(webp.ok).toBe(true);
    if (jpg.ok && png.ok && webp.ok) {
      expect(jpg.ext).toBe("jpg");
      expect(png.ext).toBe("png");
      expect(webp.ext).toBe("webp");
    }
  });
});

describe("uploadPublicMediaImage", () => {
  it("mengunggah ke folder userId dengan prefix yang disanitasi dan mengembalikan publicUrl", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn((path: string) => ({
      data: { publicUrl: `https://cdn.example.com/storage/v1/object/public/articles/${path}` },
    }));
    const from = vi.fn(() => ({ upload, getPublicUrl }));
    const supabase = { storage: { from } } as unknown as SupabaseClient<Database>;

    const file = makeFile("cover.webp", "image/webp", 1024);
    const result = await uploadPublicMediaImage(supabase, {
      bucket: "articles",
      userId: "user-123",
      prefix: "sampul/../xss!",
      file,
    });

    expect(from).toHaveBeenCalledWith("articles");
    expect(upload).toHaveBeenCalledTimes(1);
    const [uploadedPath, uploadedFile, options] = upload.mock.calls[0];
    expect(uploadedPath).toMatch(/^user-123\/sampulxss-\d+\.webp$/);
    expect(uploadedFile).toBe(file);
    expect(options).toEqual({ contentType: "image/webp", upsert: false });
    expect(result).toEqual({
      url: `https://cdn.example.com/storage/v1/object/public/articles/${uploadedPath}`,
      error: null,
    });
  });

  it("tidak memanggil storage jika file gagal validasi", async () => {
    const from = vi.fn();
    const supabase = { storage: { from } } as unknown as SupabaseClient<Database>;

    const result = await uploadPublicMediaImage(supabase, {
      bucket: "communities",
      userId: "user-123",
      prefix: "icon",
      file: makeFile("bad.svg", "image/svg+xml", 64),
    });

    expect(from).not.toHaveBeenCalled();
    expect(result).toEqual({ url: null, error: "Format harus JPG, PNG, atau WebP." });
  });

  it("mengembalikan pesan ramah saat Supabase storage mengembalikan error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const upload = vi.fn().mockResolvedValue({ error: { message: "Bucket not found" } });
    const getPublicUrl = vi.fn();
    const from = vi.fn(() => ({ upload, getPublicUrl }));
    const supabase = { storage: { from } } as unknown as SupabaseClient<Database>;

    const result = await uploadPublicMediaImage(supabase, {
      bucket: "avatars",
      userId: "user-123",
      prefix: "avatar",
      file: makeFile("ava.png", "image/png", 256),
    });

    errorSpy.mockRestore();
    expect(result).toEqual({ url: null, error: "Gagal mengunggah gambar. Coba lagi." });
    expect(getPublicUrl).not.toHaveBeenCalled();
  });
});
