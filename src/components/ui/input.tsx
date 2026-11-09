import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export function Input({ className, error, id, name, ...props }: InputProps) {
  const errorId = error && (id || name) ? `${id ?? name}-error` : undefined;
  return (
    <div className="w-full">
      <input
        id={id}
        name={name}
        className={cn(
          "h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition-all duration-200",
          "placeholder:text-ink-muted",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            : "border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
          "focus:outline-hidden",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
}

export function Textarea({ className, error, id, name, ...props }: TextareaProps) {
  const errorId = error && (id || name) ? `${id ?? name}-error` : undefined;
  return (
    <div className="w-full">
      <textarea
        id={id}
        name={name}
        className={cn(
          "min-h-24 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all duration-200",
          "placeholder:text-ink-muted",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            : "border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
          "focus:outline-hidden",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
