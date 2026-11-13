import { describe, expect, it } from "vitest";
import { formatPriceIdr, PRODUCT_TYPE_LABELS, LICENSE_TYPE_LABELS } from "@/modules/marketplace/constants";
import {
  createInquirySchema,
  createProductSchema,
  parseTagsInput,
} from "@/modules/marketplace/schemas";

describe("formatPriceIdr", () => {
  it("mengembalikan 'Gratis' untuk nilai 0 atau negatif", () => {
    expect(formatPriceIdr(0)).toBe("Gratis");
    expect(formatPriceIdr(-100)).toBe("Gratis");
  });

  it("memformat angka ke mata uang IDR", () => {
    expect(formatPriceIdr(150000)).toContain("150.000");
  });
});

describe("parseTagsInput", () => {
  it("memecah, membersihkan, dan menghapus duplikat tag maksimal 8 item", () => {
    const tags = parseTagsInput("Next.js, react, next.js,  Tailwind , a, b, c, d, e, f");
    expect(tags).toEqual(["next.js", "react", "tailwind", "a", "b", "c", "d", "e"]);
  });

  it("mengembalikan array kosong untuk input null atau kosong", () => {
    expect(parseTagsInput("")).toEqual([]);
    expect(parseTagsInput(null)).toEqual([]);
  });
});

describe("createProductSchema", () => {
  const validPayload = {
    title: "Starter Kit SaaS Next.js",
    summary: "Template siap produksi dengan autentikasi Supabase.",
    description: "Dokumentasi lengkap termasuk skema database, autentikasi, dan komponen UI responsif.",
    categoryId: "",
    productType: "template",
    priceIdr: 150000,
    licenseType: "commercial",
    previewUrl: "https://example.com/preview",
    demoUrl: "",
    tagsRaw: "nextjs, supabase",
    status: "published",
  };

  it("lolos untuk payload yang valid", () => {
    const parsed = createProductSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("menolak URL pratinjau tanpa protokol http/https", () => {
    const parsed = createProductSchema.safeParse({
      ...validPayload,
      previewUrl: "javascript:alert(1)",
    });
    expect(parsed.success).toBe(false);
  });

  it("menolak harga negatif", () => {
    const parsed = createProductSchema.safeParse({
      ...validPayload,
      priceIdr: -5000,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("createInquirySchema", () => {
  it("memvalidasi format UUID produk dan panjang pesan", () => {
    const ok = createInquirySchema.safeParse({
      productId: "11111111-1111-4111-8111-111111111111",
      buyerName: "Raka Pratama",
      buyerContact: "raka@example.com",
      message: "Halo, apakah source code ini menyertakan panduan deploy?",
    });
    expect(ok.success).toBe(true);

    const bad = createInquirySchema.safeParse({
      productId: "bukan-uuid",
      buyerName: "R",
      buyerContact: "ab",
      message: "pendek",
    });
    expect(bad.success).toBe(false);
  });
});

describe("marketplace labels", () => {
  it("mencakup seluruh tipe produk dan lisensi", () => {
    expect(Object.keys(PRODUCT_TYPE_LABELS).sort()).toEqual([
      "digital_asset",
      "freelance_service",
      "source_code",
      "template",
      "ui_kit",
    ]);
    expect(Object.keys(LICENSE_TYPE_LABELS).sort()).toEqual([
      "commercial",
      "free",
      "open_source",
      "personal",
    ]);
  });
});
