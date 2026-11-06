import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client dengan SERVICE ROLE KEY.
 * Melewati RLS — HANYA untuk operasi server terpercaya (admin, audit, cron).
 * Jangan pernah impor dari Client Component ("server-only" mencegahnya).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tidak tersedia. Operasi admin tidak dapat dijalankan.",
    );
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
