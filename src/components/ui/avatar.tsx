import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

/** Avatar dengan fallback inisial nama. */
export function Avatar({ src, name, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("size-10 shrink-0 rounded-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "flex size-10 shrink-0 select-none items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800",
        className,
      )}
    >
      {initial}
    </div>
  );
}
