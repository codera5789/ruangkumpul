import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function fieldErrorId(id?: string, name?: string, error?: string | null) {
  return error && (id || name) ? `${id ?? name}-error` : undefined;
}

function fieldControlCls(error?: string | null, extra?: string) {
  return cn(
    "w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition-all duration-200",
    "placeholder:text-ink-muted",
    error
      ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
      : "border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
    "focus:outline-hidden",
    extra,
  );
}

function FieldErrorMessage({ id, error }: { id?: string; error?: string | null }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export function Input({ className, error, id, name, ...props }: InputProps) {
  const errorId = fieldErrorId(id, name, error);
  return (
    <div className="w-full">
      <input
        id={id}
        name={name}
        className={fieldControlCls(error, cn("h-11", className))}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      />
      <FieldErrorMessage id={errorId} error={error} />
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
}

export function Textarea({ className, error, id, name, ...props }: TextareaProps) {
  const errorId = fieldErrorId(id, name, error);
  return (
    <div className="w-full">
      <textarea
        id={id}
        name={name}
        className={fieldControlCls(error, cn("min-h-24 py-2.5", className))}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      />
      <FieldErrorMessage id={errorId} error={error} />
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | null;
}

/** Elemen `<select>` terpadu dengan gaya focus/error yang konsisten dengan `Input`. */
export function Select({ className, error, id, name, children, ...props }: SelectProps) {
  const errorId = fieldErrorId(id, name, error);
  return (
    <div className="w-full">
      <select
        id={id}
        name={name}
        className={fieldControlCls(error, cn("h-11", className))}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      >
        {children}
      </select>
      <FieldErrorMessage id={errorId} error={error} />
    </div>
  );
}
