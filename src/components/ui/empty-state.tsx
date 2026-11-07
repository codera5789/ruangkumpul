import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 animate-pop-in">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      ) : null}
      <div className="space-y-1 animate-slide-up">
        <p className="font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-ink-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
