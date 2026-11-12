"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, timeAgoId } from "@/lib/utils";
import {
  actionDeletePostComment,
  actionToggleAcceptedAnswer,
  actionUpdatePostComment,
  type CommunityActionState,
} from "@/modules/community/actions";
import type { PostCommentWithAuthor } from "@/modules/community/queries";

const initialState: CommunityActionState = { error: null, success: null };

interface CommentItemProps {
  comment: PostCommentWithAuthor;
  postSlug: string;
  currentUserId: string | null;
  isModerator: boolean;
  postId?: string;
  isAccepted?: boolean;
  canMarkAccepted?: boolean;
}

/** Satu komentar dengan aksi edit/hapus untuk pemilik atau moderator, serta penanda solusi terpilih. */
export function CommentItem({
  comment,
  postSlug,
  currentUserId,
  isModerator,
  postId,
  isAccepted = false,
  canMarkAccepted = false,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(actionUpdatePostComment, initialState);

  const authorName =
    comment.profiles?.full_name || comment.profiles?.username || "Pengguna";
  const canManage = Boolean(currentUserId) && (comment.author_id === currentUserId || isModerator);
  // Tutup form sekali setelah simpan berhasil; state tidak menghalangi edit ulang.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- menutup form setelah aksi server sukses
    if (state.success) setEditing(false);
  }, [state]);
  const showForm = editing;

  return (
    <div
      className={cn(
        "flex gap-3 py-4 transition-colors",
        isAccepted && "rounded-card border border-emerald-300 bg-emerald-50/40 p-4 my-2",
      )}
    >
      <Avatar src={comment.profiles?.avatar_url} name={authorName} className="size-9" />
      <div className="min-w-0 flex-1">
        {isAccepted ? (
          <div className="mb-1.5">
            <Badge variant="success" className="inline-flex items-center gap-1 font-semibold">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Solusi Terpilih
            </Badge>
          </div>
        ) : null}

        <p className="text-sm">
          <span className="font-bold text-ink">{authorName}</span>{" "}
          <span className="text-xs text-ink-muted">
            · {timeAgoId(comment.created_at)}
          </span>
        </p>

        {showForm ? (
          <form action={formAction} className="mt-2 space-y-2">
            <input type="hidden" name="commentId" value={comment.id} />
            <input type="hidden" name="postSlug" value={postSlug} />
            <label htmlFor={`edit-comment-${comment.id}`} className="sr-only">
              Edit komentar
            </label>
            <textarea
              id={`edit-comment-${comment.id}`}
              name="content"
              defaultValue={comment.content}
              required
              minLength={3}
              maxLength={5000}
              rows={3}
              className="w-full resize-y rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-hidden"
            />
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
        ) : (
          <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink-secondary">
            {comment.content}
          </p>
        )}

        {!showForm ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {canMarkAccepted && postId ? (
              <form action={actionToggleAcceptedAnswer}>
                <input type="hidden" name="postId" value={postId} />
                <input type="hidden" name="commentId" value={comment.id} />
                <input type="hidden" name="postSlug" value={postSlug} />
                <button
                  type="submit"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                    isAccepted
                      ? "bg-emerald-100 font-semibold text-emerald-800 hover:bg-emerald-200"
                      : "bg-surface-muted text-ink-muted hover:bg-emerald-50 hover:text-emerald-700",
                  )}
                >
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  {isAccepted ? "Batalkan Solusi" : "Tandai Solusi"}
                </button>
              </form>
            ) : null}

            {canManage ? (
              <div className="flex items-center gap-1">
                {comment.author_id === currentUserId ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                    Edit
                  </button>
                ) : null}
                <form
                  action={actionDeletePostComment}
                  onSubmit={(e) => {
                    if (!window.confirm("Hapus komentar ini?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="postSlug" value={postSlug} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-ink-muted transition-colors hover:text-red-600"
                  >
                    <Trash2 className="size-3" aria-hidden="true" />
                    Hapus
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
