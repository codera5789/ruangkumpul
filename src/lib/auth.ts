import "server-only";

/**
 * Helper identitas akun. Dipakai server action & halaman pengaturan agar
 * akun OAuth (tanpa password) tidak diminta mengisi password yang tidak ada.
 */
export function hasPasswordIdentity(user: {
  app_metadata?: { provider?: string; providers?: string[] };
}): boolean {
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers)) return providers.includes("email");
  return user.app_metadata?.provider === "email";
}

import { createClient } from "@/lib/supabase/server";

/** Client server Supabase + user sesi saat ini (null jika belum login). */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
