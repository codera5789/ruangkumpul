import { describe, expect, it, vi } from "vitest";
import { createSupabaseDouble, hasCall, type DoubleResult } from "./supabase-double";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));

import {
  getProductById,
  getProductBySlug,
  listMarketplaceCategories,
  listPublishedProductsPaginated,
  listSellerInquiries,
  listSellerProducts,
} from "@/modules/marketplace/services";

function setClient(results: DoubleResult | DoubleResult[]) {
  const double = createSupabaseDouble(results);
  state.client = double.client;
  return double;
}

describe("listMarketplaceCategories", () => {
  it("mengembalikan daftar kategori terurut", async () => {
    const cats = [{ id: "c1", slug: "template-kode", name: "Template Kode" }];
    const double = setClient({ data: cats, error: null });

    await expect(listMarketplaceCategories()).resolves.toEqual(cats);
    expect(hasCall(double.calls, "from", "marketplace_categories")).toBe(true);
    const orderCall = double.calls.find((c) => c.method === "order" && c.args[0] === "sort_order");
    expect(orderCall?.args[1]).toEqual({ ascending: true });
  });
});

describe("listPublishedProductsPaginated", () => {
  it("memfilter status published dan menghitung range pagination", async () => {
    const double = setClient({ data: [{ id: "p1" }], error: null, count: 15 });

    const res = await listPublishedProductsPaginated({
      page: 2,
      pageSize: 12,
      categoryId: "cat-1",
      productType: "template",
      sort: "price_asc",
    });

    expect(res).toEqual({ products: [{ id: "p1" }], total: 15 });
    expect(hasCall(double.calls, "eq", "status", "published")).toBe(true);
    expect(hasCall(double.calls, "eq", "category_id", "cat-1")).toBe(true);
    expect(hasCall(double.calls, "eq", "product_type", "template")).toBe(true);
    const orderCall = double.calls.find((c) => c.method === "order" && c.args[0] === "price_idr");
    expect(orderCall?.args[1]).toEqual({ ascending: true });
    const range = double.calls.find((c) => c.method === "range");
    expect(range?.args).toEqual([12, 23]);
  });

  it("fail-soft mengembalikan daftar kosong saat query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db error" } });

    await expect(listPublishedProductsPaginated({})).resolves.toEqual({ products: [], total: 0 });
    spy.mockRestore();
  });
});

describe("getProductBySlug & getProductById", () => {
  it("mengembalikan detail produk sesuai slug", async () => {
    const prod = { id: "p1", slug: "starter-kit" };
    const double = setClient({ data: prod, error: null });

    await expect(getProductBySlug("starter-kit")).resolves.toEqual(prod);
    expect(hasCall(double.calls, "eq", "slug", "starter-kit")).toBe(true);
  });

  it("mengembalikan detail produk sesuai id", async () => {
    const prod = { id: "p1", slug: "starter-kit" };
    const double = setClient({ data: prod, error: null });

    await expect(getProductById("p1")).resolves.toEqual(prod);
    expect(hasCall(double.calls, "eq", "id", "p1")).toBe(true);
  });
});

describe("listSellerProducts & listSellerInquiries", () => {
  it("mengambil produk dan inquiry berdasarkan seller_id", async () => {
    const d1 = setClient({ data: [{ id: "p1" }], error: null });
    await expect(listSellerProducts("u1")).resolves.toEqual([{ id: "p1" }]);
    expect(hasCall(d1.calls, "eq", "seller_id", "u1")).toBe(true);

    const d2 = setClient({ data: [{ id: "i1" }], error: null });
    await expect(listSellerInquiries("u1")).resolves.toEqual([{ id: "i1" }]);
    expect(hasCall(d2.calls, "eq", "seller_id", "u1")).toBe(true);
  });
});
