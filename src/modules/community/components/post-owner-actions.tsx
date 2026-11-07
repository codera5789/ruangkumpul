"use client";

import { useActionState, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionDeletePost, actionUpdatePost, type CommunityActionState } from "@/modules/community/actions";

interface PostOwnerActionsProps {
  postSlug: string;
  title: string;
  content: string;
}

const initialState: CommunityActionState = { error: null, success: null };

/** Tombol edit (form inline) + hapus (konfirmasi) untuk pemilik diskusi. */
export function PostOwnerActions({ postSlug, title, content }: PostOwnerActionsProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(actionUpdatePost, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Form tertutup otomatis saat simpan berhasil (state.success turun dari action).
  const showForm = editing && !state.success;

  if (showForm) {
    return (
      <form ref={formRef} action={formAction} className="mt-4 space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
        <input type="hidden" name="postSlug" value={postSlug} />
        <div>
          <label htmlFor="edit-title" className="mb-1 block text-sm font-semibold text-ink">
            Judul
          </label>
          <input
            id="edit-title"
            name="title"
            defaultValue={title}
            required
            minLength={5}
            maxLength={200}
            className="w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-hidden"
          />
        </div>
        <div>
          <label htmlFor="edit-content" className="mb-1 block text-sm font-semibold text-ink">
            Isi diskusi
          </label>
          <textarea
            id="edit-content"
            name="content"
            defaultValue={content}
            required
            minLength={10}
            maxLength={20000}
            rows={8}
            className="w-full resize-y rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-hidden"
          />
        </div>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Batal
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
        Edit
      </button>
      <form
        action={actionDeletePost}
        onSubmit={(e) => {
          if (!window.confirm("Hapus diskusi ini secara permanen?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="postSlug" value={postSlug} />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Hapus
        </button>
      </form>
    </div>
  );
}
