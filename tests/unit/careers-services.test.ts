import { describe, expect, it, vi } from "vitest";
import { createSupabaseDouble, hasCall, type DoubleResult } from "./supabase-double";

const state = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));

import {
  JOB_TYPE_LABELS,
  getJobBySlug,
  listPublishedJobs,
  listPublishedJobsPaginated,
} from "@/modules/careers/services";

function setClient(results: DoubleResult | DoubleResult[]) {
  const double = createSupabaseDouble(results);
  state.client = double.client;
  return double;
}

describe("listPublishedJobs", () => {
  it("mengembalikan data dan memfilter status published", async () => {
    const jobs = [{ id: "j1", title: "Lowongan A" }];
    const double = setClient({ data: jobs, error: null });

    await expect(listPublishedJobs()).resolves.toEqual(jobs);
    expect(hasCall(double.calls, "from", "job_listings")).toBe(true);
    expect(hasCall(double.calls, "eq", "status", "published")).toBe(true);
  });

  it("fail-soft: array kosong + log saat query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listPublishedJobs()).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("listPublishedJobsPaginated", () => {
  it("mengembalikan jobs beserta total dari count exact", async () => {
    setClient({ data: [{ id: "j1" }], error: null, count: 13 });

    await expect(listPublishedJobsPaginated({ page: 2, pageSize: 12 })).resolves.toEqual({
      jobs: [{ id: "j1" }],
      total: 13,
    });
  });

  it("menerapkan filter jobType bila diminta", async () => {
    const double = setClient({ data: [], error: null, count: 0 });

    await listPublishedJobsPaginated({ jobType: "internship" });
    expect(hasCall(double.calls, "eq", "job_type", "internship")).toBe(true);
  });

  it("tidak memfilter jobType bila tidak diminta", async () => {
    const double = setClient({ data: [], error: null, count: 0 });

    await listPublishedJobsPaginated({});
    expect(double.calls.some((c) => c.method === "eq" && c.args[0] === "job_type")).toBe(false);
  });

  it("menghitung range dari page dan pageSize", async () => {
    const double = setClient({ data: [], error: null, count: 0 });

    await listPublishedJobsPaginated({ page: 3, pageSize: 10 });
    const range = double.calls.find((c) => c.method === "range");
    expect(range?.args).toEqual([20, 29]);
  });

  it("fail-soft: { jobs: [], total: 0 } saat error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "db down" } });

    await expect(listPublishedJobsPaginated({})).resolves.toEqual({ jobs: [], total: 0 });
    spy.mockRestore();
  });
});

describe("getJobBySlug", () => {
  it("mengembalikan job sesuai slug", async () => {
    const job = { id: "j1", slug: "frontend-dev" };
    const double = setClient({ data: job, error: null });

    await expect(getJobBySlug("frontend-dev")).resolves.toEqual(job);
    expect(hasCall(double.calls, "eq", "slug", "frontend-dev")).toBe(true);
  });

  it("null saat tidak ditemukan atau query error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient({ data: null, error: { message: "not found" } });

    await expect(getJobBySlug("tidak-ada")).resolves.toBeNull();
    spy.mockRestore();
  });
});

describe("JOB_TYPE_LABELS", () => {
  it("melabeli seluruh tipe lowongan", () => {
    expect(Object.keys(JOB_TYPE_LABELS).sort()).toEqual([
      "contract",
      "freelance",
      "full_time",
      "internship",
      "part_time",
    ]);
  });
});
