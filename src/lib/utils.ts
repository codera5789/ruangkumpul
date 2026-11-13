import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Ubah judul menjadi URL-safe slug, mis. "Cara Cepat Belajar!" -> "cara-cepat-belajar" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Bentuk slug unik dengan sufiks acak 6 karakter dari `crypto.randomUUID()`. */
export function uniqueSlug(text: string, fallback = "item", maxBaseLength = 180): string {
  const base = slugify(text).slice(0, maxBaseLength).replace(/-+$/g, "") || fallback;
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Format angka gaya Indonesia: 1.2k, 15.3k, 2.1jt */
export function formatCompactId(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Format tanggal gaya Indonesia: 7 November 2026 */
export function formatDateId(
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: "Asia/Jakarta" }).format(d);
}

/** Tanggal relatif gaya Indonesia: "3 menit lalu", "2 hari lalu" */
export function timeAgoId(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, secondsInUnit] of units) {
    const delta = Math.floor(seconds / secondsInUnit);
    if (delta >= 1 || unit === "second") {
      return rtf.format(-delta, unit);
    }
  }
  return "baru saja";
}

/** Potong teks ke panjang tertentu dengan elipsis */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "…";
}

/**
 * Serialisasi JSON untuk `<script type="application/ld+json">`.
 * `JSON.stringify` tidak meng-escape `<`, sehingga judul/deskripsi yang
 * mengandung `</script>` bisa keluar dari tag dan menjadi stored XSS.
 * Escape `<` (cukup untuk mencegah breakout) agar aman dipakai dengan
 * `dangerouslySetInnerHTML`.
 */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function escapeIlikeWildcards(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/[%_]/g, (match) => `\\${match}`);
}

/** Bangun pola `ILIKE` tanpa kutip untuk pemanggilan `.ilike(column, pattern)` langsung. */
export function ilikePattern(input: string): string {
  return `%${escapeIlikeWildcards(input)}%`;
}

/**
 * Bangun nilai filter PostgREST `ILIKE` yang aman untuk `.or(...)`.
 * Nilai dibungkus tanda kutip ganda agar koma/tanda kurung dari input pengguna
 * tidak memecah logika filter, dan `%`/`_`/`\` di-escape sebagai literal.
 */
export function postgrestIlikePattern(input: string): string {
  return `"%${escapeIlikeWildcards(input).replace(/"/g, '\\"')}%"`;
}

/**
 * Sanitasi parameter `next` untuk redirect internal.
 * Menolak URL absolut, protocol-relative (`//evil.com`), dan trik
 * backslash (`/\evil.com`) yang dinormalisasi browser menjadi host lain.
 */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  try {
    const base = "https://ruangkumpul.internal";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
