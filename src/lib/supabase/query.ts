import { unstable_rethrow } from "next/navigation";

/**
 * Jalankan query fail-soft agar kegagalan DB/Prerender non-fatal tidak menjatuhkan
 * seluruh halaman publik/dashboard, sambil tetap melempar ulang signal Next.js
 * (`notFound`, `redirect`, `connection`) lewat `unstable_rethrow`.
 */
export async function withFailSoft<T>(tag: string, fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    console.error(tag, err);
    return fallback;
  }
}
