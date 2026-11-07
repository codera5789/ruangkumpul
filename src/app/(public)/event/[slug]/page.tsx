import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/shared/bookmark-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { createClient } from "@/lib/supabase/server";
import { formatDateId, formatCompactId } from "@/lib/utils";
import {
  actionDeleteEvent,
} from "@/modules/events/actions";
import { RegisterEventButton } from "@/modules/events/components/register-event-button";
import { getEventBySlug } from "@/modules/events/services";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event tidak ditemukan" };

  return {
    title: event.title,
    description: event.description.slice(0, 160),
    alternates: { canonical: `/event/${event.slug}` },
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      url: `/event/${event.slug}`,
      type: "article",
    },
  };
}

async function EventDetailContent({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let registered = false;
  let isOrganizer = false;
  if (user) {
    isOrganizer = event.organizer_id === user.id;
    if (!isOrganizer) {
      const { data: reg } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();
      registered = Boolean(reg);
    }
  }

  const isFull =
    event.max_participants !== null && event.participant_count >= event.max_participants;
  // Server Component per-request: timestamp fresh memang dibutuhkan di sini.
  // eslint-disable-next-line react-hooks/purity -- render server per-request, bukan hook React
  const isPast = new Date(event.starts_at).getTime() < Date.now();
  const organizerName =
    event.profiles?.full_name || event.profiles?.username || "Penyelenggara";

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description.slice(0, 300),
    startDate: event.starts_at,
    endDate: event.ends_at ?? undefined,
    eventAttendanceMode:
      event.format === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.format === "hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    location:
      event.format === "online"
        ? { "@type": "VirtualLocation", url: event.online_url ?? undefined }
        : { "@type": "Place", name: event.location ?? "" },
    organizer: { "@type": "Person", name: organizerName },
  };

  return (
    <div className="animate-slide-up-far">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 pt-6 text-sm text-ink-secondary sm:px-6"
      >
        <Link href="/" className="hover:text-brand-800">Beranda</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <Link href="/event" className="hover:text-brand-800">Event</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <span className="truncate font-medium text-ink">{event.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">
            {event.format === "online" ? "Online" : event.format === "hybrid" ? "Hybrid" : "Offline"}
          </Badge>
          {event.category ? <Badge variant="outline">{event.category}</Badge> : null}
          {isPast ? <Badge variant="warning">Sudah lewat</Badge> : null}
          <div className="ml-auto">
            <BookmarkButton resourceType="event" resourceId={event.id} isLoggedIn={Boolean(user)} />
          </div>
        </div>

        <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink">
          {event.title}
        </h1>

        <Card className="mt-5 p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-ink-muted">Mulai</dt>
                <dd className="text-sm font-semibold text-ink">
                  {formatDateId(event.starts_at, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </div>
            {event.ends_at ? (
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-semibold text-ink-muted">Selesai</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {formatDateId(event.ends_at, {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              </div>
            ) : null}
            {event.format !== "online" && event.location ? (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-semibold text-ink-muted">Lokasi</dt>
                  <dd className="text-sm font-semibold text-ink">{event.location}</dd>
                </div>
              </div>
            ) : null}
            {event.format !== "offline" ? (
              <div className="flex items-start gap-2.5">
                <Video className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-semibold text-ink-muted">Akses online</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {isOrganizer || registered ? (
                      event.online_url ? (
                        <a
                          href={event.online_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-700 hover:underline"
                        >
                          Buka tautan
                        </a>
                      ) : (
                        "Diumumkan penyelenggara"
                      )
                    ) : (
                      "Tersedia setelah mendaftar"
                    )}
                  </dd>
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-2.5">
              <Users className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-ink-muted">Peserta</dt>
                <dd className="text-sm font-semibold text-ink">
                  {formatCompactId(event.participant_count)}
                  {event.max_participants ? ` dari ${formatCompactId(event.max_participants)} kuota` : ""}
                </dd>
              </div>
            </div>
          </dl>

          {/* CTA */}
          {!isOrganizer && !isPast ? (
            <RegisterEventButton eventSlug={event.slug} registered={registered} isFull={isFull} />
          ) : isOrganizer ? (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
              <p className="text-sm text-ink-secondary">Kamu penyelenggara event ini.</p>
              <form action={actionDeleteEvent}>
                <input type="hidden" name="eventSlug" value={event.slug} />
                <Button type="submit" variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="size-4" aria-hidden="true" />
                  Hapus
                </Button>
              </form>
            </div>
          ) : null}
        </Card>

        <div className="prose-like mt-6 space-y-4">
          {event.description.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="text-pretty leading-relaxed whitespace-pre-wrap text-ink-secondary">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-card border border-slate-200/80 bg-surface p-4">
          <Avatar src={event.profiles?.avatar_url} name={organizerName} className="size-10" />
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">Diselenggarakan oleh</p>
            <Link
              href={`/pengguna/${event.profiles?.username}`}
              className="text-sm font-bold text-ink hover:underline"
            >
              {organizerName}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  return (
    <Suspense fallback={<PageSkeleton cards={1} />}>
      <EventDetailContent params={params} />
    </Suspense>
  );
}
