import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client dengan SERVICE ROLE KEY (melewati RLS) — HANYA untuk operasi
 * server terpercaya (hapus akun, cron, webhook). Jangan pernah impor dari
 * Client Component ("server-only" mencegahnya).
 *
 * Jika SUPABASE_SERVICE_ROLE_KEY tidak diset, mengembalikan null — pemanggil
 * wajib fallback ke client biasa (operasi tetap berjalan lewat RLS untuk admin).
 */
export function createAdminClient(): ReturnType<
  typeof createServerClient<Database>
> | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Client service-role tidak berbasis sesi pengguna.
        },
      },
    },
  );
}
