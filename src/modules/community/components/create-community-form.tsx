"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { MediaImageField } from "@/components/shared/media-image-field";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import {
  actionCreateCommunity,
  actionUpdateCommunity,
  type CommunityActionState,
} from "@/modules/community/actions";

const initialState: CommunityActionState = { error: null, success: null };

interface CreateCommunityFormProps {
  mode?: "create" | "edit";
  initialCommunity?: {
    slug: string;
    name: string;
    description: string | null;
    visibility: "public" | "private";
    icon_url: string | null;
  };
}

/** Form buat atau sunting komunitas termasuk ikon opsional (JPG/PNG/WebP). */
export function CreateCommunityForm({
  mode = "create",
  initialCommunity,
}: CreateCommunityFormProps) {
  const isEdit = mode === "edit" && Boolean(initialCommunity);
  const [state, formAction] = useActionState(
    isEdit ? actionUpdateCommunity : actionCreateCommunity,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && initialCommunity ? (
        <input type="hidden" name="communitySlug" value={initialCommunity.slug} />
      ) : null}

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
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          {state.success}
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
          defaultValue={initialCommunity?.name ?? ""}
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
          defaultValue={initialCommunity?.description ?? ""}
          placeholder="Jelaskan tentang komunitas ini: siapa yang cocok bergabung dan apa yang dibahas..."
          error={state.fieldErrors?.description}
        />
      </div>

      <MediaImageField
        id="iconFile"
        name="iconFile"
        label="Ikon komunitas (opsional)"
        currentUrl={initialCommunity?.icon_url}
        removeName={isEdit ? "removeIcon" : undefined}
        previewClassName="size-20 rounded-2xl"
        alt="Pratinjau ikon komunitas"
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Visibilitas</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors has-checked:border-brand-600 has-checked:bg-brand-50">
            <input
              type="radio"
              name="visibility"
              value="public"
              defaultChecked={(initialCommunity?.visibility ?? "public") === "public"}
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
              defaultChecked={initialCommunity?.visibility === "private"}
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

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          className="flex-1"
          pendingText={isEdit ? "Menyimpan..." : "Membuat komunitas..."}
        >
          {isEdit ? "Simpan Perubahan" : "Buat Komunitas"}
        </SubmitButton>
        {isEdit && initialCommunity ? (
          <Button asChild variant="outline">
            <Link href={`/komunitas/${initialCommunity.slug}`}>Kembali</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
