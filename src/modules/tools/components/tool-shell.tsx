import { cn } from "@/lib/utils";
import { CopyButton } from "@/modules/tools/components/copy-button";

/** Kerangka UI standar untuk semua tool: panel input dengan judul bagian. */
export function ToolPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-slate-200/80 bg-surface p-5 shadow-card sm:p-6",
        className,
      )}
    >
      {title ? (
        <h2 className="mb-4 text-sm font-bold text-ink-secondary">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function ToolLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {children}
      </label>
      {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </div>
  );
}

/** Area hasil/output monospace dengan tombol salin. */
export function ToolOutput({
  value,
  placeholder = "Hasil akan muncul di sini...",
  rows = 6,
  mono = true,
}: {
  value: string;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        readOnly
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-live="polite"
        className={cn(
          "w-full resize-y rounded-xl border border-slate-200 bg-surface-muted px-3.5 py-2.5 text-sm text-ink focus:outline-hidden",
          mono && "font-mono text-[13px]",
        )}
      />
      {value ? (
        <div className="absolute right-2.5 bottom-2.5">
          <CopyButton value={value} />
        </div>
      ) : null}
    </div>
  );
}
