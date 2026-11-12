import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parsePageParam, zodFieldErrors } from "@/lib/form";

describe("zodFieldErrors", () => {
  it("memetakan issue zod dari safeParse menjadi { field: pesan }", () => {
    const schema = z.object({
      title: z.string().min(3),
      page: z.number().int().positive(),
    });
    const result = schema.safeParse({ title: "ab", page: 0 });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = zodFieldErrors(result.error);
      expect(Object.keys(errors).sort()).toEqual(["page", "title"]);
      expect(errors.title).toBeTruthy();
      expect(errors.page).toBeTruthy();
    }
  });

  it("pesan pertama menang untuk field yang sama", () => {
    const err = new z.ZodError([
      { code: "custom", path: ["title"], message: "pertama" },
      { code: "custom", path: ["title"], message: "kedua" },
    ]);
    expect(zodFieldErrors(err)).toEqual({ title: "pertama" });
  });

  it("issue tanpa path dipetakan ke kunci 'form'", () => {
    const err = new z.ZodError([{ code: "custom", path: [], message: "level form" }]);
    expect(zodFieldErrors(err)).toEqual({ form: "level form" });
  });

  it("path bersarang memakai segmen pertama sebagai kunci", () => {
    const err = new z.ZodError([
      { code: "custom", path: ["event", "title"], message: "wajib diisi" },
    ]);
    expect(zodFieldErrors(err)).toEqual({ event: "wajib diisi" });
  });
});

describe("parsePageParam", () => {
  it("mengembalikan 1 untuk nilai kosong atau tidak valid", () => {
    expect(parsePageParam(null)).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
  });

  it("clamp ke minimal 1", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-5")).toBe(1);
  });

  it("clamp ke maksimal default 100", () => {
    expect(parsePageParam("999")).toBe(100);
    expect(parsePageParam("42")).toBe(42);
  });

  it("menghormati parameter max kustom", () => {
    expect(parsePageParam("50", 10)).toBe(10);
    expect(parsePageParam("7", 10)).toBe(7);
  });
});
