"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, X } from "lucide-react";

export function ServiceWorkerRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Registrasi Service Worker untuk PWA dan offline caching
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => {
            console.error("[sw] Gagal registrasi service worker:", err);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }
    }

    // 2. Deteksi status koneksi internet
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
      setDismissed(false);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Notifikasi koneksi kembali normal
  if (showReconnected) {
    return (
      <aside
        aria-live="polite"
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2.5 rounded-card border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lift animate-slide-up"
      >
        <Wifi className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
        <span>Koneksi kembali terhubung.</span>
      </aside>
    );
  }

  // Banner mode offline
  if (isOffline && !dismissed) {
    return (
      <aside
        aria-live="polite"
        className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-950 shadow-lift animate-slide-up sm:text-sm"
      >
        <WifiOff className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-amber-900">Mode offline aktif</p>
          <p className="mt-0.5 text-amber-800">
            Tools yang telah dibuka sebelumnya tetap dapat digunakan tanpa kuota atau internet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Tutup pemberitahuan offline"
          className="rounded-lg p-1 text-amber-800 transition-colors hover:bg-amber-200/60"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </aside>
    );
  }

  return null;
}
