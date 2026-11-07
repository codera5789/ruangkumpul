"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";
import { cn } from "@/lib/utils";

type Phase = "fokus" | "istirahat";

const MIN_MINUTES = 1;
const MAX_MINUTES = 120;
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const TICK_INTERVAL_MS = 250;

/** Format milidetik menjadi "MM:SS" (dibulatkan ke atas agar "25:00" tampil di awal). */
function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PomodoroTimer() {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES);
  const [phase, setPhase] = useState<Phase>("fokus");
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_FOCUS_MINUTES * 60_000);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const endTimeRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const baseTitleRef = useRef<string | null>(null);

  // Simpan judul tab asli dan pastikan dipulihkan saat komponen unmount.
  useEffect(() => {
    baseTitleRef.current = document.title;
    return () => {
      if (baseTitleRef.current !== null) document.title = baseTitleRef.current;
    };
  }, []);

  const restoreTabTitle = useCallback(() => {
    if (baseTitleRef.current !== null) document.title = baseTitleRef.current;
  }, []);

  // AudioContext hanya dibuat dari alur yang diinisiasi gesture pengguna
  // (klik Mulai/Lewati) agar beep tidak diblokir kebijakan autoplay browser.
  const ensureAudioContext = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      // Web Audio tidak tersedia — timer tetap berfungsi tanpa suara.
      return null;
    }
  }, []);

  const playPhaseEndBeep = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      for (const offset of [0, 0.3, 0.6]) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.25);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      }
    } catch {
      // Kegagalan pemutaran suara tidak boleh mengganggu alur timer.
    }
  }, []);

  /**
   * Pindah ke fase berikutnya. `automatic` bernilai true saat fase berakhir alami
   * (satu sesi fokus dihitung selesai), false saat pengguna menekan "Lewati".
   */
  const advanceToNextPhase = useCallback(
    (automatic: boolean) => {
      if (automatic && phase === "fokus") {
        setSessionsCompleted((prev) => prev + 1);
      }
      playPhaseEndBeep();
      const nextPhase: Phase = phase === "fokus" ? "istirahat" : "fokus";
      const durationMs = (nextPhase === "fokus" ? focusMinutes : breakMinutes) * 60_000;
      endTimeRef.current = Date.now() + durationMs;
      setPhase(nextPhase);
      setRemainingMs(durationMs);
    },
    [phase, focusMinutes, breakMinutes, playPhaseEndBeep],
  );

  // Sisa waktu selalu dihitung dari endTime berbasis Date.now() sehingga tetap
  // akurat meski tab berpindah ke latar belakang; interval hanya penyegar UI.
  useEffect(() => {
    if (!running) return;
    const intervalId = setInterval(() => {
      const endTime = endTimeRef.current;
      if (endTime === null) return;
      const leftMs = endTime - Date.now();
      if (leftMs <= 0) {
        advanceToNextPhase(true);
      } else {
        setRemainingMs(leftMs);
      }
    }, TICK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [running, advanceToNextPhase]);

  // Judul tab menampilkan hitungan mundur selama timer berjalan.
  useEffect(() => {
    if (!running) return;
    const label = phase === "fokus" ? "Fokus" : "Istirahat";
    document.title = `${formatMs(remainingMs)} · ${label} | RuangKumpul`;
  }, [running, remainingMs, phase]);

  const isFokus = phase === "fokus";
  const totalMs = (isFokus ? focusMinutes : breakMinutes) * 60_000;
  const progressPct =
    totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 0;
  const isFreshPhase = remainingMs === totalMs;

  function handleStart() {
    ensureAudioContext();
    endTimeRef.current = Date.now() + remainingMs;
    setRunning(true);
  }

  function handlePause() {
    const endTime = endTimeRef.current;
    if (endTime !== null) {
      setRemainingMs(Math.max(0, endTime - Date.now()));
    }
    endTimeRef.current = null;
    setRunning(false);
    restoreTabTitle();
  }

  function handleReset() {
    endTimeRef.current = null;
    setRunning(false);
    setPhase("fokus");
    setRemainingMs(focusMinutes * 60_000);
    restoreTabTitle();
  }

  function handleSkip() {
    ensureAudioContext();
    advanceToNextPhase(false);
  }

  function clampMinutes(raw: string): number | null {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return null;
    return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parsed));
  }

  function handleFocusMinutesChange(raw: string) {
    const minutes = clampMinutes(raw);
    if (minutes === null || minutes === focusMinutes) return;
    setFocusMinutes(minutes);
    // Sinkronkan hitungan mundur hanya jika fase fokus belum terpakai sama sekali.
    if (!running && isFokus && remainingMs === focusMinutes * 60_000) {
      setRemainingMs(minutes * 60_000);
    }
  }

  function handleBreakMinutesChange(raw: string) {
    const minutes = clampMinutes(raw);
    if (minutes === null || minutes === breakMinutes) return;
    setBreakMinutes(minutes);
    if (!running && !isFokus && remainingMs === breakMinutes * 60_000) {
      setRemainingMs(minutes * 60_000);
    }
  }

  return (
    <div className="grid gap-6">
      <ToolPanel>
        <div className="flex flex-col items-center gap-5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold",
              isFokus ? "bg-brand-50 text-brand-800" : "bg-emerald-50 text-emerald-700",
            )}
          >
            {isFokus ? "Fokus" : "Istirahat"}
          </span>

          <p
            aria-live="polite"
            className={cn(
              "font-mono text-6xl font-extrabold tracking-tight tabular-nums sm:text-7xl",
              isFokus ? "text-brand-800" : "text-emerald-600",
            )}
          >
            {formatMs(remainingMs)}
          </p>

          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-surface-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200",
                isFokus ? "bg-brand-800" : "bg-emerald-600",
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={handleStart} disabled={running}>
              {isFreshPhase ? "Mulai" : "Lanjut"}
            </Button>
            <Button variant="outline" onClick={handlePause} disabled={!running}>
              Jeda
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="ghost" onClick={handleSkip}>
              Lewati
            </Button>
          </div>

          <p className="text-sm text-ink-secondary">
            Sesi selesai: <span className="font-bold text-ink">{sessionsCompleted}</span>
          </p>
        </div>
      </ToolPanel>

      <ToolPanel title="Pengaturan durasi">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ToolLabel htmlFor="durasi-fokus" hint="1–120 menit">
              Durasi fokus
            </ToolLabel>
            <Input
              id="durasi-fokus"
              type="number"
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              value={focusMinutes}
              disabled={running}
              onChange={(event) => handleFocusMinutesChange(event.target.value)}
            />
          </div>
          <div>
            <ToolLabel htmlFor="durasi-istirahat" hint="1–120 menit">
              Durasi istirahat
            </ToolLabel>
            <Input
              id="durasi-istirahat"
              type="number"
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              value={breakMinutes}
              disabled={running}
              onChange={(event) => handleBreakMinutesChange(event.target.value)}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Timer dihitung dari waktu nyata sehingga tetap akurat meski tab berpindah. Judul tab akan
          menampilkan hitungan mundur selama timer berjalan.
        </p>
      </ToolPanel>
    </div>
  );
}
