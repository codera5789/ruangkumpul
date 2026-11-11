import type { z } from "zod";

/** Peta error zod → `{ field: pesan }`. Pesan pertama per field menang;
 *  issue tanpa field dipetakan ke kunci "form". */
export function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Nomor halaman aman dari query param: clamp ke 1..max (default 100). */
export function parsePageParam(raw: string | null | undefined, max = 100): number {
  return Math.max(1, Math.min(max, Number(raw) || 1));
}
