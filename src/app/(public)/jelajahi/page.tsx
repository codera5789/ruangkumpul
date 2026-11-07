import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Briefcase, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { CommunityCard } from "@/modules/community/components/community-card";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { ToolCard } from "@/modules/tools/components/tool-card";
import { EventCard } from "@/modules/events/components/event-card";
import { JobCard } from "@/modules/careers/components/job-card";
import { TOOL_CATEGORIES, TOOLS } from "@/modules/tools/tools-registry/registry";
import { listTopCommunities } from "@/modules/community/services";
import { listPublishedArticles } from "@/modules/knowledge/services";
import { listUpcomingEvents } from "@/modules/events/services";
import { listPublishedJobs } from "@/modules/careers/services";

export const metadata: Metadata = {
  title: "Jelajahi Semua Konten RuangKumpul",
  description:
    "Jelajahi seluruh isi RuangKumpul: tools gratis, artikel, dan komunitas aktif dalam satu halaman.",
  alternates: { canonical: "/jelajahi" },
};

async function ArticlesSection() {
  const { articles } = await listPublishedArticles({ page: 1, pageSize: 6 });

  if (articles.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-10 text-center text-sm text-ink-secondary">
        Artikel akan segera hadir.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

async function CommunitiesSection() {
  const communities = await listTopCommunities(6);

  if (communities.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-10 text-center text-sm text-ink-secondary">
        Belum ada komunitas.{" "}
        <Link href="/komunitas/buat" className="font-semibold text-brand-700 hover:underline">
          Buat yang pertama →
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
}

async function EventsSection() {
  const events = await listUpcomingEvents(3);

  if (events.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-10 text-center text-sm text-ink-secondary">
        Belum ada event mendatang.{" "}
        <Link href="/event/buat" className="font-semibold text-brand-700 hover:underline">
          Adakan yang pertama →
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

async function JobsSection() {
  const jobs = await listPublishedJobs(4);

  if (jobs.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-10 text-center text-sm text-ink-secondary">
        Belum ada lowongan.{" "}
        <Link href="/karier/buat" className="font-semibold text-brand-700 hover:underline">
          Pasang yang pertama →
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

export default function JelajahiPage() {
  const popularTools = TOOLS.slice(0, 8);

  return (
    <div className="animate-fade-in">
      <PageHero
        eyebrow="Jelajahi"
        title="Semua yang RuangKumpul punya, dalam satu halaman."
      />

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6">
        {/* Tools */}
        <section aria-labelledby="jelajahi-tools">
          <Reveal>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 id="jelajahi-tools" className="flex items-center gap-2 text-xl font-extrabold text-ink">
                  <Wrench className="size-5 text-brand-800" aria-hidden="true" /> Tools
                </h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  {TOOLS.length} tools gratis dalam {TOOL_CATEGORIES.length} kategori.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/tools">Semua tools</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularTools.map((tool, i) => (
                <div
                  key={tool.slug}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-slide-up-far"
                >
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Artikel */}
        <section aria-labelledby="jelajahi-artikel">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="jelajahi-artikel" className="flex items-center gap-2 text-xl font-extrabold text-ink">
                <BookOpen className="size-5 text-brand-800" aria-hidden="true" /> Artikel
              </h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Bacaan terbaru dari kontributor.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/artikel">
                Semua artikel <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <Suspense fallback={<PageSkeleton cards={3} />}>
            <ArticlesSection />
          </Suspense>
        </section>

        {/* Komunitas */}
        <section aria-labelledby="jelajahi-komunitas">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="jelajahi-komunitas" className="flex items-center gap-2 text-xl font-extrabold text-ink">
                <Users className="size-5 text-brand-800" aria-hidden="true" /> Komunitas
              </h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Tempat berkumpulnya diskusi aktif.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/komunitas">
                Semua komunitas <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <Suspense fallback={<PageSkeleton cards={3} />}>
            <CommunitiesSection />
          </Suspense>
        </section>

        {/* Event */}
        <section aria-labelledby="jelajahi-event">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="jelajahi-event" className="flex items-center gap-2 text-xl font-extrabold text-ink">
                <CalendarDays className="size-5 text-brand-800" aria-hidden="true" /> Event
              </h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Webinar dan workshop mendatang.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/event">
                Semua event <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <Suspense fallback={<PageSkeleton cards={3} />}>
            <EventsSection />
          </Suspense>
        </section>

        {/* Karier */}
        <section aria-labelledby="jelajahi-karier">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="jelajahi-karier" className="flex items-center gap-2 text-xl font-extrabold text-ink">
                <Briefcase className="size-5 text-brand-800" aria-hidden="true" /> Lowongan
              </h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Peluang kerja dan freelance terbaru.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/karier">
                Semua lowongan <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <Suspense fallback={<PageSkeleton cards={2} />}>
            <JobsSection />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
