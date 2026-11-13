"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatWibDateTimeLocal } from "@/lib/datetime";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import {
  actionCreateEvent,
  actionUpdateEvent,
  type EventActionState,
} from "@/modules/events/actions";
import type { EventWithOrganizer } from "@/modules/events/services";

const initialState: EventActionState = { error: null, success: null };

/** Form buat atau sunting event. */
export function EventForm({ initialEvent }: { initialEvent?: EventWithOrganizer }) {
  const isEdit = Boolean(initialEvent);
  const [state, formAction] = useActionState(
    isEdit ? actionUpdateEvent : actionCreateEvent,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {initialEvent ? <input type="hidden" name="eventId" value={initialEvent.id} /> : null}

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

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-ink">
              Nama event *
            </label>
            <Input
              id="title"
              name="title"
              required
              minLength={5}
              maxLength={200}
              defaultValue={initialEvent?.title ?? ""}
              placeholder="Contoh: Webinar Persiapan Karier Digital 2027"
              error={state.fieldErrors?.title}
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-ink">
              Deskripsi * <span className="font-normal text-ink-muted">(agenda, target peserta, dsb.)</span>
            </label>
            <Textarea
              id="description"
              name="description"
              required
              rows={10}
              minLength={20}
              maxLength={10000}
              defaultValue={initialEvent?.description ?? ""}
              error={state.fieldErrors?.description}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-semibold text-ink">
                Mulai * <span className="font-normal text-ink-muted">(WIB)</span>
              </label>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={formatWibDateTimeLocal(initialEvent?.starts_at)}
                error={state.fieldErrors?.startsAt}
              />
            </div>
            <div>
              <label htmlFor="endsAt" className="mb-1.5 block text-sm font-semibold text-ink">
                Selesai <span className="font-normal text-ink-muted">(WIB)</span>
              </label>
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={formatWibDateTimeLocal(initialEvent?.ends_at)}
                error={state.fieldErrors?.endsAt}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-slate-200/80 bg-surface p-4">
            <label htmlFor="format" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Format *
            </label>
            <Select id="format" name="format" defaultValue={initialEvent?.format ?? "online"}>
              <option value="online">Online</option>
              <option value="offline">Offline (tatap muka)</option>
              <option value="hybrid">Hybrid</option>
            </Select>

            <label htmlFor="location" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Lokasi <span className="font-normal">(wajib untuk offline/hybrid)</span>
            </label>
            <Input
              id="location"
              name="location"
              maxLength={200}
              defaultValue={initialEvent?.location ?? ""}
              placeholder="mis. Jakarta Selatan"
              error={state.fieldErrors?.location}
            />

            <label htmlFor="onlineUrl" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Link online (opsional)
            </label>
            <Input
              id="onlineUrl"
              name="onlineUrl"
              type="url"
              defaultValue={initialEvent?.online_url ?? ""}
              placeholder="https://meet..."
              error={state.fieldErrors?.onlineUrl}
            />

            <label htmlFor="category" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Kategori
            </label>
            <Input
              id="category"
              name="category"
              maxLength={60}
              defaultValue={initialEvent?.category ?? ""}
              placeholder="mis. Webinar, Workshop"
            />

            <label htmlFor="maxParticipants" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Kuota peserta
            </label>
            <Input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              min={1}
              max={100000}
              defaultValue={initialEvent?.max_participants ?? ""}
              placeholder="Kosong = tanpa batas"
              error={state.fieldErrors?.maxParticipants}
            />

            {isEdit && initialEvent ? (
              <>
                <label htmlFor="status" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
                  Status event
                </label>
                <Select id="status" name="status" defaultValue={initialEvent.status}>
                  <option value="published">Tayang</option>
                  <option value="cancelled">Dibatalkan</option>
                  <option value="archived">Diarsipkan</option>
                </Select>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <SubmitButton
              className="flex-1"
              pendingText="Menyimpan..."
            >
              {isEdit ? "Simpan Perubahan" : "Buat Event"}
            </SubmitButton>
            {isEdit && initialEvent ? (
              <Button asChild variant="outline">
                <Link href={`/event/${initialEvent.slug}`}>Kembali</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
