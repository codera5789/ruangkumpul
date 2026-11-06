import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          "h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition-colors",
          "placeholder:text-ink-muted",
          error
            ? "border-red-400 focus:border-red-500"
            : "border-slate-200 hover:border-slate-300 focus:border-brand-500",
          "focus:outline-hidden",
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      <textarea
        className={cn(
          "min-h-24 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors",
          "placeholder:text-ink-muted",
          error
            ? "border-red-400 focus:border-red-500"
            : "border-slate-200 hover:border-slate-300 focus:border-brand-500",
          "focus:outline-hidden",
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
