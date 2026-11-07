"use client";

import { useEffect } from "react";

/**
 * Mencatat satu kali pemakaian tool per sesi browser (fire-and-forget).
 * Tidak me-render apa pun.
 */
export function ToolUsageLogger({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `rk-tool-used-${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage tidak tersedia — tetap kirim.
    }

    fetch("/api/tools/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // Gagal mencatat tidak boleh mengganggu pemakaian.
    });
  }, [slug]);

  return null;
}
