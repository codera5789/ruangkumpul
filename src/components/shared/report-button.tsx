"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  actionSubmitReport,
  type CommunityActionState,
} from "@/modules/community/actions";

const initialState: CommunityActionState = { error: null, success: null };

const REPORT_REASONS = [
  { value: "konten_tidak_pantas", label: "Konten tidak pantas" },
  { value: "spam", label: "Spam atau promosi berlebihan" },
  { value: "penipuan", label: "Indikasi penipuan" },
  { value: "ujaran_kebencian", label: "Ujaran kebencian atau pelecehan" },
  { value: "lainnya", label: "Lainnya" },
] as const;

export interface ReportButtonProps {
  targetType: "post" | "comment" | "article" | "community" | "user";
  targetId: string;
  redirectTo: string;
  isLoggedIn?: boolean;
  compact?: boolean;
  label?: string;
  className?: string;
}

/** Tombol lapor konten reusable untuk post, komentar, artikel, komunitas, dan profil. */
export function ReportButton({
  targetType,
  targetId,
  redirectTo,
  isLoggedIn = false,
  compact = false,
  label = "Lapor",
  className,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(actionSubmitReport, initialState);
  const router = useRouter();

  function handleToggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(redirectTo)}`);
      return;
    }
    setOpen((prev) => !prev);
  }

  return (
    <div className={cn("inline-flex flex-col items-end gap-2", open && "w-full sm:w-auto", className)}>
      {!state.success ? (
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-control text-ink-muted transition-colors hover:text-red-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500",
            compact
              ? "px-1.5 py-1 text-xs"
              : "min-h-11 px-3 py-2 text-sm font-medium hover:bg-red-50/70 dark:hover:bg-red-950/30",
          )}
        >
          <Flag className={compact ? "size-3" : "size-4"} aria-hidden="true" />
          {label}
        </button>
      ) : (
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400" role="status">
          {state.success}
        </p>
      )}

      {open && !state.success ? (
        <form
          action={formAction}
          className="w-full max-w-sm space-y-2.5 rounded-xl border border-slate-200 bg-surface p-3 text-left shadow-card"
        >
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <label
              htmlFor={`report-reason-${targetType}-${targetId}`}
              className="mb-1 block text-xs font-semibold text-ink-secondary"
            >
              Alasan laporan
            </label>
            <select
              id={`report-reason-${targetType}-${targetId}`}
              name="reason"
              defaultValue="konten_tidak_pantas"
              className="h-9 w-full rounded-lg border border-slate-200 bg-surface px-2.5 text-xs text-ink focus:border-brand-500 focus:outline-hidden"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`report-desc-${targetType}-${targetId}`}
              className="mb-1 block text-xs font-semibold text-ink-secondary"
            >
              Catatan tambahan (opsional)
            </label>
            <textarea
              id={`report-desc-${targetType}-${targetId}`}
              name="description"
              rows={2}
              maxLength={500}
              placeholder="Jelaskan singkat pelanggaran yang ditemukan..."
              className="w-full rounded-lg border border-slate-200 bg-surface px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {state.error ? (
            <p className="text-xs text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="danger" size="sm" disabled={pending}>
              {pending ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
