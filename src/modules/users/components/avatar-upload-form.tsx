"use client";

import { useActionState, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import { actionUploadAvatar, type ProfileActionState } from "@/modules/users/actions";

const initialState: ProfileActionState = { error: null, success: null };

/** Form unggah avatar dengan pratinjau langsung. */
export function AvatarUploadForm({ currentUrl, name }: { currentUrl: string | null; name: string }) {
  const [state, formAction] = useActionState(actionUploadAvatar, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      window.alert("Format harus JPG, PNG, atau WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      window.alert("Ukuran maksimal 2 MB.");
      e.target.value = "";
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="flex items-center gap-4">
      <div className="relative">
        <Avatar src={previewUrl ?? currentUrl} name={name} className="size-20" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Pilih gambar avatar"
          className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-brand-800 text-white shadow-md transition-colors hover:bg-brand-700"
        >
          <Camera className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
        />
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">{state.error}</p>
        ) : state.success ? (
          <p className="text-sm text-emerald-700" role="status">{state.success}</p>
        ) : (
          <p className="text-sm text-ink-secondary">
            JPG, PNG, atau WebP. Maksimal 2 MB.
          </p>
        )}
        <div className="mt-2">
          <SubmitButton pendingText="Mengunggah...">Simpan Avatar</SubmitButton>
        </div>
      </div>
    </form>
  );
}
