"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "rk-theme";

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.classList.toggle("dark", effective === "dark");
}

/** Toggle tema terang/gelap; tersimpan di localStorage. */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Inline script di root layout sudah menerapkan tema sebelum paint;
    // di sini kita hanya menyelaraskan state tombol dengan tema efektif.
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage + penanda hydrate; pola wajib untuk tema tersimpan
    setIsDark(
      stored === "dark" ||
        (stored === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
    setMounted(true);

    // Ikuti perubahan preferensi OS hanya saat pilihan masih "system".
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
      if (current === "system") {
        applyTheme("system");
        setIsDark(mq.matches);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next: Theme = isDark ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    setIsDark(next === "dark");
    applyTheme(next);
  }

  const effectiveDark = mounted && isDark;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={effectiveDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className="flex size-9 items-center justify-center rounded-full text-ink-secondary transition-all duration-200 hover:bg-surface-muted hover:text-ink active:scale-90"
    >
      {effectiveDark ? (
        <Sun className="size-5 transition-transform duration-500 ease-out-expo hover:rotate-90" aria-hidden="true" />
      ) : (
        <Moon className="size-5 transition-transform duration-500 ease-out-expo hover:-rotate-12" aria-hidden="true" />
      )}
    </button>
  );
}
