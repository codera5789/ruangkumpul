"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
}

const emailSchema = z.string().trim().toLowerCase().email("Format email tidak valid");
const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter");

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Peta pesan error Supabase ke Bahasa Indonesia yang ramah pengguna. */
function translateAuthError(message: string): string {
  const map: Array<[RegExp, string]> = [
    [/invalid login credentials/i, "Email atau password salah."],
    [/email not confirmed/i, "Email belum dikonfirmasi. Cek kotak masuk atau spam Anda."],
    [/user already registered/i, "Email sudah terdaftar. Silakan masuk atau gunakan email lain."],
    [/rate limit|too many/i, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."],
    [/password should be at least/i, "Password terlalu lemah. Gunakan minimal 8 karakter."],
    [/signup requires a valid password/i, "Password terlalu lemah. Gunakan minimal 8 karakter."],
    [/valid email is required/i, "Format email tidak valid."],
    [/email_address_invalid|email address .* is invalid/i, "Email tidak diterima. Gunakan alamat email yang valid dan aktif."],
  ];
  for (const [pattern, text] of map) {
    if (pattern.test(message)) return text;
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("host") ?? "localhost:3000";
  // Normalisasi: buang trailing slash agar tidak menghasilkan `//auth/callback`
  return (process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`).replace(/\/+$/, "");
}

export async function actionSignIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Password wajib diisi") })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: translateAuthError(error.message), success: null };
  }

  const next = String(formData.get("next") || "/dashboard");
  // next hanya boleh path internal
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(safeNext);
}

export async function actionSignUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2, "Nama minimal 2 karakter").max(120, "Nama terlalu panjang"),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await getOrigin()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message), success: null };
  }

  // Jika konfirmasi email diwajibkan Supabase, sesi belum ada.
  if (!data.session) {
    return {
      error: null,
      success:
        "Pendaftaran berhasil! Cek kotak masuk email kamu untuk link konfirmasi sebelum masuk.",
    };
  }

  redirect("/dashboard");
}

export async function actionSignInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    redirect("/login?error=oauth");
  }
  if (data.url) {
    redirect(data.url);
  }
}

export async function actionRequestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({ email: emailSchema })
    .safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Jangan bocorkan keberadaan akun: selalu tampilkan pesan sukses yang sama.
  if (error && !/rate limit/i.test(error.message)) {
    return { error: translateAuthError(error.message), success: null };
  }

  return {
    error: null,
    success:
      "Jika email terdaftar, link reset password sudah dikirim. Cek kotak masuk atau folder spam.",
  };
}
