import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/modules/events/components/event-form";

export const metadata: Metadata = { title: "Buat Event" };

async function BuatEventContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/event/buat");

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Buat Event</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Umumkan webinar, workshop, atau acara komunitasmu ke seluruh pengguna RuangKumpul.
        </p>
      </div>
      <EventForm />
    </div>
  );
}

export default function BuatEventPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><div className="h-96 animate-pulse rounded-card bg-slate-200/50" /></div>}>
      <BuatEventContent />
    </Suspense>
  );
}
