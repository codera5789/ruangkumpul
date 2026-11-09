import { describe, expect, it, vi, beforeEach } from "vitest";

const rpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc })),
}));

import { enforceRateLimit, checkRateLimit, RateLimitError } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("lolos saat RPC mengembalikan true", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(enforceRateLimit("comment:u1", 8, 60)).resolves.toBeUndefined();
  });

  it("melempar RateLimitError saat kuota habis", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(enforceRateLimit("comment:u1", 8, 60, 120)).rejects.toMatchObject({
      name: "RateLimitError",
      retryAfterSeconds: 120,
    });
    await expect(enforceRateLimit("comment:u1", 8, 60)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("fail-open saat RPC error (tidak memblokir aksi utama)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(enforceRateLimit("comment:u1", 8, 60)).resolves.toBeUndefined();
    await expect(checkRateLimit("comment:u1", 8, 60)).resolves.toBe(true);
    spy.mockRestore();
  });

  it("checkRateLimit false saat kuota habis", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(checkRateLimit("comment:u1", 8, 60)).resolves.toBe(false);
  });
});
