import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseDouble, hasCall, type DoubleOptions, type DoubleResult } from "./supabase-double";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));

import { handleViewCountRequest } from "@/lib/view-counter";

function setClient(results: DoubleResult | DoubleResult[], options?: DoubleOptions) {
  const double = createSupabaseDouble(results, options);
  state.client = double.client;
  return double;
}

function makeRequest(body: unknown, rawText?: string) {
  return new Request("https://ruangkumpul.test/api/view", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: rawText !== undefined ? rawText : JSON.stringify(body),
  });
}

describe("handleViewCountRequest", () => {
  beforeEach(() => {
    state.client = null;
  });

  it("mengembalikan 400 saat body bukan JSON valid", async () => {
    const res = await handleViewCountRequest(makeRequest(null, "{bukan-json"), {
      table: "articles",
      rpcName: "increment_article_view",
      logTag: "[test]",
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Body tidak valid" });
  });

  it("mengembalikan 400 saat slug kosong atau melewati batas panjang", async () => {
    const resEmpty = await handleViewCountRequest(makeRequest({ slug: "   " }), {
      table: "articles",
      rpcName: "increment_article_view",
      logTag: "[test]",
    });
    expect(resEmpty.status).toBe(400);

    const resLong = await handleViewCountRequest(makeRequest({ slug: "a".repeat(221) }), {
      table: "posts",
      rpcName: "increment_post_view",
      logTag: "[test]",
    });
    expect(resLong.status).toBe(400);
  });

  it("mengembalikan 404 saat konten tidak ditemukan atau belum published", async () => {
    const double = setClient({ data: null, error: { message: "Row not found" } });

    const res = await handleViewCountRequest(makeRequest({ slug: "artikel-draft" }), {
      table: "articles",
      rpcName: "increment_article_view",
      logTag: "[test]",
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ ok: false });
    expect(hasCall(double.calls, "eq", "status", "published")).toBe(true);
    expect(double.calls.some((c) => c.method === "rpc")).toBe(false);
  });

  it("memanggil RPC increment_article_view untuk artikel published", async () => {
    const double = setClient(
      { data: { id: "art-1" }, error: null },
      { rpcResults: { data: null, error: null } },
    );

    const res = await handleViewCountRequest(makeRequest({ slug: "panduan-nextjs" }), {
      table: "articles",
      rpcName: "increment_article_view",
      logTag: "[test]",
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(hasCall(double.calls, "from", "articles")).toBe(true);
    const rpcCall = double.calls.find((c) => c.method === "rpc");
    expect(rpcCall?.args).toEqual(["increment_article_view", { article: "art-1" }]);
  });

  it("memanggil RPC increment_post_view dengan argumen p_post untuk diskusi", async () => {
    const double = setClient(
      { data: { id: "post-9" }, error: null },
      { rpcResults: { data: null, error: null } },
    );

    const res = await handleViewCountRequest(makeRequest({ slug: "diskusi-typescript" }), {
      table: "posts",
      rpcName: "increment_post_view",
      logTag: "[test]",
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(hasCall(double.calls, "from", "posts")).toBe(true);
    const rpcCall = double.calls.find((c) => c.method === "rpc");
    expect(rpcCall?.args).toEqual(["increment_post_view", { p_post: "post-9" }]);
  });

  it("mengembalikan 500 saat RPC view counter gagal", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient(
      { data: { id: "art-1" }, error: null },
      { rpcResults: { data: null, error: { message: "rpc boom" } } },
    );

    const res = await handleViewCountRequest(makeRequest({ slug: "panduan-nextjs" }), {
      table: "articles",
      rpcName: "increment_article_view",
      logTag: "[test]",
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ ok: false });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
