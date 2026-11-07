import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-800 text-white shadow-xs hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/20 active:bg-brand-900",
  secondary:
    "bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200",
  outline:
    "border border-slate-200 bg-surface text-ink shadow-xs hover:bg-surface-muted hover:border-brand-200 hover:shadow-sm active:bg-slate-100",
  ghost: "text-ink-secondary hover:bg-surface-muted hover:text-ink",
  danger: "bg-red-600 text-white shadow-xs hover:bg-red-700 hover:shadow-md hover:shadow-red-900/20 active:bg-red-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
  icon: "size-10",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex select-none items-center justify-center rounded-xl font-semibold",
    "transition-all duration-200 ease-out-expo active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
