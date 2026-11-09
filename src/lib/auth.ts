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
