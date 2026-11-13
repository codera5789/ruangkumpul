import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLATFORM_ANNOUNCEMENT,
  normalizeAnnouncementHref,
  parsePlatformAnnouncement,
} from "@/modules/admin/settings";

describe("normalizeAnnouncementHref", () => {
  it("mengizinkan kosong dan path internal valid", () => {
    expect(normalizeAnnouncementHref("   ")).toEqual({ ok: true, value: "" });
    expect(normalizeAnnouncementHref("/event")).toEqual({ ok: true, value: "/event" });
    expect(normalizeAnnouncementHref("/artikel?tag=nextjs#atas")).toEqual({
      ok: true,
      value: "/artikel?tag=nextjs#atas",
    });
  });

  it("mengizinkan URL https dan http", () => {
    expect(normalizeAnnouncementHref("https://ruangkumpul.id/event")).toEqual({
      ok: true,
      value: "https://ruangkumpul.id/event",
    });
    expect(normalizeAnnouncementHref("http://localhost:3000/tools")).toEqual({
      ok: true,
      value: "http://localhost:3000/tools",
    });
  });

  it("menolak protocol-relative, backslash, dan skema berbahaya", () => {
    expect(normalizeAnnouncementHref("//evil.com").ok).toBe(false);
    expect(normalizeAnnouncementHref("/\\evil.com").ok).toBe(false);
    expect(normalizeAnnouncementHref("javascript:alert(1)").ok).toBe(false);
    expect(normalizeAnnouncementHref("data:text/html,<script>").ok).toBe(false);
    expect(normalizeAnnouncementHref("bukan-url").ok).toBe(false);
  });
});

describe("parsePlatformAnnouncement", () => {
  it("mengembalikan default untuk JSON kosong, primitif, atau array", () => {
    expect(parsePlatformAnnouncement(null)).toEqual(DEFAULT_PLATFORM_ANNOUNCEMENT);
    expect(parsePlatformAnnouncement(undefined)).toEqual(DEFAULT_PLATFORM_ANNOUNCEMENT);
    expect(parsePlatformAnnouncement("teks")).toEqual(DEFAULT_PLATFORM_ANNOUNCEMENT);
    expect(parsePlatformAnnouncement(["a"])).toEqual(DEFAULT_PLATFORM_ANNOUNCEMENT);
  });

  it("mensanitasi ctaHref berbahaya dan membatasi panjang field", () => {
    const longMsg = "A".repeat(300);
    const longLabel = "B".repeat(60);

    const parsed = parsePlatformAnnouncement({
      enabled: true,
      message: `  ${longMsg}  `,
      ctaLabel: ` ${longLabel} `,
      ctaHref: "javascript:alert(1)",
    });

    expect(parsed.enabled).toBe(true);
    expect(parsed.message).toHaveLength(240);
    expect(parsed.ctaLabel).toHaveLength(40);
    expect(parsed.ctaHref).toBe("");
  });

  it("mempertahankan tautan valid yang sudah dinormalisasi", () => {
    expect(
      parsePlatformAnnouncement({
        enabled: true,
        message: "Event akhir pekan sudah dibuka",
        ctaLabel: "Lihat event",
        ctaHref: " /event ",
      }),
    ).toEqual({
      enabled: true,
      message: "Event akhir pekan sudah dibuka",
      ctaLabel: "Lihat event",
      ctaHref: "/event",
    });
  });
});
