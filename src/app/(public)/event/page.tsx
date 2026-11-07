import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { EventCard } from "@/modules/events/components/event-card";
import { listUpcomingEventsPaginated } from "@/modules/events/services";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ruang Event · Webinar, Workshop, dan Acara Komunitas",
  description:
    "Temukan webinar, workshop, pelatihan, dan acara komunitas Indonesia. Daftar gratis dan dapatkan pengingat di RuangKumpul.",
  keywords: ["event indonesia", "webinar gratis", "workshop online", "acara komunitas"],
  alternates: { canonical: "/event" },
};

const PAGE_SIZE = 12;

const FORMAT_FILTERS = [
  { value: "", label: "Semua" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
] as const;

type EventFormatFilter = (typeof FORMAT_FILTERS)[number]["value"];

function isFormatFilter(v: string | undefined): v is EventFormatFilter {
  return !!v && ["online", "offline", "hybrid"].includes(v);
}

async function EventContent({
  searchParams,
}: {
  searchParams: Promise<{ format?: string; page?: string }>;
}) {
  const { format: formatParam, page: pageParam } = await searchParams;
  const format = isFormatFilter(formatParam) ? formatParam : undefined;
  const page = Math.max(1, Math.min(100, Number(pageParam) || 1));

  const { events, total } = await listUpcomingEventsPaginated({
    page,
    pageSize: PAGE_SIZE,
    format: format || undefined,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="animate-fade-in">
      <PageHero
        eyebrow="Ruang Event"
        title="Belajar dan bertemu di event terbaik."
        description="Webinar, workshop, dan acara komunitas dari penyelenggara di seluruh Indonesia. Daftar gratis dengan satu klik."
      >
        <Button asChild size="lg" className="bg-white text-brand-800 shadow-lg shadow-brand-950/25 hover:bg-brand-50">
          <Link href="/event/buat">
            <Plus className="size-5" aria-hidden="true" />
            Buat Event
          </Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-labelledby="event-list">
        <h2 id="event-list" className="sr-only">Daftar event</h2>

        {/* Filter format */}
        <div className="mb-8 flex flex-wrap gap-2 animate-fade-in">
          {FORMAT_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={f.value ? `/event?format=${f.value}` : "/event"}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95",
                (format ?? "") === f.value
                  ? "border-brand-800 bg-brand-800 text-white shadow-sm shadow-brand-900/20"
                  : "border-slate-200 bg-surface text-ink-secondary hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-sm",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {events.length > 0 ? (
          <>
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

            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath="/event"
                query={format ? { format } : undefined}
                className="mt-10"
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={format ? "Belum ada event dengan format ini" : "Belum ada event mendatang"}
            description={
              format
                ? "Coba lihat semua format event, event baru ditambahkan setiap hari."
                : "Jadilah yang pertama mengadakan event: workshop, webinar, atau kopdar komunitas."
            }
            action={
              format ? (
                <Link href="/event" className="text-sm font-semibold text-brand-700 hover:underline">
                  Lihat semua event
                </Link>
              ) : (
                <Link
                  href="/event/buat"
                  className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-900 active:scale-95"
                >
                  Buat Event Pertama
                </Link>
              )
            }
          />
        )}
      </section>
    </div>
  );
}

export default function EventPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton cards={3} />}>
      <EventContent searchParams={searchParams} />
    </Suspense>
  );
}
