import { Plus, Pin, PinOff, Trash2 } from "lucide-react";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { formatCompactId } from "@/lib/utils";
import type { Tables } from "@/types/database";
import {
  actionDeleteNote,
  actionSaveNote,
  actionToggleNotePin,
} from "@/modules/productivity/actions";

type Note = Tables<"notes">;

/** Papan catatan: buat, edit inline, pin, hapus. Server-rendered dengan form actions. */
export function NotesList({ notes }: { notes: Note[] }) {
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Catatan baru */}
      <details className="group rounded-card border border-dashed border-brand-300 bg-brand-50/40">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-brand-800">
          <Plus className="size-4" aria-hidden="true" />
          Tulis catatan baru
        </summary>
        <form action={actionSaveNote} className="space-y-3 border-t border-brand-100 p-4">
          <input
            name="title"
            required
            maxLength={200}
            placeholder="Judul catatan"
            className="w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink focus:outline-hidden"
          />
          <textarea
            name="content"
            rows={5}
            maxLength={50000}
            placeholder="Tulis isinya di sini..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-hidden"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Simpan Catatan
          </button>
        </form>
      </details>

      {sorted.length === 0 ? (
        <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-12 text-center text-sm text-ink-secondary">
          Belum ada catatan. Ide, referensi, atau hal yang ingin kamu ingat, simpan di sini.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((note) => (
            <details
              key={note.id}
              className="group rounded-card border border-slate-200/80 bg-surface shadow-card open:shadow-card-hover"
            >
              <summary className="flex cursor-pointer list-none items-start gap-2 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{note.title}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs text-ink-secondary">
                    {note.content || "(kosong)"}
                  </span>
                </span>
                {note.pinned ? (
                  <Pin className="mt-0.5 size-4 shrink-0 fill-brand-200 text-brand-700" aria-label="Dipin" />
                ) : null}
              </summary>

              <div className="border-t border-slate-100 p-4">
                <form action={actionSaveNote} className="space-y-3">
                  <input type="hidden" name="id" value={note.id} />
                  <input
                    name="title"
                    defaultValue={note.title}
                    maxLength={200}
                    className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm font-semibold text-ink focus:outline-hidden"
                  />
                  <textarea
                    name="content"
                    defaultValue={note.content}
                    rows={8}
                    maxLength={50000}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-ink focus:outline-hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-ink-secondary">
                      <input
                        type="checkbox"
                        name="pinned"
                        defaultChecked={note.pinned}
                        className="size-3.5 rounded border-slate-300 text-brand-600"
                      />
                      Pin
                    </label>
                    <button
                      type="submit"
                      className="ml-auto rounded-lg bg-brand-800 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Simpan
                    </button>
                  </div>
                </form>

                <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                  <form action={actionToggleNotePin}>
                    <input type="hidden" name="id" value={note.id} />
                    <input type="hidden" name="nextPinned" value={String(!note.pinned)} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand-700"
                    >
                      {note.pinned ? (
                        <>
                          <PinOff className="size-3.5" aria-hidden="true" /> Lepas pin
                        </>
                      ) : (
                        <>
                          <Pin className="size-3.5" aria-hidden="true" /> Pin catatan
                        </>
                      )}
                    </button>
                  </form>
                  <ConfirmForm
                    action={actionDeleteNote}
                    fields={{ id: note.id }}
                    message="Hapus catatan ini? Tindakan ini tidak bisa dibatalkan."
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Hapus
                    </button>
                  </ConfirmForm>
                  <span className="text-[11px] text-ink-muted">
                    {formatCompactId(note.content.length)} karakter
                  </span>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
