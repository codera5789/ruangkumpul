"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { actionSignUp, actionSignInWithGoogle, type AuthActionState } from "@/modules/auth/actions";
import { GoogleButton } from "@/modules/auth/components/google-button";
import { SubmitButton } from "@/modules/auth/components/submit-button";

const initialState: AuthActionState = { error: null, success: null };

const OAUTH_DISABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "false";

export function RegisterForm() {
  const [state, formAction] = useActionState(actionSignUp, initialState);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Buat akun gratis</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          30 detik saja. Tanpa biaya, tanpa syarat tersembunyi.
        </p>
      </div>

      {!OAUTH_DISABLED ? (
        <>
          <form action={actionSignInWithGoogle}>
            <GoogleButton label="Daftar dengan Google" />
          </form>

          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-slate-200" />
            atau dengan email
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
        {state.error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {state.error}
          </div>
        ) : null}

        {state.success ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
          >
            {state.success}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-sm font-semibold text-ink">
            Nama lengkap
          </label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            placeholder="Budi Santoso"
            error={state.fieldErrors?.fullName}
          />
        </div>

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
          <label htmlFor="password" className="text-sm font-semibold text-ink">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Minimal 8 karakter"
            error={state.fieldErrors?.password}
          />
        </div>

        <SubmitButton className="w-full" pendingText="Mendaftarkan...">
          Daftar Gratis
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-ink-secondary">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
