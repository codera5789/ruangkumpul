import { describe, expect, it } from "vitest";
import { formatWibDateTimeLocal, parseWibDateTime } from "@/lib/datetime";

describe("parseWibDateTime", () => {
  it("mem-parse nilai datetime-local sebagai WIB (UTC+7)", () => {
    expect(parseWibDateTime("2026-11-10T19:00")?.toISOString()).toBe(
      "2026-11-10T12:00:00.000Z",
    );
  });

  it("menerima komponen detik opsional", () => {
    expect(parseWibDateTime("2026-11-10T19:00:30")?.toISOString()).toBe(
      "2026-11-10T12:00:30.000Z",
    );
  });

  it("memangkas spasi di sekitar input", () => {
    expect(parseWibDateTime("  2026-11-10T19:00  ")?.toISOString()).toBe(
      "2026-11-10T12:00:00.000Z",
    );
  });

  it("menggeser tanggal mundur saat waktu WIB melewati tengah malam UTC", () => {
    // 03:00 WIB = 20:00 UTC hari sebelumnya
    expect(parseWibDateTime("2026-11-10T03:00")?.toISOString()).toBe(
      "2026-11-09T20:00:00.000Z",
    );
  });

  it("mengembalikan null untuk format non datetime-local", () => {
    expect(parseWibDateTime("2026-11-10 19:00")).toBeNull();
    expect(parseWibDateTime("10/11/2026 19:00")).toBeNull();
    expect(parseWibDateTime("2026-11-10T19:00Z")).toBeNull();
    expect(parseWibDateTime("")).toBeNull();
  });

  it("menolak rentang bulan, hari, dan jam yang tidak sah", () => {
    expect(parseWibDateTime("2026-13-01T00:00")).toBeNull();
    expect(parseWibDateTime("2026-00-10T00:00")).toBeNull();
    expect(parseWibDateTime("2026-11-00T00:00")).toBeNull();
    expect(parseWibDateTime("2026-11-32T00:00")).toBeNull();
    expect(parseWibDateTime("2026-11-10T24:00")).toBeNull();
    expect(parseWibDateTime("2026-11-10T19:60")).toBeNull();
    expect(parseWibDateTime("2026-11-10T19:00:60")).toBeNull();
  });

  it("menolak tanggal yang tidak ada di kalender", () => {
    expect(parseWibDateTime("2026-02-30T10:00")).toBeNull();
    expect(parseWibDateTime("2026-02-29T10:00")).toBeNull(); // 2026 bukan tahun kabisat
    expect(parseWibDateTime("2026-04-31T10:00")).toBeNull();
  });

  it("menerima 29 Februari pada tahun kabisat", () => {
    expect(parseWibDateTime("2028-02-29T07:00")?.toISOString()).toBe(
      "2028-02-29T00:00:00.000Z",
    );
  });
});

describe("formatWibDateTimeLocal", () => {
  it("memformat ISO UTC ke datetime-local WIB termasuk saat melintasi batas hari dan tahun", () => {
    expect(formatWibDateTimeLocal("2026-11-10T12:00:00.000Z")).toBe("2026-11-10T19:00");
    expect(formatWibDateTimeLocal("2026-11-10T20:00:00.000Z")).toBe("2026-11-11T03:00");
    expect(formatWibDateTimeLocal("2026-12-31T18:05:00.000Z")).toBe("2027-01-01T01:05");
  });

  it("mengembalikan string kosong untuk nilai kosong atau tidak valid", () => {
    expect(formatWibDateTimeLocal(null)).toBe("");
    expect(formatWibDateTimeLocal(undefined)).toBe("");
    expect(formatWibDateTimeLocal("")).toBe("");
    expect(formatWibDateTimeLocal("bukan-tanggal")).toBe("");
  });
});
