import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EventCard } from "@/modules/events/components/event-card";
import { listUpcomingEvents } from "@/modules/events/services";

export const metadata: Metadata = {
  title: "Ruang Event — Webinar, Workshop, dan Acara Komunitas",
  description:
    "Temukan webinar, workshop, pelatihan, dan acara komunitas Indonesia. Daftar gratis dan dapatkan pengingat di RuangKumpul.",
  keywords: ["event indonesia", "webinar gratis", "workshop online", "acara komunitas"],
  alternates: { canonical: "/event" },
};

async function EventContent() {
  const events = await listUpcomingEvents(24);

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-accent-600">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-16 size-72 rounded-full bg-accent-400/25 blur-3xl animate-float" />
          <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-brand-300/20 blur-3xl animate-float [animation-delay:-3.5s]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6 animate-slide-up-far">
            <div>
              <p className="text-sm font-semibold text-brand-200">Ruang Event</p>
              <h1 className="mt-1 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Belajar dan bertemu di event terbaik.
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-brand-100">
                Webinar, workshop, dan acara komunitas dari penyelenggara di seluruh Indonesia.
                Daftar gratis dengan satu klik.
              </p>
            </div>
            <Button asChild size="lg" className="bg-white text-brand-800 shadow-lg shadow-brand-950/25 hover:bg-brand-50">
              <Link href="/event/buat">
                <Plus className="size-5" aria-hidden="true" />
                Buat Event
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-labelledby="event-list">
        <h2 id="event-list" className="sr-only">Daftar event</h2>
        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <div
                key={event.id}
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                className="animate-slide-up-far"
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-16 text-center animate-slide-up-far">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 animate-pop-in">
              <CalendarDays className="size-6" aria-hidden="true" />
            </span>
            <p className="font-semibold text-ink">Belum ada event mendatang</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
              Jadilah yang pertama mengadakan event — workshop, webinar, atau kopdar komunitas.
            </p>
            <Button asChild className="mt-4">
              <Link href="/event/buat">Buat Event Pertama</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function EventPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={3} />}>
      <EventContent />
    </Suspense>
  );
}
