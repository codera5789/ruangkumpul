import { cn } from "@/lib/utils";
import { KumpulMotif } from "@/components/shared/kumpul-motif";
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
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <KumpulMotif className="absolute -top-6 -right-6 size-28 text-brand-800/5 dark:text-brand-300/10" />
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
