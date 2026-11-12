import { describe, expect, it } from "vitest";
import { visitorKey } from "@/lib/visitor";

function headers(map: Record<string, string>) {
  return { get: (name: string) => map[name.toLowerCase()] ?? null };
}

describe("visitorKey", () => {
  it("menghasilkan hash hex 16 karakter, bukan IP mentah", () => {
    const key = visitorKey(headers({ "x-forwarded-for": "1.2.3.4" }));
    expect(key).toMatch(/^[0-9a-f]{16}$/);
    expect(key).not.toContain("1.2.3.4");
  });

  it("deterministik untuk IP yang sama", () => {
    const a = visitorKey(headers({ "x-forwarded-for": "10.0.0.1" }));
    const b = visitorKey(headers({ "x-forwarded-for": "10.0.0.1" }));
    expect(a).toBe(b);
  });

  it("memakai IP pertama dari rantai x-forwarded-for (sudah di-trim)", () => {
    const chain = visitorKey(headers({ "x-forwarded-for": " 1.2.3.4, 5.6.7.8 " }));
    const single = visitorKey(headers({ "x-forwarded-for": "1.2.3.4" }));
    expect(chain).toBe(single);
  });

  it("jatuh ke x-real-ip saat x-forwarded-for tidak ada", () => {
    const viaRealIp = visitorKey(headers({ "x-real-ip": "9.9.9.9" }));
    const viaForwarded = visitorKey(headers({ "x-forwarded-for": "9.9.9.9" }));
    expect(viaRealIp).toBe(viaForwarded);
  });

  it("x-forwarded-for menang atas x-real-ip", () => {
    const key = visitorKey(headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "9.9.9.9" }));
    expect(key).toBe(visitorKey(headers({ "x-forwarded-for": "1.2.3.4" })));
  });

  it("memakai kunci 'unknown' saat tidak ada header IP", () => {
    const key = visitorKey(headers({}));
    expect(key).toMatch(/^[0-9a-f]{16}$/);
    expect(key).toBe(visitorKey(headers({ "x-real-ip": "" })));
  });

  it("IP berbeda menghasilkan kunci berbeda", () => {
    expect(visitorKey(headers({ "x-forwarded-for": "1.1.1.1" }))).not.toBe(
      visitorKey(headers({ "x-forwarded-for": "8.8.8.8" })),
    );
  });
});
