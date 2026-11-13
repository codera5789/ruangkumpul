import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseDouble,
  hasCall,
  type DoubleOptions,
  type DoubleResult,
} from "./supabase-double";

class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`REDIRECT:${url}`);
  }
}

const mocks = vi.hoisted(() => ({
  client: null as unknown,
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new RedirectSignal(url);
  }),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.client,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

import { actionToggleBookmark } from "@/modules/bookmarks/actions";
import { actionRequestPasswordReset, actionSignIn } from "@/modules/auth/actions";
import { actionToggleToolFavorite, logToolUsage } from "@/modules/tools/actions";
import {
  actionSetUserRole,
  actionToggleToolStatus,
  actionUpdateReportStatus,
} from "@/modules/admin/actions";
import {
  actionCreateInquiry,
  actionUpdateProductStatus,
} from "@/modules/marketplace/actions";

const USER_1 = "11111111-1111-4111-8111-111111111111";
const USER_2 = "22222222-2222-4222-8222-222222222222";
const ITEM_1 = "33333333-3333-4333-8333-333333333333";

function setClient(results: DoubleResult | DoubleResult[], options?: DoubleOptions) {
  const double = createSupabaseDouble(results, options);
  mocks.client = double.client;
  return double;
}

describe("Server Actions: tools & bookmarks", () => {
  beforeEach(() => {
    mocks.client = null;
    mocks.revalidatePath.mockClear();
    mocks.redirect.mockClear();
  });

  it("actionToggleToolFavorite menolak slug tidak valid & user belum login", async () => {
    const invalid = await actionToggleToolFavorite("../evil");
    expect(invalid).toEqual({ ok: false, saved: false, error: "Tool tidak valid." });

    setClient([], { user: null });
    const unauth = await actionToggleToolFavorite("word-counter");
    expect(unauth).toEqual({ ok: false, saved: false, error: "login" });
  });

  it("actionToggleToolFavorite menyimpan favorit baru dan menghapus bila sudah ada", async () => {
    const d1 = setClient(
      [{ data: { id: "tool-1" }, error: null }, { data: null, error: null }, { error: null }],
      { user: { id: USER_1 } },
    );
    await expect(actionToggleToolFavorite("Word-Counter")).resolves.toEqual({ ok: true, saved: true });
    expect(hasCall(d1.calls, "eq", "slug", "word-counter")).toBe(true);
    expect(d1.calls.some((c) => c.method === "insert" && c.table === "tool_favorites")).toBe(true);

    const d2 = setClient(
      [
        { data: { id: "tool-1" }, error: null },
        { data: { id: "fav-1" }, error: null },
        { error: null },
      ],
      { user: { id: USER_1 } },
    );
    await expect(actionToggleToolFavorite("word-counter")).resolves.toEqual({
      ok: true,
      saved: false,
    });
    expect(d2.calls.some((c) => c.method === "delete" && c.table === "tool_favorites")).toBe(true);
  });

  it("logToolUsage berhenti diam-diam saat slug invalid atau kuota rate-limit habis", async () => {
    await logToolUsage("bad slug!");
    const limited = setClient([], {
      user: { id: USER_1 },
      rpcResults: { data: false, error: null },
    });
    await logToolUsage("word-counter");
    expect(limited.calls.some((c) => c.table === "tool_usage_logs")).toBe(false);
  });

  it("logToolUsage mencatat log dan menaikkan counter RPC", async () => {
    const double = setClient(
      [{ data: { id: "tool-1" }, error: null }, { error: null }],
      {
        user: null,
        rpcResults: [{ data: true, error: null }, { data: null, error: null }],
      },
    );
    await logToolUsage("diff-checker", "visitor-abc");
    expect(double.calls.some((c) => c.method === "insert" && c.table === "tool_usage_logs")).toBe(
      true,
    );
    expect(
      double.calls.some(
        (c) => c.method === "rpc" && c.args[0] === "increment_tool_usage",
      ),
    ).toBe(true);
  });

  it("actionToggleBookmark memvalidasi input, rate-limit, dan memanggil revalidatePath", async () => {
    await expect(actionToggleBookmark("tool", "")).resolves.toEqual({
      ok: false,
      saved: false,
      error: "Resource tidak valid.",
    });

    setClient([], { user: { id: USER_1 }, rpcResults: { data: false, error: null } });
    await expect(actionToggleBookmark("article", ITEM_1)).resolves.toEqual({
      ok: false,
      saved: false,
      error: "Terlalu cepat. Tunggu sebentar.",
    });

    const d = setClient(
      [{ data: null, error: null }, { error: null }],
      { user: { id: USER_1 }, rpcResults: { data: true, error: null } },
    );
    await expect(actionToggleBookmark("article", ITEM_1)).resolves.toEqual({
      ok: true,
      saved: true,
    });
    expect(d.calls.some((c) => c.method === "insert" && c.table === "bookmarks")).toBe(true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/bookmark");
  });
});

describe("Server Actions: auth", () => {
  beforeEach(() => {
    mocks.client = null;
    mocks.redirect.mockClear();
  });

  it("actionSignIn mengembalikan error terjemahan saat kredensial salah", async () => {
    setClient([], {
      authResults: {
        signInWithPassword: { data: null, error: { message: "Invalid login credentials" } },
      },
    });

    const fd = new FormData();
    fd.set("email", "user@example.com");
    fd.set("password", "salah123");

    const res = await actionSignIn({ error: null, success: null }, fd);
    expect(res).toEqual({ error: "Email atau password salah.", success: null });
  });

  it("actionSignIn menjaga redirect internal melalui safeNext", async () => {
    setClient([], {
      authResults: { signInWithPassword: { data: { session: {} }, error: null } },
    });

    const fd = new FormData();
    fd.set("email", "user@example.com");
    fd.set("password", "rahasia123");
    fd.set("next", "//evil.com");

    await expect(actionSignIn({ error: null, success: null }, fd)).rejects.toMatchObject({
      url: "/dashboard",
    });
  });

  it("actionRequestPasswordReset tidak membocorkan error email atau status akun", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setClient([], {
      authResults: {
        resetPasswordForEmail: { data: null, error: { message: "User not found" } },
      },
    });

    const fd = new FormData();
    fd.set("email", "tidak-ada@example.com");

    const res = await actionRequestPasswordReset({ error: null, success: null }, fd);
    expect(res.error).toBeNull();
    expect(res.success).toContain("Jika email terdaftar");
    errSpy.mockRestore();
  });
});

describe("Server Actions: admin & marketplace", () => {
  beforeEach(() => {
    mocks.client = null;
    mocks.revalidatePath.mockClear();
  });

  it("actionSetUserRole menolak non-admin, eskalasi ke super_admin oleh admin biasa, dan ubah diri sendiri", async () => {
    setClient([], { user: { id: USER_1 }, rpcResults: { data: false, error: null } });
    const fd = new FormData();
    fd.set("userId", USER_2);
    fd.set("role", "moderator");
    fd.set("action", "add");
    await expect(actionSetUserRole({ error: null, success: null }, fd)).resolves.toEqual({
      error: "Akses ditolak. Khusus admin.",
      success: null,
    });

    // Admin biasa tidak boleh memberi role admin.
    setClient([{ data: [{ role: "admin" }], error: null }], {
      user: { id: USER_1 },
      rpcResults: { data: true, error: null },
    });
    fd.set("role", "admin");
    await expect(actionSetUserRole({ error: null, success: null }, fd)).resolves.toEqual({
      error: "Hanya super admin yang boleh mengatur role admin.",
      success: null,
    });

    // Tidak bisa mengubah role akun sendiri.
    setClient([{ data: [{ role: "super_admin" }], error: null }], {
      user: { id: USER_1 },
      rpcResults: { data: true, error: null },
    });
    fd.set("userId", USER_1);
    fd.set("role", "moderator");
    await expect(actionSetUserRole({ error: null, success: null }, fd)).resolves.toEqual({
      error: "Tidak bisa mengubah role akun sendiri.",
      success: null,
    });
  });

  it("actionSetUserRole sukses mencatat audit_logs ketika super_admin mengubah role user lain", async () => {
    const double = setClient(
      [{ data: [{ role: "super_admin" }], error: null }, { error: null }, { error: null }],
      { user: { id: USER_1 }, rpcResults: { data: true, error: null } },
    );

    const fd = new FormData();
    fd.set("userId", USER_2);
    fd.set("role", "moderator");
    fd.set("action", "add");

    const res = await actionSetUserRole({ error: null, success: null }, fd);
    expect(res).toEqual({ error: null, success: "Role diperbarui." });
    expect(double.calls.some((c) => c.method === "upsert" && c.table === "user_roles")).toBe(true);
    expect(double.calls.some((c) => c.method === "insert" && c.table === "audit_logs")).toBe(true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("actionUpdateReportStatus & actionToggleToolStatus memvalidasi UUID serta melewatkan audit bila DB gagal", async () => {
    const dInvalid = setClient([], {
      user: { id: USER_1 },
      rpcResults: { data: true, error: null },
    });
    const fdInvalid = new FormData();
    fdInvalid.set("reportId", "bukan-uuid");
    fdInvalid.set("status", "resolved");
    await actionUpdateReportStatus(fdInvalid);
    expect(dInvalid.calls.some((c) => c.table === "reports")).toBe(false);

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dFail = setClient({ error: { message: "rls blocked" } }, {
      user: { id: USER_1 },
      rpcResults: { data: true, error: null },
    });
    const fdTool = new FormData();
    fdTool.set("toolId", ITEM_1);
    fdTool.set("nextStatus", "inactive");
    await actionToggleToolStatus(fdTool);
    expect(dFail.calls.some((c) => c.table === "tools")).toBe(true);
    expect(dFail.calls.some((c) => c.table === "audit_logs")).toBe(false);
    errSpy.mockRestore();
  });

  it("actionCreateInquiry menolak inquiry ke produk milik sendiri dan menyimpan inquiry valid", async () => {
    const fd = new FormData();
    fd.set("productId", ITEM_1);
    fd.set("buyerName", "Siti Rahma");
    fd.set("buyerContact", "siti@example.com");
    fd.set("message", "Halo, apakah source code sudah termasuk dokumentasi instalasi?");

    setClient(
      [{ data: { id: ITEM_1, seller_id: USER_1, slug: "starter-kit", status: "published" }, error: null }],
      { user: { id: USER_1 }, rpcResults: { data: true, error: null } },
    );
    const selfRes = await actionCreateInquiry({ error: null, success: null }, fd);
    expect(selfRes.error).toContain("produk milik sendiri");

    const dValid = setClient(
      [
        { data: { id: ITEM_1, seller_id: USER_2, slug: "starter-kit", status: "published" }, error: null },
        { error: null },
      ],
      { user: { id: USER_1 }, rpcResults: { data: true, error: null } },
    );
    const okRes = await actionCreateInquiry({ error: null, success: null }, fd);
    expect(okRes).toEqual({
      error: null,
      success: "Pesan inquiry berhasil dikirim ke kreator.",
    });
    const insertCall = dValid.calls.find(
      (c) => c.method === "insert" && c.table === "product_inquiries",
    );
    expect(insertCall?.args[0]).toMatchObject({
      product_id: ITEM_1,
      buyer_id: USER_1,
      seller_id: USER_2,
      status: "new",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/marketplace/starter-kit");
  });

  it("actionUpdateProductStatus mengabaikan status tidak valid dan memperbarui status valid", async () => {
    const dBad = setClient([], { user: { id: USER_1 } });
    const fdBad = new FormData();
    fdBad.set("productSlug", "starter-kit");
    fdBad.set("status", "deleted");
    await actionUpdateProductStatus(fdBad);
    expect(dBad.calls.length).toBe(0);

    const dOk = setClient({ error: null }, { user: { id: USER_1 } });
    const fdOk = new FormData();
    fdOk.set("productSlug", "starter-kit");
    fdOk.set("status", "archived");
    await actionUpdateProductStatus(fdOk);
    expect(hasCall(dOk.calls, "eq", "slug", "starter-kit")).toBe(true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/marketplace/starter-kit");
  });
});
