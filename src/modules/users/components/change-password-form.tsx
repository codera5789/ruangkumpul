"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (next.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (next !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Verifikasi password lama dengan mencoba login ulang.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("Sesi tidak valid. Masuk kembali.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (verifyError) {
      setError("Password saat ini salah.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });

    if (updateError) {
      setError("Gagal memperbarui password. Coba lagi.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Password berhasil diperbarui.
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="current-password" className="text-sm font-semibold text-ink">
          Password saat ini
        </label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm font-semibold text-ink">
            Password baru
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Minimal 8 karakter"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-sm font-semibold text-ink">
            Konfirmasi password baru
          </label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Memperbarui..." : "Perbarui Password"}
      </Button>
    </form>
  );
}
