import { describe, expect, it } from "vitest";
import {
  formatDateId,
  postgrestIlikePattern,
  safeNext,
  toJsonLd,
} from "@/lib/utils";
import { parseWibDateTime } from "@/lib/datetime";
import { hasPasswordIdentity } from "@/lib/auth";

describe("safeNext", () => {
  it("mempertahankan path internal", () => {
    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("/artikel?x=1#komentar")).toBe("/artikel?x=1#komentar");
  });

  it("menolak URL absolut dan protocol-relative", () => {
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("javascript:alert(1)")).toBe("/dashboard");
  });

  it("menolak trik backslash yang dinormalisasi browser", () => {
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
  });

  it("memakai fallback untuk nilai kosong", () => {
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext(undefined, "/login")).toBe("/login");
  });
});

describe("toJsonLd", () => {
  it("meng-escape < agar tidak bisa keluar dari tag script", () => {
    const payload = toJsonLd({ title: "</script><script>alert(1)</script>" });
    expect(payload).not.toContain("</script");
    expect(payload).toContain("\\u003c");
    // Tetap JSON valid.
    expect(JSON.parse(payload).title).toContain("<script>");
  });
});

describe("postgrestIlikePattern", () => {
  it("membungkus nilai dengan tanda kutip agar koma/kurung tidak memecah filter", () => {
    expect(postgrestIlikePattern("a,b(c)")).toBe('"%a,b(c)%"');
  });

  it("meng-escape wildcard dan tanda kutip", () => {
    expect(postgrestIlikePattern("50%_")).toBe('"%50\\%\\_%"');
    expect(postgrestIlikePattern('a"b')).toBe('"%a\\"b%"');
  });
});

describe("formatDateId", () => {
  it("memakai zona Asia/Jakarta, bukan zona server", () => {
    // 6 Nov 2026 18:00 UTC = 7 Nov 2026 01:00 WIB.
    expect(formatDateId("2026-11-06T18:00:00.000Z")).toBe("7 November 2026");
  });
});

describe("parseWibDateTime", () => {
  it("menafsirkan datetime-local sebagai WIB (UTC+7)", () => {
    expect(parseWibDateTime("2026-11-10T19:00")?.toISOString()).toBe(
      "2026-11-10T12:00:00.000Z",
    );
  });

  it("menerima komponen detik opsional", () => {
    expect(parseWibDateTime("2026-11-10T19:30:45")?.toISOString()).toBe(
      "2026-11-10T12:30:45.000Z",
    );
  });

  it("menolak format dan tanggal yang tidak valid", () => {
    expect(parseWibDateTime("abc")).toBeNull();
    expect(parseWibDateTime("2026-02-31T10:00")).toBeNull();
    expect(parseWibDateTime("2026-11-10T24:00")).toBeNull();
  });
});

describe("hasPasswordIdentity", () => {
  it("mendeteksi akun email/password", () => {
    expect(hasPasswordIdentity({ app_metadata: { provider: "email" } })).toBe(true);
    expect(hasPasswordIdentity({ app_metadata: { providers: ["email"] } })).toBe(true);
  });

  it("mendeteksi akun OAuth tanpa password", () => {
    expect(hasPasswordIdentity({ app_metadata: { provider: "google" } })).toBe(false);
    expect(hasPasswordIdentity({ app_metadata: { providers: ["google"] } })).toBe(false);
  });
});
