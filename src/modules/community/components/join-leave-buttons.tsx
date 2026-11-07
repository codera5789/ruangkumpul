"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  actionJoinCommunity,
  actionLeaveCommunity,
  type CommunityActionState,
} from "@/modules/community/actions";

const initialState: CommunityActionState = { error: null, success: null };

/** Tombol gabung/keluar komunitas — mengelola form & feedback sendiri. */
export function JoinLeaveButtons({
  slug,
  isMember,
  isPending,
  isPrivate,
}: {
  slug: string;
  isMember: boolean;
  isPending: boolean;
  isPrivate: boolean;
}) {
  const [joinState, joinAction, joinPending] = useActionState(actionJoinCommunity, initialState);
  const [leaveState, leaveAction, leavePending] = useActionState(actionLeaveCommunity, initialState);

  const error = joinState.error ?? leaveState.error;
  const success = joinState.success ?? leaveState.success;
  const pending = joinPending || leavePending;

  const feedback = error || success ? (
    <p
      role="status"
      className={
        error
          ? "text-xs font-medium text-red-700"
          : "text-xs font-medium text-emerald-700"
      }
    >
      {error ?? success}
    </p>
  ) : null;

  if (isPending) {
    return (
      <div className="flex flex-col items-stretch gap-1.5">
        <Button variant="secondary" disabled>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Menunggu persetujuan
        </Button>
        {feedback}
      </div>
    );
  }

  if (isMember) {
    return (
      <div className="flex flex-col items-stretch gap-1.5">
        <form action={leaveAction}>
          <input type="hidden" name="slug" value={slug} />
          <Button type="submit" variant="outline" disabled={leavePending}>
            {leavePending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Keluar Komunitas
          </Button>
        </form>
        {feedback}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <form action={joinAction}>
        <input type="hidden" name="slug" value={slug} />
        <Button type="submit" disabled={joinPending}>
          {joinPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isPrivate ? "Minta Gabung" : "Gabung Komunitas"}
        </Button>
      </form>
      {feedback}
    </div>
  );
}
