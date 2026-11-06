"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import {
  actionRequestPasswordReset,
  type AuthActionState,
} from "@/modules/auth/actions";
import { SubmitButton } from "@/modules/auth/components/submit-button";

const initialState: AuthActionState = { error: null, success: null };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(actionRequestPasswordReset, initialState);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Lupa password?</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Masukkan email kamu — kami kirim link untuk membuat password baru.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state.error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state.success ? (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            {state.success}
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

        <SubmitButton className="w-full" pendingText="Mengirim...">
          Kirim Link Reset
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-ink-secondary">
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
