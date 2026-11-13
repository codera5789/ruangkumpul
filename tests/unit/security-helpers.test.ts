import { describe, expect, it } from "vitest";
import {
  formatDateId,
  ilikePattern,
  postgrestIlikePattern,
  safeNext,
  toJsonLd,
} from "@/lib/utils";

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

describe("ilikePattern", () => {
  it("meng-escape wildcard dan backslash tanpa pembungkus tanda kutip", () => {
    expect(ilikePattern("50%_\\a")).toBe("%50\\%\\_\\\\a%");
    expect(ilikePattern('a"b')).toBe('%a"b%');
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
