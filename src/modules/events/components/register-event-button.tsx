"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  actionToggleEventRegistration,
  type EventActionState,
} from "@/modules/events/actions";

const initialState: EventActionState = { error: null, success: null };

/** CTA daftar/batal event dengan feedback hasil (kuota penuh, event berakhir, dsb.). */
export function RegisterEventButton({
  eventSlug,
  registered,
  isFull,
}: {
  eventSlug: string;
  registered: boolean;
  isFull: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    actionToggleEventRegistration,
    initialState,
  );

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <form action={formAction}>
        <input type="hidden" name="eventSlug" value={eventSlug} />
        <Button
          type="submit"
          size="lg"
          variant={registered ? "outline" : undefined}
          disabled={pending || (!registered && isFull)}
          className="w-full"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {registered
            ? "Batalkan pendaftaran"
            : isFull
              ? "Kuota penuh"
              : "Daftar Sekarang — Gratis"}
        </Button>
      </form>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : state.success ? (
        <p role="status" className="mt-2 text-sm font-medium text-emerald-700">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
