"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import { actionChangeEmail, type ProfileActionState } from "@/modules/users/actions";

const initialState: ProfileActionState = { error: null, success: null };

/** Form ganti email akun — mengirim email konfirmasi ke alamat baru. */
export function ChangeEmailForm({
  currentEmail,
  requiresPassword,
}: {
  currentEmail: string;
  requiresPassword: boolean;
}) {
  const [state, formAction] = useActionState(actionChangeEmail, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="email"
          type="email"
          required
          placeholder={currentEmail}
          aria-label="Email baru"
          autoComplete="email"
        />
        {requiresPassword ? (
          <Input
            name="currentPassword"
            type="password"
            required
            minLength={6}
            placeholder="Password saat ini"
            aria-label="Password saat ini"
            autoComplete="current-password"
          />
        ) : null}
      </div>
      <SubmitButton pendingText="Memproses...">Kirim Konfirmasi</SubmitButton>
    </form>
  );
}
