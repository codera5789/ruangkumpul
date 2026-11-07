import Link from "next/link";
import { CalendarDays, MapPin, Users, Video } from "lucide-react";
import { formatDateId, formatCompactId } from "@/lib/utils";
import type { EventWithOrganizer } from "@/modules/events/services";

const formatLabels = {
  online: { label: "Online", icon: Video },
  offline: { label: "Offline", icon: MapPin },
  hybrid: { label: "Hybrid", icon: MapPin },
} as const;

/** Kartu ringkas event untuk listing dan beranda. */
export function EventCard({ event }: { event: EventWithOrganizer }) {
  const meta = formatLabels[event.format] ?? formatLabels.online;
  const Icon = meta.icon;

  return (
    <Link
      href={`/event/${event.slug}`}
      className="group flex flex-col rounded-card border border-slate-200/80 bg-surface p-5 shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 transition-colors duration-300 group-hover:bg-brand-800 group-hover:text-white">
          <Icon className="size-3.5" aria-hidden="true" />
          {meta.label}
        </span>
        {event.category ? (
          <span className="truncate text-xs font-medium text-ink-muted">{event.category}</span>
        ) : null}
      </div>

      <h3 className="mt-3 line-clamp-2 font-bold leading-snug text-ink group-hover:text-brand-800">
        {event.title}
      </h3>

      <div className="mt-auto space-y-1.5 pt-4 text-sm text-ink-secondary">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          {formatDateId(event.starts_at, {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {event.location ? (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            <span className="truncate">{event.location}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-1.5">
          <Users className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          {formatCompactId(event.participant_count)} terdaftar
          {event.max_participants ? ` / ${formatCompactId(event.max_participants)}` : ""}
        </p>
      </div>
    </Link>
  );
}
