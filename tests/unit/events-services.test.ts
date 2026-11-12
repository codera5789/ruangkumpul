import { describe, expect, it, vi } from "vitest";
import { createSupabaseDouble, hasCall, type DoubleResult } from "./supabase-double";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));

import {
  getEventBySlug,
  listUpcomingEvents,
  listUpcomingEventsPaginated,
} from "@/modules/events/services";

function setClient(results: DoubleResult | DoubleResult[]) {
  const double = createSupabaseDouble(results);
  state.client = double.client;
  return double;
}

describe("listUpcomingEvents", () => {
  it("mengembalikan event published dan memfilter starts_at", async () => {
    const rows = [{ id: "e1", title: "Kopdar Jakarta" }];
    const double = setClient({ data: rows, error: null });

    await expect(listUpcomingEvents()).resolves.toEqual(rows);
    expect(hasCall(double.calls, "from", "events")).toBe(true);
    expect(hasCall(double.calls, "eq", "status", "published")).toBe(true);
    expect(double.calls.some((c) => c.method === "gte" && c.args[0] === "starts_at")).toBe(true);
  });

  it("fail-soft: array kosong + log saat query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listUpcomingEvents()).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("listUpcomingEventsPaginated", () => {
  it("mengembalikan events beserta total dari count exact", async () => {
    setClient({ data: [{ id: "e1" }], error: null, count: 7 });

    await expect(listUpcomingEventsPaginated({ page: 1, pageSize: 12 })).resolves.toEqual({
      events: [{ id: "e1" }],
      total: 7,
    });
  });

  it("menerapkan filter format bila diminta", async () => {
    const double = setClient({ data: [], error: null, count: 0 });

    await listUpcomingEventsPaginated({ format: "online" });
    expect(hasCall(double.calls, "eq", "format", "online")).toBe(true);
  });

  it("menghitung range dari page dan pageSize", async () => {
    const double = setClient({ data: [], error: null, count: 0 });

    await listUpcomingEventsPaginated({ page: 2, pageSize: 12 });
    const range = double.calls.find((c) => c.method === "range");
    expect(range?.args).toEqual([12, 23]);
  });

  it("fail-soft: { events: [], total: 0 } saat error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listUpcomingEventsPaginated({})).resolves.toEqual({ events: [], total: 0 });
    spy.mockRestore();
  });
});

describe("getEventBySlug", () => {
  it("mengembalikan event sesuai slug", async () => {
    const event = { id: "e1", slug: "kopdar-jkt" };
    const double = setClient({ data: event, error: null });

    await expect(getEventBySlug("kopdar-jkt")).resolves.toEqual(event);
    expect(hasCall(double.calls, "eq", "slug", "kopdar-jkt")).toBe(true);
  });

  it("null saat tidak ditemukan atau query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "not found" } });

    await expect(getEventBySlug("tidak-ada")).resolves.toBeNull();
    spy.mockRestore();
  });
});
