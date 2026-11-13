"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import {
  actionSaveSiteAnnouncement,
  type AdminActionState,
} from "@/modules/admin/actions";
import type { PlatformAnnouncement } from "@/modules/admin/settings";

const initialState: AdminActionState = { error: null, success: null };

/** Form pengaturan banner pengumuman global platform (`site_settings`). */
export function SiteAnnouncementForm({
  defaults,
}: {
  defaults: PlatformAnnouncement;
}) {
  const [state, formAction] = useActionState(actionSaveSiteAnnouncement, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={defaults.enabled}
          className="mt-0.5 size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
        />
        <span>
          <span className="block text-sm font-bold text-ink">
            Tampilkan banner pengumuman di halaman publik
          </span>
          <span className="mt-0.5 block text-xs text-ink-secondary">
            Bila aktif, banner indigo tipis akan tampil di bagian paling atas situs publik.
          </span>
        </span>
      </label>

      <div>
        <label htmlFor="announcement-message" className="mb-1.5 block text-sm font-semibold text-ink">
          Pesan pengumuman
        </label>
        <Input
          id="announcement-message"
          name="message"
          maxLength={240}
          defaultValue={defaults.message}
          placeholder="Contoh: Jadwal pemeliharaan singkat Minggu pukul 01.00 WIB atau rilis fitur baru Ruang Marketplace."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="announcement-cta-label" className="mb-1.5 block text-sm font-semibold text-ink">
            Label tautan (opsional)
          </label>
          <Input
            id="announcement-cta-label"
            name="ctaLabel"
            maxLength={40}
            defaultValue={defaults.ctaLabel}
            placeholder="Lihat detail"
          />
        </div>
        <div>
          <label htmlFor="announcement-cta-href" className="mb-1.5 block text-sm font-semibold text-ink">
            URL tautan (opsional)
          </label>
          <Input
            id="announcement-cta-href"
            name="ctaHref"
            maxLength={300}
            defaultValue={defaults.ctaHref}
            placeholder="/marketplace atau https://..."
          />
        </div>
      </div>

      <div className="pt-1">
        <SubmitButton pendingText="Menyimpan...">Simpan Pengumuman</SubmitButton>
      </div>
    </form>
  );
}
