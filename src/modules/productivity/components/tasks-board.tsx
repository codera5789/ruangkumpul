import { ArrowLeft, ArrowRight, CalendarDays, Plus, Trash2 } from "lucide-react";
import { formatDateId } from "@/lib/utils";
import type { Enums, Tables } from "@/types/database";
import {
  actionCreateTask,
  actionDeleteTask,
  actionMoveTask,
} from "@/modules/productivity/actions";

type Task = Tables<"tasks">;
type TaskStatus = Enums["task_status"];

const columns: { status: TaskStatus; label: string; accent: string }[] = [
  { status: "todo", label: "Perlu Dikerjakan", accent: "bg-slate-400" },
  { status: "doing", label: "Sedang Dikerjakan", accent: "bg-amber-400" },
  { status: "done", label: "Selesai", accent: "bg-emerald-500" },
];

function nextStatus(s: TaskStatus): TaskStatus | null {
  if (s === "todo") return "doing";
  if (s === "doing") return "done";
  return null;
}
function prevStatus(s: TaskStatus): TaskStatus | null {
  if (s === "doing") return "todo";
  if (s === "done") return "doing";
  return null;
}

/** Papan tugas 3 kolom (todo/doing/done) dengan form actions. */
export function TasksBoard({ tasks }: { tasks: Task[] }) {
  const isOverdue = (t: Task) =>
    t.due_date &&
    t.status !== "done" &&
    new Date(t.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <div className="space-y-5">
      {/* Tambah tugas */}
      <form action={actionCreateTask} className="flex flex-wrap gap-2">
        <input
          name="title"
          required
          minLength={2}
          maxLength={200}
          placeholder="Tugas baru — mis. Kirim lamaran ke PT X"
          className="min-w-48 flex-1 rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-hidden"
        />
        <input
          type="date"
          name="dueDate"
          aria-label="Tenggat (opsional)"
          className="rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm text-ink-secondary focus:outline-hidden"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks
            .filter((t) => t.status === col.status)
            .sort((a, b) => a.position - b.position);

          return (
            <section
              key={col.status}
              aria-label={col.label}
              className="rounded-card border border-slate-200/80 bg-surface p-3.5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={`size-2 rounded-full ${col.accent}`} aria-hidden="true" />
                <h2 className="text-sm font-bold text-ink">{col.label}</h2>
                <span className="ml-auto text-xs font-semibold text-ink-muted">
                  {colTasks.length}
                </span>
              </div>

              <ul className="space-y-2">
                {colTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`group rounded-xl border p-3 text-sm transition-colors ${
                      task.status === "done"
                        ? "border-emerald-100 bg-emerald-50/50"
                        : "border-slate-200 bg-surface-muted/60"
                    }`}
                  >
                    <p
                      className={`font-medium text-ink ${
                        task.status === "done" ? "line-through decoration-emerald-500/60" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.due_date ? (
                      <p
                        className={`mt-1 inline-flex items-center gap-1 text-xs ${
                          isOverdue(task) ? "font-semibold text-red-600" : "text-ink-muted"
                        }`}
                      >
                        <CalendarDays className="size-3" aria-hidden="true" />
                        {formatDateId(task.due_date, { day: "numeric", month: "short" })}
                        {isOverdue(task) ? " · lewat" : ""}
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      {prevStatus(task.status) ? (
                        <form action={actionMoveTask}>
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="nextStatus" value={prevStatus(task.status)!} />
                          <button
                            type="submit"
                            aria-label="Mundur"
                            className="rounded-md p-1 text-ink-muted hover:bg-surface hover:text-ink"
                          >
                            <ArrowLeft className="size-3.5" aria-hidden="true" />
                          </button>
                        </form>
                      ) : null}
                      {nextStatus(task.status) ? (
                        <form action={actionMoveTask}>
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="nextStatus" value={nextStatus(task.status)!} />
                          <button
                            type="submit"
                            aria-label="Lanjut"
                            className="rounded-md p-1 text-ink-muted hover:bg-surface hover:text-ink"
                          >
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </button>
                        </form>
                      ) : null}
                      <form action={actionDeleteTask} className="ml-auto">
                        <input type="hidden" name="id" value={task.id} />
                        <button
                          type="submit"
                          aria-label="Hapus tugas"
                          className="rounded-md p-1 text-ink-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
                {colTasks.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-ink-muted">
                    Kosong
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
