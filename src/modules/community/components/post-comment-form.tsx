"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { actionAddPostComment, type CommunityActionState } from "@/modules/community/actions";

const initialState: CommunityActionState = { error: null, success: null };

function SubmitPostCommentButton() {
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

export function PostCommentForm({
  postSlug,
  isLoggedIn,
}: {
  postSlug: string;
  isLoggedIn: boolean;
}) {
  const [state, formAction] = useActionState(actionAddPostComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (!isLoggedIn) {
    return (
      <div className="rounded-card border border-slate-200/80 bg-surface-muted px-5 py-6 text-center">
        <p className="text-sm text-ink-secondary">
          <Link
            href={`/login?next=/diskusi/${postSlug}`}
            className="font-semibold text-brand-700 hover:underline"
          >
            Masuk
          </Link>{" "}
          untuk ikut berkomentar di diskusi ini.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="postSlug" value={postSlug} />

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

      <Textarea
        name="content"
        required
        minLength={3}
        maxLength={5000}
        rows={3}
        placeholder="Tulis komentar..."
        aria-label="Tulis komentar"
      />

      <div className="flex justify-end">
        <SubmitPostCommentButton />
      </div>
    </form>
  );
}
