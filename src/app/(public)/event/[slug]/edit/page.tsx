import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/modules/events/components/event-form";
import { getEventBySlug } from "@/modules/events/services";

export const metadata: Metadata = { title: "Sunting Event" };

interface EditEventPageProps {
  params: Promise<{ slug: string }>;
}

async function EditEventContent({ params }: EditEventPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/event/${slug}/edit`);

  const [event, { data: isMod }] = await Promise.all([
    getEventBySlug(slug),
    supabase.rpc("is_moderator"),
  ]);

  if (!event) notFound();
  if (event.organizer_id !== user.id && !isMod) {
    redirect(`/event/${slug}`);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/event/${event.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke {event.title}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Sunting Event</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Perbarui jadwal, tautan pertemuan, kuota, atau status event.
        </p>
      </div>
      <EventForm initialEvent={event} />
    </div>
  );
}

export default function EditEventPage({ params }: EditEventPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" aria-hidden="true">
          <div className="h-96 animate-pulse rounded-card bg-slate-200/50" />
        </div>
      }
    >
      <EditEventContent params={params} />
    </Suspense>
  );
}
