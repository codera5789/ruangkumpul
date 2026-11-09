import "server-only";

import { createHash } from "node:crypto";

/**
 * Kunci visitor anonim untuk rate limiting — hash dari IP, bukan IP mentah,
 * sehingga tidak ada alamat IP yang tersimpan di database.
 */
export function visitorKey(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
