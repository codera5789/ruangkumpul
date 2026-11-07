"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { timeAgoId } from "@/lib/utils";
import {
  actionDeletePostComment,
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
}

/** Satu komentar dengan aksi edit/hapus untuk pemilik atau moderator. */
export function CommentItem({ comment, postSlug, currentUserId, isModerator }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(actionUpdatePostComment, initialState);

  const authorName =
    comment.profiles?.full_name || comment.profiles?.username || "Pengguna";
  const canManage = Boolean(currentUserId) && (comment.author_id === currentUserId || isModerator);
  // Form edit tertutup otomatis setelah simpan berhasil.
  const showForm = editing && !state.success;

  return (
    <div className="flex gap-3 py-4">
      <Avatar src={comment.profiles?.avatar_url} name={authorName} className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-bold text-ink">{authorName}</span>{" "}
          <span className="text-xs text-ink-muted">
            · {timeAgoId(comment.created_at)}
          </span>
        </p>

        {showForm ? (
          <form action={formAction} className="mt-2 space-y-2">
            <input type="hidden" name="commentId" value={comment.id} />
            <textarea
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

        {canManage && !showForm ? (
          <div className="mt-1.5 flex items-center gap-1">
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
    </div>
  );
}
