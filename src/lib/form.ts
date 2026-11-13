import type { z } from "zod";

/** State standar untuk Server Action berbasis form React `useActionState`. */
export interface ActionState<TField extends string = string> {
  error: string | null;
  success: string | null;
  fieldErrors?: Partial<Record<TField, string>> & Record<string, string | undefined>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validasi format UUID standar (v1-v8 / v4) secara ketat. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

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
