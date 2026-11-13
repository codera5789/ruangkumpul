import { describe, expect, it } from "vitest";
import {
  FEATURED_TOOL_SLUGS,
  TOOL_CATEGORIES,
  TOOL_COUNT,
  TOOLS,
  getCategoryBySlug,
  getToolBySlug,
  getToolsByCategory,
} from "@/modules/tools/tools-registry/registry";

describe("tools registry", () => {
  it("konsisten dengan TOOL_COUNT", () => {
    expect(TOOLS.length).toBe(24);
    expect(TOOL_COUNT).toBe(TOOLS.length);
  });

  it("slug dan route unik serta mengikuti pola /tools/<slug>", () => {
    const slugs = new Set<string>();
    const routes = new Set<string>();
    for (const tool of TOOLS) {
      expect(slugs.has(tool.slug)).toBe(false);
      expect(routes.has(tool.route)).toBe(false);
      slugs.add(tool.slug);
      routes.add(tool.route);
      expect(tool.route).toBe(`/tools/${tool.slug}`);
    }
  });

  it("semua tool unggulan ada di registry", () => {
    for (const slug of FEATURED_TOOL_SLUGS) {
      expect(getToolBySlug(slug), `tool unggulan "${slug}" tidak ditemukan`).toBeTruthy();
    }
  });

  it("kategori setiap tool valid", () => {
    const categories = new Set(TOOL_CATEGORIES.map((c) => c.slug));
    for (const tool of TOOLS) {
      expect(categories.has(tool.category), `${tool.slug}: kategori ${tool.category}`).toBe(true);
    }
  });

  it("setiap tool punya metadata SEO dan konten minimum", () => {
    for (const tool of TOOLS) {
      expect(tool.seoTitle.length).toBeGreaterThan(10);
      expect(tool.seoDescription.length).toBeGreaterThan(30);
      expect(tool.howTo.length).toBeGreaterThan(0);
      expect(tool.faqs.length).toBeGreaterThan(0);
    }
  });

  it("memuat 3 tool terbaru dan helper kategori bekerja akurat", () => {
    expect(getToolBySlug("markdown-converter")?.category).toBe("developer");
    expect(getToolBySlug("favicon-generator")?.category).toBe("desain");
    expect(getToolBySlug("diff-checker")?.category).toBe("developer");
    expect(getToolBySlug("tidak-ada")).toBeUndefined();

    expect(getCategoryBySlug("developer")?.name).toBeTruthy();
    expect(getCategoryBySlug("bukan-kategori")).toBeUndefined();

    const devTools = getToolsByCategory("developer");
    expect(devTools.length).toBeGreaterThan(0);
    expect(devTools.every((t) => t.category === "developer")).toBe(true);
  });
});
