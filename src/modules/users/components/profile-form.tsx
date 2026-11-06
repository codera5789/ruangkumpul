"use client";

import { useActionState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { actionUpdateProfile, type ProfileActionState } from "@/modules/users/actions";
import { SubmitButton } from "@/modules/auth/components/submit-button";

const initialState: ProfileActionState = { error: null, success: null };

export function ProfileForm({
  defaults,
}: {
  defaults: {
    username: string;
    fullName: string;
    bio: string;
    websiteUrl: string;
    location: string;
  };
}) {
  const [state, formAction] = useActionState(actionUpdateProfile, initialState);

  return (
    <form action={formAction} className="space-y-5">
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
        <label htmlFor="username" className="text-sm font-semibold text-ink">
          Username
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">@</span>
          <Input
            id="username"
            name="username"
            required
            defaultValue={defaults.username}
            placeholder="username-kamu"
            error={state.fieldErrors?.username}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-semibold text-ink">
          Nama lengkap
        </label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaults.fullName}
          maxLength={120}
          placeholder="Nama tampilan kamu"
          error={state.fieldErrors?.fullName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-semibold text-ink">
          Bio
        </label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={defaults.bio}
          maxLength={500}
          rows={3}
          placeholder="Ceritakan singkat tentang kamu..."
          error={state.fieldErrors?.bio}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="websiteUrl" className="text-sm font-semibold text-ink">
            Website
          </label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={defaults.websiteUrl}
            placeholder="https://situsmu.com"
            error={state.fieldErrors?.websiteUrl}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="location" className="text-sm font-semibold text-ink">
            Lokasi
          </label>
          <Input
            id="location"
            name="location"
            defaultValue={defaults.location}
            maxLength={120}
            placeholder="mis. Jakarta, Indonesia"
            error={state.fieldErrors?.location}
          />
        </div>
      </div>

      <SubmitButton pendingText="Menyimpan...">Simpan Perubahan</SubmitButton>
    </form>
  );
}
