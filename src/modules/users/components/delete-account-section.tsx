"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actionDeleteAccount, type ProfileActionState } from "@/modules/users/actions";

const initialState: ProfileActionState = { error: null, success: null };

/** Zona bahaya: penghapusan akun permanen dengan konfirmasi ganda. */
export function DeleteAccountSection() {
  const [state, formAction, pending] = useActionState(actionDeleteAccount, initialState);
  const [open, setOpen] = useState(false);

  if (state.success) {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
        {state.success} —{" "}
        <Link href="/" className="font-semibold underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-secondary">
          Menghapus akun berarti menghapus profil, diskusi, komentar, bookmark, catatan, dan tugasmu
          secara permanen.
        </p>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setOpen(true)}
        >
          Hapus Akun...
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <p className="text-sm font-semibold text-red-700">
        Tindakan ini tidak bisa dibatalkan. Ketik <span className="font-mono">HAPUS</span> untuk
        konfirmasi.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="confirmation" required placeholder="HAPUS" aria-label="Konfirmasi hapus" />
        <Input
          name="password"
          type="password"
          placeholder="Password akun (jika ada)"
          aria-label="Password akun"
          autoComplete="current-password"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending}
          className="bg-red-600 hover:bg-red-700"
        >
          {pending ? "Menghapus..." : "Hapus Permanen"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
