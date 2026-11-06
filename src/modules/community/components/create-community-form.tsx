"use client";

import { useActionState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { actionCreateCommunity, type CommunityActionState } from "@/modules/community/actions";
import { SubmitButton } from "@/modules/auth/components/submit-button";

const initialState: CommunityActionState = { error: null, success: null };

export function CreateCommunityForm() {
  const [state, formAction] = useActionState(actionCreateCommunity, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-semibold text-ink">
          Nama komunitas
        </label>
        <Input
          id="name"
          name="name"
          required
          minLength={3}
          maxLength={100}
          placeholder="mis. Pecinta Kopi Indonesia"
          error={state.fieldErrors?.name}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-semibold text-ink">
          Deskripsi
        </label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="Jelaskan tentang komunitas ini: siapa yang cocok bergabung dan apa yang dibahas..."
          error={state.fieldErrors?.description}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Visibilitas</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors has-checked:border-brand-600 has-checked:bg-brand-50">
            <input
              type="radio"
              name="visibility"
              value="public"
              defaultChecked
              className="mt-1 accent-brand-800"
            />
            <span>
              <span className="block text-sm font-bold text-ink">Publik</span>
              <span className="mt-0.5 block text-xs text-ink-secondary">
                Siapa pun bisa menemukan dan bergabung langsung.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors has-checked:border-brand-600 has-checked:bg-brand-50">
            <input
              type="radio"
              name="visibility"
              value="private"
              className="mt-1 accent-brand-800"
            />
            <span>
              <span className="block text-sm font-bold text-ink">Privat</span>
              <span className="mt-0.5 block text-xs text-ink-secondary">
                Hanya terlihat via tautan. Perlu persetujuan pemilik.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <SubmitButton className="w-full" pendingText="Membuat komunitas...">
        Buat Komunitas
      </SubmitButton>
    </form>
  );
}
