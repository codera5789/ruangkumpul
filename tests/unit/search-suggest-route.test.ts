import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseDouble, hasCall, type DoubleResult } from "./supabase-double";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));

import { GET } from "@/app/api/search/suggest/route";

function setClient(results: DoubleResult | DoubleResult[]) {
  const double = createSupabaseDouble(results);
  state.client = double.client;
  return double;
}

describe("GET /api/search/suggest", () => {
  beforeEach(() => {
    state.client = null;
  });

  it("mengembalikan array kosong jika query kurang dari 2 karakter", async () => {
    const req = new NextRequest("https://ruangkumpul.test/api/search/suggest?q=a");
    const res = await GET(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ results: [] });
  });

  it("memakai ilikePattern tanpa pembungkus kutip pada filter .ilike()", async () => {
    const double = setClient([
      { data: [{ title: "Diskon 50%_Spec", slug: "diskon-50" }], error: null },
      { data: [{ name: "Komunitas 50%_Dev", slug: "kom-50" }], error: null },
      { data: [{ title: "Kit 50%_UI", slug: "kit-50" }], error: null },
    ]);

    const req = new NextRequest("https://ruangkumpul.test/api/search/suggest?q=50%25_");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = (await res.json()) as { results: Array<{ type: string; href: string }> };
    expect(json.results).toEqual([
      { type: "article", title: "Diskon 50%_Spec", href: "/artikel/diskon-50" },
      { type: "community", title: "Komunitas 50%_Dev", href: "/komunitas/kom-50" },
      { type: "product", title: "Kit 50%_UI", href: "/marketplace/kit-50" },
    ]);

    expect(hasCall(double.calls, "ilike", "title", "%50\\%\\_%")).toBe(true);
    expect(hasCall(double.calls, "ilike", "name", "%50\\%\\_%")).toBe(true);
    // Pastikan tidak memakai pola berkutip ganda milik .or(...)
    expect(double.calls.some((c) => c.method === "ilike" && String(c.args[1]).startsWith('"'))).toBe(
      false,
    );
  });

  it("menggabungkan hasil tool statis + database dan membatasi maksimal 8 item", async () => {
    setClient([
      {
        data: [
          { title: "Artikel JSON 1", slug: "a1" },
          { title: "Artikel JSON 2", slug: "a2" },
          { title: "Artikel JSON 3", slug: "a3" },
          { title: "Artikel JSON 4", slug: "a4" },
        ],
        error: null,
      },
      {
        data: [
          { name: "Komunitas JSON 1", slug: "c1" },
          { name: "Komunitas JSON 2", slug: "c2" },
          { name: "Komunitas JSON 3", slug: "c3" },
        ],
        error: null,
      },
      {
        data: [
          { title: "Produk JSON 1", slug: "p1" },
          { title: "Produk JSON 2", slug: "p2" },
          { title: "Produk JSON 3", slug: "p3" },
        ],
        error: null,
      },
    ]);

    const req = new NextRequest("https://ruangkumpul.test/api/search/suggest?q=json");
    const res = await GET(req);
    const json = (await res.json()) as { results: Array<{ type: string }> };

    expect(res.status).toBe(200);
    expect(json.results.length).toBe(8);
    expect(json.results.some((r) => r.type === "tool")).toBe(true);
  });
});
