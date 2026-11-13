"use client";

import { useActionState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/input";
import { actionCreatePost, type CommunityActionState } from "@/modules/community/actions";
import { SubmitButton } from "@/modules/auth/components/submit-button";

const initialState: CommunityActionState = { error: null, success: null };

export function CreatePostForm({ communitySlug }: { communitySlug: string }) {
  const [state, formAction] = useActionState(actionCreatePost, initialState);

  return (
    <details className="group rounded-card border border-slate-200/80 bg-surface shadow-card">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 p-5 font-semibold text-ink">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <MessageSquarePlus className="size-5" aria-hidden="true" />
        </span>
        Buat diskusi baru
      </summary>

      <form action={formAction} className="space-y-4 px-5 pb-5">
        <input type="hidden" name="communitySlug" value={communitySlug} />

        {state.error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-ink">
              Judul
            </label>
            <Input
              id="title"
              name="title"
              required
              minLength={5}
              maxLength={200}
              placeholder="Apa yang ingin kamu diskusikan?"
              error={state.fieldErrors?.title}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="postType" className="text-sm font-semibold text-ink">
              Jenis
            </label>
            <Select id="postType" name="postType" defaultValue="discussion">
              <option value="discussion">Diskusi</option>
              <option value="question">Pertanyaan</option>
              <option value="announcement">Pengumuman</option>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="content" className="text-sm font-semibold text-ink">
            Isi diskusi
          </label>
          <Textarea
            id="content"
            name="content"
            required
            minLength={10}
            maxLength={20000}
            rows={5}
            placeholder="Tulis dengan jelas dan santun agar mudah dijawab..."
            error={state.fieldErrors?.content}
          />
        </div>

        <div className="flex justify-end">
          <SubmitButton pendingText="Menerbitkan...">Terbitkan Diskusi</SubmitButton>
        </div>
      </form>
    </details>
  );
}
