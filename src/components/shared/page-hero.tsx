import { cn } from "@/lib/utils";
import { KumpulMotif } from "@/components/shared/kumpul-motif";

interface PageHeroProps {
  /** Label kecil di atas judul, sentence case (DESIGN.md: tanpa uppercase). */
  eyebrow: string;
  title: string;
  description?: string;
  /** Slot aksi di bawah deskripsi (search, chip filter, dsb.). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Hero halaman listing: panel indigo SOLID + motif kumpul, komposisi kiri
 * (asimetris). Menggantikan gradien indigo-violet + orb blur (antislop R-01).
 * Konten halaman tetap pemanggil yang menentukan; komponen ini presentational.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("relative overflow-hidden bg-brand-950", className)}>
      <KumpulMotif className="absolute -right-20 -bottom-28 size-96 text-brand-300/15" />
      <KumpulMotif className="absolute -top-24 -left-24 size-72 text-brand-300/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-3xl animate-slide-up-far">
          <p className="text-sm font-bold text-brand-300">{eyebrow}</p>
          <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-brand-100">
              {description}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="relative mt-6 animate-slide-up-far [animation-delay:120ms]">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
