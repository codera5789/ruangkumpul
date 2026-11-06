"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { actionAddArticleComment, type CommentActionState } from "@/modules/knowledge/actions";

const initialState: CommentActionState = { error: null, success: false };

function SubmitCommentButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Mengirim...
        </>
      ) : (
        "Kirim Komentar"
      )}
    </Button>
  );
}

export function CommentForm({
  slug,
  isLoggedIn,
}: {
  slug: string;
  isLoggedIn: boolean;
}) {
  const [state, formAction] = useActionState(actionAddArticleComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset textarea setelah komentar berhasil terkirim.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (!isLoggedIn) {
    return (
      <div className="rounded-card border border-slate-200/80 bg-surface-muted px-5 py-6 text-center">
        <p className="text-sm text-ink-secondary">
          <Link href="/login?next=/artikel" className="font-semibold text-brand-700 hover:underline">
            Masuk
          </Link>{" "}
          untuk ikut berdiskusi di kolom komentar.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />

      {state.error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Komentar terkirim. Terima kasih sudah berdiskusi!
        </div>
      ) : null}

      <Textarea
        name="content"
        required
        minLength={3}
        maxLength={5000}
        rows={4}
        placeholder="Tulis komentar yang membangun..."
        aria-label="Tulis komentar"
      />

      <div className="flex justify-end">
        <SubmitCommentButton />
      </div>
    </form>
  );
}

export function CommentItem({
  comment,
}: {
  comment: {
    id: string;
    content: string;
    created_at: string;
    profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
  };
}) {
  const authorName = comment.profiles?.full_name || comment.profiles?.username || "Pengguna";
  return (
    <div className="flex gap-3 py-4">
      <Avatar
        src={comment.profiles?.avatar_url}
        name={authorName}
        className="size-9"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-bold text-ink">{authorName}</p>
          <time
            dateTime={comment.created_at}
            className="text-xs text-ink-muted"
          >
            {new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            }).format(new Date(comment.created_at))}
          </time>
        </div>
        <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink-secondary">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
