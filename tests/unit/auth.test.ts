import { describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { hasPasswordIdentity, requireUser } from "@/lib/auth";

describe("hasPasswordIdentity", () => {
  it("true bila daftar providers memuat email", () => {
    expect(hasPasswordIdentity({ app_metadata: { providers: ["email", "google"] } })).toBe(true);
  });

  it("false bila providers ada tetapi tanpa email (OAuth murni)", () => {
    expect(hasPasswordIdentity({ app_metadata: { providers: ["google"] } })).toBe(false);
  });

  it("providers menang atas provider tunggal yang berkonflik", () => {
    expect(
      hasPasswordIdentity({ app_metadata: { provider: "email", providers: ["google"] } }),
    ).toBe(false);
  });

  it("fallback ke provider tunggal saat providers tidak ada", () => {
    expect(hasPasswordIdentity({ app_metadata: { provider: "email" } })).toBe(true);
    expect(hasPasswordIdentity({ app_metadata: { provider: "github" } })).toBe(false);
  });

  it("false tanpa app_metadata sama sekali", () => {
    expect(hasPasswordIdentity({})).toBe(false);
  });
});

describe("requireUser", () => {
  it("mengembalikan client dan user dari sesi aktif", async () => {
    const user = { id: "u1" };
    getUser.mockResolvedValue({ data: { user } });

    const result = await requireUser();
    expect(result.user).toEqual(user);
    expect(result.supabase).toBeDefined();
  });

  it("user null saat belum login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await requireUser();
    expect(result.user).toBeNull();
  });
});
