"use client";

import { useActionState } from "react";
import { Loader2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  actionTogglePostLike,
  type CommunityActionState,
} from "@/modules/community/actions";

const initialState: CommunityActionState = { error: null, success: null };

/** Tombol suka diskusi dengan feedback galat (mis. sesi berakhir, rate limit). */
export function LikePostButton({
  postSlug,
  liked,
  count,
}: {
  postSlug: string;
  liked: boolean;
  count: number;
}) {
  const [state, formAction, pending] = useActionState(actionTogglePostLike, initialState);

  return (
    <span className="inline-flex flex-col gap-1">
      <form action={formAction}>
        <input type="hidden" name="postSlug" value={postSlug} />
        <Button
          type="submit"
          variant={liked ? "secondary" : "outline"}
          size="sm"
          aria-pressed={liked}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ThumbsUp className="size-4" aria-hidden="true" />
          )}
          {count} suka
        </Button>
      </form>
      {state.error ? (
        <span role="alert" className="text-xs font-medium text-red-700">
          {state.error}
        </span>
      ) : null}
    </span>
  );
}
