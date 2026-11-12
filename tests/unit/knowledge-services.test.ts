import { describe, expect, it, vi } from "vitest";
import { createSupabaseDouble, hasCall, type DoubleResult } from "./supabase-double";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));

import {
  getArticleBySlug,
  listArticleCategories,
  listArticleComments,
  listArticlesByAuthor,
  listLatestArticles,
  listPublishedArticles,
  listRelatedArticles,
} from "@/modules/knowledge/services";

function setClient(results: DoubleResult | DoubleResult[]) {
  const double = createSupabaseDouble(results);
  state.client = double.client;
  return double;
}

describe("listLatestArticles", () => {
  it("mengembalikan artikel published terbaru", async () => {
    const rows = [{ id: "a1", title: "Rilis RuangKumpul" }];
    const double = setClient({ data: rows, error: null });

    await expect(listLatestArticles()).resolves.toEqual(rows);
    expect(hasCall(double.calls, "from", "articles")).toBe(true);
    expect(hasCall(double.calls, "eq", "status", "published")).toBe(true);
  });

  it("fail-soft: array kosong + log saat query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listLatestArticles()).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("listPublishedArticles", () => {
  it("tanpa kategori: langsung query artikel dengan count exact", async () => {
    setClient({ data: [{ id: "a1" }], error: null, count: 3 });

    await expect(listPublishedArticles({ page: 1, pageSize: 9 })).resolves.toEqual({
      articles: [{ id: "a1" }],
      total: 3,
    });
  });

  it("kategori ditemukan: memfilter category_id dari hasil lookup slug", async () => {
    const double = setClient([
      { data: { id: "cat-1" }, error: null },
      { data: [{ id: "a1" }], error: null, count: 1 },
    ]);

    await listPublishedArticles({ kategoriSlug: "teknologi" });
    expect(hasCall(double.calls, "eq", "slug", "teknologi")).toBe(true);
    expect(hasCall(double.calls, "eq", "category_id", "cat-1")).toBe(true);
  });

  it("kategori tidak ditemukan: hasil kosong tanpa query artikel", async () => {
    const double = setClient([{ data: null, error: null }]);

    await expect(listPublishedArticles({ kategoriSlug: "gaib" })).resolves.toEqual({
      articles: [],
      total: 0,
    });
    expect(hasCall(double.calls, "from", "articles")).toBe(false);
  });

  it("fail-soft: { articles: [], total: 0 } saat error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listPublishedArticles({})).resolves.toEqual({ articles: [], total: 0 });
    spy.mockRestore();
  });
});

describe("listArticleCategories", () => {
  it("mengembalikan kategori terurut nama", async () => {
    const rows = [{ name: "Teknologi", slug: "teknologi" }];
    setClient({ data: rows, error: null });

    await expect(listArticleCategories()).resolves.toEqual(rows);
  });

  it("fail-soft: array kosong saat error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listArticleCategories()).resolves.toEqual([]);
    spy.mockRestore();
  });
});

describe("getArticleBySlug", () => {
  it("mengembalikan artikel detail beserta relasi tag", async () => {
    const article = { id: "a1", slug: "rilis", article_tag_relations: [] };
    const double = setClient({ data: article, error: null });

    await expect(getArticleBySlug("rilis")).resolves.toEqual(article);
    expect(hasCall(double.calls, "eq", "slug", "rilis")).toBe(true);
    expect(hasCall(double.calls, "eq", "status", "published")).toBe(true);
  });

  it("null saat tidak ditemukan atau query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "not found" } });

    await expect(getArticleBySlug("tidak-ada")).resolves.toBeNull();
    spy.mockRestore();
  });
});

describe("listRelatedArticles", () => {
  it("mengembalikan artikel sekategori bila tersedia", async () => {
    const rows = [{ id: "a2" }];
    setClient({ data: rows, error: null });

    await expect(listRelatedArticles("a1", "cat-1")).resolves.toEqual(rows);
  });

  it("fallback ke artikel terbaru lain saat hasil sekategori kosong", async () => {
    const double = setClient([
      { data: [], error: null },
      { data: [{ id: "a9" }], error: null },
    ]);

    await expect(listRelatedArticles("a1", "cat-1")).resolves.toEqual([{ id: "a9" }]);
    const fromArticles = double.calls.filter(
      (c) => c.method === "from" && c.args[0] === "articles",
    );
    expect(fromArticles).toHaveLength(2);
  });

  it("fail-soft: array kosong saat query pertama error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listRelatedArticles("a1", null)).resolves.toEqual([]);
    spy.mockRestore();
  });
});

describe("listArticlesByAuthor", () => {
  it("memfilter author_id dan status published", async () => {
    const rows = [{ id: "a1" }];
    const double = setClient({ data: rows, error: null });

    await expect(listArticlesByAuthor("u1")).resolves.toEqual(rows);
    expect(hasCall(double.calls, "eq", "author_id", "u1")).toBe(true);
    expect(hasCall(double.calls, "eq", "status", "published")).toBe(true);
  });
});

describe("listArticleComments", () => {
  it("memfilter komentar berdasarkan article_id", async () => {
    const rows = [{ id: "cm1", article_id: "a1" }];
    const double = setClient({ data: rows, error: null });

    await expect(listArticleComments("a1")).resolves.toEqual(rows);
    expect(hasCall(double.calls, "eq", "article_id", "a1")).toBe(true);
  });
});
