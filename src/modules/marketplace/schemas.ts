import { z } from "zod";

const optionalHttpUrl = z
  .string()
  .trim()
  .max(500, "URL maksimal 500 karakter")
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^https?:\/\/.+\..+/.test(v), "URL harus dimulai dengan http:// atau https://");

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v),
    "Kategori tidak valid",
  );

export const productBaseSchema = z.object({
  title: z.string().trim().min(5, "Judul produk minimal 5 karakter").max(200, "Judul maksimal 200 karakter"),
  summary: z
    .string()
    .trim()
    .min(10, "Ringkasan minimal 10 karakter")
    .max(300, "Ringkasan maksimal 300 karakter"),
  description: z
    .string()
    .trim()
    .min(30, "Deskripsi lengkap minimal 30 karakter")
    .max(10000, "Deskripsi maksimal 10.000 karakter"),
  categoryId: optionalUuid,
  productType: z.enum(["template", "source_code", "ui_kit", "digital_asset", "freelance_service"]),
  priceIdr: z.coerce
    .number({ message: "Harga harus berupa angka" })
    .int("Harga harus bilangan bulat")
    .min(0, "Harga tidak boleh negatif")
    .max(500_000_000, "Harga melebihi batas maksimum"),
  licenseType: z.enum(["free", "personal", "commercial", "open_source"]).default("personal"),
  previewUrl: optionalHttpUrl,
  demoUrl: optionalHttpUrl,
  tagsRaw: z.string().trim().max(300, "Tag maksimal 300 karakter").optional().or(z.literal("")),
});

export const createProductSchema = productBaseSchema.extend({
  status: z.enum(["draft", "published"]).default("published"),
});

export const updateProductSchema = productBaseSchema.extend({
  productId: z.string().uuid("ID produk tidak valid"),
  status: z.enum(["draft", "published", "archived"]).default("published"),
});

export const createInquirySchema = z.object({
  productId: z.string().uuid("Produk tidak valid"),
  buyerName: z.string().trim().min(2, "Nama minimal 2 karakter").max(120, "Nama maksimal 120 karakter"),
  buyerContact: z
    .string()
    .trim()
    .min(4, "Kontak (email/WhatsApp/Telegram) minimal 4 karakter")
    .max(160, "Kontak maksimal 160 karakter"),
  message: z
    .string()
    .trim()
    .min(10, "Pesan minimal 10 karakter")
    .max(2000, "Pesan maksimal 2.000 karakter"),
});

export const updateInquiryStatusSchema = z.object({
  inquiryId: z.string().uuid("ID inquiry tidak valid"),
  status: z.enum(["new", "replied", "closed"]),
});

/** Ubah input tag dipisah koma menjadi array unik yang bersih. */
export function parseTagsInput(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of raw.split(",")) {
    const clean = part.trim().toLowerCase().slice(0, 32);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
    if (result.length >= 8) break;
  }

  return result;
}
