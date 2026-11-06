import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CreateCommunityForm } from "@/modules/community/components/create-community-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Buat Komunitas",
  description: "Bangun komunitas untuk minat atau profesimu di RuangKumpul.",
};

function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-28 w-full rounded-xl bg-slate-200/70" />
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
    </div>
  );
}

async function CreateCommunityContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/komunitas/buat");
  }

  return (
    <div className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8">
      <CreateCommunityForm />
    </div>
  );
}

export default function BuatKomunitasPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Buat komunitas baru
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Komunitas adalah tempat anggota berdiskusi, bertanya, dan berbagi.
          Kamu otomatis menjadi pemilik komunitas yang kamu buat.
        </p>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <CreateCommunityContent />
      </Suspense>
    </div>
  );
}
