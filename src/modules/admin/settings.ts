import type { Json } from "@/types/database";

export const PLATFORM_ANNOUNCEMENT_KEY = "platform_announcement";

export interface PlatformAnnouncement {
  enabled: boolean;
  message: string;
  ctaLabel: string;
  ctaHref: string;
}

export const DEFAULT_PLATFORM_ANNOUNCEMENT: PlatformAnnouncement = {
  enabled: false,
  message: "",
  ctaLabel: "",
  ctaHref: "",
};

/**
 * Validasi tautan banner pengumuman: hanya izinkan kosong, path internal (`/path`),
 * atau URL `http://`/`https://` agar tidak terjadi skema berbahaya (`javascript:`).
 */
export function normalizeAnnouncementHref(
  raw: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: "" };

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || trimmed.includes("\\")) {
      return { ok: false, error: "Path internal harus dimulai '/' tunggal tanpa '\\'." };
    }
    return { ok: true, value: trimmed };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "Tautan eksternal harus memakai http:// atau https://." };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "Tautan harus berupa path '/...' atau URL https:// yang valid." };
  }
}

/** Parse nilai JSONB `site_settings` menjadi objek `PlatformAnnouncement` yang aman. */
export function parsePlatformAnnouncement(raw: Json | null | undefined): PlatformAnnouncement {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_PLATFORM_ANNOUNCEMENT;
  }

  const record = raw as Record<string, unknown>;
  const enabled = Boolean(record.enabled);
  const message = typeof record.message === "string" ? record.message.trim().slice(0, 240) : "";
  const ctaLabel = typeof record.ctaLabel === "string" ? record.ctaLabel.trim().slice(0, 40) : "";
  const rawHref = typeof record.ctaHref === "string" ? record.ctaHref : "";
  const checkedHref = normalizeAnnouncementHref(rawHref);

  return {
    enabled,
    message,
    ctaLabel,
    ctaHref: checkedHref.ok ? checkedHref.value : "",
  };
}
