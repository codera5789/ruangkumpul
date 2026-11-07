import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Rate limiting berbasis database (tabel rate_limit_hits + RPC check_rate_limit).
 * Aman untuk lingkungan serverless/multi-instance — tidak bergantung memori proses.
 *
 * Contoh: await enforceRateLimit(`comment:${user.id}`, 10, 600)
 *   → true jika lolos; melempar RateLimitError jika melebihi kuota.
 */
export class RateLimitError extends Error {
  constructor(
    public readonly retryAfterSeconds: number,
  ) {
    super("Terlalu banyak permintaan. Coba lagi nanti.");
    this.name = "RateLimitError";
  }
}

const DEFAULT_RETRY_AFTER = 60;

/**
 * Cek dan catat satu hit pada bucket. Lempar RateLimitError jika kuota habis.
 * @param bucket    Kunci unik, mis. `comment:<userId>`
 * @param maxHits   Jumlah maksimum hit dalam jendela waktu
 * @param windowSec Jendela waktu dalam detik
 * @param retryAfter Saran tunggu (detik) untuk pesan error
 */
export async function enforceRateLimit(
  bucket: string,
  maxHits: number,
  windowSec: number,
  retryAfter = DEFAULT_RETRY_AFTER,
): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_max_hits: maxHits,
    p_window_seconds: windowSec,
  });

  // Gagal infrastruktur rate limit TIDAK boleh memblokir aksi utama —
  // RLS + validasi input tetap menjadi lapisan utama.
  if (error) {
    console.error("[rate-limit] rpc gagal:", error.message);
    return;
  }

  if (data === false) {
    throw new RateLimitError(retryAfter);
  }
}

/** Varian non-throw untuk pemanggilan kondisional. */
export async function checkRateLimit(
  bucket: string,
  maxHits: number,
  windowSec: number,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_max_hits: maxHits,
    p_window_seconds: windowSec,
  });

  if (error) {
    console.error("[rate-limit] rpc gagal:", error.message);
    return true; // fail-open, konsisten dengan enforceRateLimit
  }

  return data !== false;
}
