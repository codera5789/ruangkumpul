"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import { actionUpdateNotificationPrefs, type ProfileActionState } from "@/modules/users/actions";

const initialState: ProfileActionState = { error: null, success: null };

const items = [
  {
    name: "notifyComments",
    title: "Komentar & balasan",
    desc: "Ada komentar baru di diskusi, artikel, atau komentarmu.",
  },
  {
    name: "notifyLikes",
    title: "Suka",
    desc: "Seseorang menyukai diskusi atau artikelmu.",
  },
  {
    name: "notifyMentions",
    title: "Sebutan",
    desc: "Seseorang menyebut namamu di konten.",
  },
  {
    name: "notifyProduct",
    title: "Info produk & pengumuman",
    desc: "Kabar fitur baru dan pengumuman penting RuangKumpul.",
  },
] as const;

/** Preferensi jenis notifikasi yang dikirim ke pengguna. */
export function NotificationPrefsForm({
  defaults,
}: {
  defaults: {
    notifyComments: boolean;
    notifyLikes: boolean;
    notifyMentions: boolean;
    notifyProduct: boolean;
  };
}) {
  const [state, formAction] = useActionState(actionUpdateNotificationPrefs, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800" role="status">
          {state.success}
        </p>
      ) : null}

      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-xs text-ink-secondary">{item.desc}</p>
            </div>
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                name={item.name}
                defaultChecked={defaults[item.name]}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-brand-600 peer-checked:after:translate-x-5" />
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton pendingText="Menyimpan...">Simpan Preferensi</SubmitButton>
    </form>
  );
}
