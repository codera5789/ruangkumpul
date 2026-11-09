"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { actionSignIn, actionSignInWithGoogle, type AuthActionState } from "@/modules/auth/actions";
import { GoogleButton } from "@/modules/auth/components/google-button";
import { SubmitButton } from "@/modules/auth/components/submit-button";

const initialState: AuthActionState = { error: null, success: null };

const OAUTH_DISABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "false";

const callbackErrorMessages: Record<string, string> = {
  oauth: "Gagal masuk dengan Google. Coba lagi atau gunakan email dan password.",
  auth: "Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Coba masuk kembali.",
};

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [state, formAction] = useActionState(actionSignIn, initialState);
  const callbackError = error ? callbackErrorMessages[error] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Masuk ke akun kamu</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Satu akun untuk tools, artikel, dan komunitas.
        </p>
      </div>

      {callbackError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {callbackError}
        </div>
      ) : null}

      {!OAUTH_DISABLED ? (
        <>
          <form action={actionSignInWithGoogle}>
            <GoogleButton label="Masuk dengan Google" />
          </form>

          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-slate-200" />
            atau dengan email
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />

        {state.error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {state.error}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            error={state.fieldErrors?.email}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            error={state.fieldErrors?.password}
          />
        </div>

        <SubmitButton className="w-full" pendingText="Masuk...">
          Masuk
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-ink-secondary">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Daftar gratis
        </Link>
      </p>
    </div>
  );
}
