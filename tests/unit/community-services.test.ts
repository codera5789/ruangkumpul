import { describe, expect, it, vi } from "vitest";
import { createSupabaseDouble, hasCall, type DoubleResult } from "./supabase-double";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));

import {
  listPublicCommunitiesPaginated,
  listTopCommunities,
} from "@/modules/community/services";

function setClient(results: DoubleResult | DoubleResult[]) {
  const double = createSupabaseDouble(results);
  state.client = double.client;
  return double;
}

describe("listTopCommunities", () => {
  it("mengembalikan komunitas publik aktif terurut jumlah anggota", async () => {
    const rows = [{ id: "c1", name: "Kotlin User" }];
    const double = setClient({ data: rows, error: null });

    await expect(listTopCommunities()).resolves.toEqual(rows);
    expect(hasCall(double.calls, "from", "communities")).toBe(true);
    expect(hasCall(double.calls, "eq", "visibility", "public")).toBe(true);
    expect(hasCall(double.calls, "eq", "status", "active")).toBe(true);
  });

  it("fail-soft: array kosong + log saat query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listTopCommunities()).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("listPublicCommunitiesPaginated", () => {
  it("mengembalikan communities beserta total dari count exact", async () => {
    setClient({ data: [{ id: "c1" }], error: null, count: 42 });

    await expect(listPublicCommunitiesPaginated({})).resolves.toEqual({
      communities: [{ id: "c1" }],
      total: 42,
    });
  });

  it("menghitung range di database, bukan slice di memori", async () => {
    const double = setClient({ data: [], error: null, count: 0 });

    await listPublicCommunitiesPaginated({ page: 2, pageSize: 24 });
    const range = double.calls.find((c) => c.method === "range");
    expect(range?.args).toEqual([24, 47]);
  });

  it("fail-soft: { communities: [], total: 0 } saat error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listPublicCommunitiesPaginated({})).resolves.toEqual({
      communities: [],
      total: 0,
    });
    spy.mockRestore();
  });
});
