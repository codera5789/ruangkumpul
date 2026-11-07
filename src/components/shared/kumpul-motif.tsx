import { cn } from "@/lib/utils";

/**
 * Motif identitas "Kumpul" (DESIGN.md): lingkaran pertemuan — titik anggota
 * berkumpul mengelilingi ruang pusat. Murni dekoratif (aria-hidden), warna
 * mengikuti currentColor agar bekerja di tema terang dan gelap.
 * Dosis pemakaian: maksimal 2 per layar.
 */
export function KumpulMotif({ className }: { className?: string }) {
  // 8 kursi "anggota" pada lingkaran putus-putus (r=96), pusat (128, 128).
  const seats = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return { x: 128 + 96 * Math.cos(angle), y: 128 + 96 * Math.sin(angle) };
  });

  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      <circle cx="128" cy="128" r="12" fill="currentColor" />
      <circle cx="128" cy="128" r="40" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="128"
        cy="128"
        r="96"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 7"
      />
      {seats.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r="7"
          fill="currentColor"
          opacity={i % 2 === 0 ? 0.9 : 0.55}
        />
      ))}
    </svg>
  );
}
