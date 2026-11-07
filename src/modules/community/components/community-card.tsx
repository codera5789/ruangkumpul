import { Users } from "lucide-react";
import Link from "next/link";
import { formatCompactId } from "@/lib/utils";
import type { CommunitySummary } from "@/modules/community/services";

export function CommunityCard({ community }: { community: CommunitySummary }) {
  return (
    <Link
      href={`/komunitas/${community.slug}`}
      className="group flex flex-col gap-3 rounded-card border border-slate-200/80 bg-surface p-5 shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3">
        {community.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={community.icon_url}
            alt=""
            className="size-11 rounded-xl object-cover transition-transform duration-300 ease-out-expo group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-all duration-300 ease-out-expo group-hover:scale-110 group-hover:bg-brand-800 group-hover:text-white">
            <Users className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink transition-colors group-hover:text-brand-800">
            {community.name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <Users className="size-3.5" aria-hidden="true" />
            {formatCompactId(community.member_count)} anggota
          </p>
        </div>
      </div>
      {community.description ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-secondary">
          {community.description}
        </p>
      ) : null}
    </Link>
  );
}
