"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/** Tombol gabung/keluar komunitas dengan status pending. */
export function JoinLeaveButtons({
  isMember,
  isPending,
  isPrivate,
}: {
  isMember: boolean;
  isPending: boolean;
  isPrivate: boolean;
}) {
  const { pending } = useFormStatus();

  if (isPending) {
    return (
      <Button variant="secondary" disabled>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Menunggu persetujuan
      </Button>
    );
  }

  if (isMember) {
    return (
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Keluar Komunitas
      </Button>
    );
  }

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {isPrivate ? "Minta Gabung" : "Gabung Komunitas"}
    </Button>
  );
}
