"use client";

import { useActionState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import { actionCreateEvent, type EventActionState } from "@/modules/events/actions";

const initialState: EventActionState = { error: null, success: null };

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-hidden";

/** Form buat event. */
export function EventForm() {
  const [state, formAction] = useActionState(actionCreateEvent, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-ink">
              Nama event *
            </label>
            <Input id="title" name="title" required minLength={5} maxLength={200}
              placeholder="Contoh: Webinar Persiapan Karier Digital 2027" />
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-ink">
              Deskripsi * <span className="font-normal text-ink-muted">(agenda, target peserta, dsb.)</span>
            </label>
            <Textarea id="description" name="description" required rows={10} minLength={20} maxLength={10000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-semibold text-ink">
                Mulai * <span className="font-normal text-ink-muted">(WIB)</span>
              </label>
              <Input id="startsAt" name="startsAt" type="datetime-local" required />
            </div>
            <div>
              <label htmlFor="endsAt" className="mb-1.5 block text-sm font-semibold text-ink">
                Selesai
              </label>
              <Input id="endsAt" name="endsAt" type="datetime-local" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-slate-200/80 bg-surface p-4">
            <label htmlFor="format" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Format *
            </label>
            <select id="format" name="format" defaultValue="online" className={inputCls}>
              <option value="online">Online</option>
              <option value="offline">Offline (tatap muka)</option>
              <option value="hybrid">Hybrid</option>
            </select>

            <label htmlFor="location" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Lokasi <span className="font-normal">(wajib untuk offline/hybrid)</span>
            </label>
            <Input id="location" name="location" maxLength={200} placeholder="mis. Jakarta Selatan" />

            <label htmlFor="onlineUrl" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Link online (opsional)
            </label>
            <Input id="onlineUrl" name="onlineUrl" type="url" placeholder="https://meet..." />

            <label htmlFor="category" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Kategori
            </label>
            <Input id="category" name="category" maxLength={60} placeholder="mis. Webinar, Workshop" />

            <label htmlFor="maxParticipants" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Kuota peserta
            </label>
            <Input id="maxParticipants" name="maxParticipants" type="number" min={1} max={100000} placeholder="Kosong = tanpa batas" />
          </div>

          {state.fieldErrors ? (
            <ul className="space-y-1 text-sm text-red-600">
              {Object.entries(state.fieldErrors).map(([field, msg]) => (
                <li key={field}>• {msg}</li>
              ))}
            </ul>
          ) : null}

          <SubmitButton pendingText="Menyimpan...">Buat Event</SubmitButton>
        </div>
      </div>
    </form>
  );
}
