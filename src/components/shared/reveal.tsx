"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealVariant = "up" | "scale" | "left" | "right";

interface RevealProps {
  children: ReactNode;
  /** Arah/efek masuk. Default "up". */
  variant?: RevealVariant;
  /** Delay animasi dalam ms — pakai untuk stagger grid (i * 60). */
  delay?: number;
  className?: string;
}

/**
 * Satu IntersectionObserver bersama untuk semua instance Reveal:
   elemen yang sudah terlihat di-unobserve, jadi murah walau dipakai di
   seluruh halaman. State tersembunyi awal dikendalikan CSS (html.js gate),
   komponen ini hanya menambah class "is-revealed" saat elemen masuk viewport.
 */
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            sharedObserver?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
  }
  return sharedObserver;
}

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      el.classList.add("is-revealed");
      return;
    }

    const observer = getSharedObserver();
    if (!observer) {
      el.classList.add("is-revealed");
      return;
    }
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={variant}
      className={cn(className)}
      style={
        (delay ? { "--reveal-delay": `${delay}ms` } : undefined) as
          | CSSProperties
          | undefined
      }
    >
      {children}
    </div>
  );
}
