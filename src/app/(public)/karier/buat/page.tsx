import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/modules/careers/components/job-form";

export const metadata: Metadata = { title: "Pasang Lowongan" };

async function BuatLowonganContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/karier/buat");

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Pasang Lowongan</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Gratis. Lowongan tayang setelah disimpan: pastikan deskripsi jelas dan URL lamaran valid.
        </p>
      </div>
      <JobForm />
    </div>
  );
}

export default function BuatLowonganPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><div className="h-96 animate-pulse rounded-card bg-slate-200/50" /></div>}>
      <BuatLowonganContent />
    </Suspense>
  );
}
