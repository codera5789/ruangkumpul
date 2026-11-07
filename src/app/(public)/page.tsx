import { Suspense } from "react";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/layout/search-input";
import { KumpulMotif } from "@/components/shared/kumpul-motif";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { CommunityCard } from "@/modules/community/components/community-card";
import { PersonalizedSection } from "@/modules/community/components/personalized-section";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { FEATURED_TOOL_SLUGS, getToolBySlug, TOOL_COUNT } from "@/modules/tools/tools-registry/registry";
import { ToolCard } from "@/modules/tools/components/tool-card";
import { listLatestArticles } from "@/modules/knowledge/services";
import { listTopCommunities } from "@/modules/community/services";

/**
 * Posisi chip pada cincin motif (r=96/256 = 37,5% dari kontainer): orbit
 * "kumpul" di panel kanan hero. Semua tujuan adalah rute produk nyata.
 */
const orbitItems = [
  { icon: Wrench, label: "Tools", href: "/tools", x: 50, y: 12.5 },
  { icon: BookOpen, label: "Artikel", href: "/artikel", x: 85.7, y: 38.4 },
  { icon: Users, label: "Komunitas", href: "/komunitas", x: 72, y: 80.3 },
  { icon: CalendarDays, label: "Event", href: "/event", x: 28, y: 80.3 },
  { icon: Briefcase, label: "Karier", href: "/karier", x: 14.3, y: 38.4 },
];

async function LatestArticlesSection() {
  const articles = await listLatestArticles(6);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.length > 0 ? (
        articles.map((article, i) => (
          <div
            key={article.id}
            style={{ animationDelay: `${i * 70}ms` }}
            className="animate-slide-up-far"
          >
            <ArticleCard article={article} />
          </div>
        ))
      ) : (
        <div className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center sm:col-span-2 lg:col-span-3">
          <p className="font-semibold text-ink">Belum ada artikel</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-secondary">
            Artikel dan tutorial akan segera hadir. Nantikan update dari tim
            RuangKumpul.
          </p>
        </div>
      )}
    </div>
  );
}

async function TopCommunitiesSection() {
  const communities = await listTopCommunities(6);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.length > 0 ? (
        communities.map((community, i) => (
          <div
            key={community.id}
            style={{ animationDelay: `${i * 70}ms` }}
            className="animate-slide-up-far"
          >
            <CommunityCard community={community} />
          </div>
        ))
      ) : (
        <div className="rounded-card border border-dashed border-slate-300 bg-surface px-6 py-14 text-center sm:col-span-2 lg:col-span-3">
          <p className="font-semibold text-ink">Belum ada komunitas</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-secondary">
            Jadilah yang pertama membuat komunitas dan mulai berdiskusi!
          </p>
          <Button asChild className="mt-4">
            <Link href="/komunitas/buat">Buat Komunitas</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-52 animate-pulse rounded-card bg-slate-200/50" />
      ))}
    </div>
  );
}

export default function HomePage() {
  const featuredTools = FEATURED_TOOL_SLUGS.map(getToolBySlug).filter(
    (t): t is NonNullable<typeof t> => Boolean(t),
  );

  return (
    <div className="animate-fade-in">
      <Suspense fallback={null}>
        <PersonalizedSection />
      </Suspense>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-950">
        {/* Satu motif di kiri bawah; motif kedua adalah cincin orbit di panel kanan. */}
        <KumpulMotif className="absolute -bottom-40 -left-32 size-96 text-brand-300/10" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-16 sm:px-6 sm:pt-20 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white animate-slide-up-far sm:text-5xl">
              Semua yang kamu butuhkan, dalam satu{" "}
              <span className="text-brand-300">ruang</span>.
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-brand-100 animate-slide-up-far [animation-delay:80ms] sm:text-lg">
              {siteConfig.description}
            </p>

            <div className="mt-8 animate-slide-up-far [animation-delay:160ms]">
              <SearchInput className="[&_input]:h-14 [&_input]:rounded-card [&_input]:bg-white [&_input]:text-base [&_input]:shadow-lg [&_input]:transition-shadow [&_input]:duration-300 hover:[&_input]:shadow-xl focus-within:[&_input]:shadow-xl" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-100 animate-slide-up-far [animation-delay:240ms]">
              <Link href="/tools" className="underline-offset-4 transition-colors hover:text-white hover:underline">
                {TOOL_COUNT} tools gratis
              </Link>
              <span aria-hidden="true" className="text-white/40">•</span>
              <Link href="/artikel" className="underline-offset-4 transition-colors hover:text-white hover:underline">
                Artikel &amp; tutorial
              </Link>
              <span aria-hidden="true" className="text-white/40">•</span>
              <Link href="/komunitas" className="underline-offset-4 transition-colors hover:text-white hover:underline">
                Komunitas aktif
              </Link>
            </div>
          </div>

          {/* Orbit pilar: lingkaran pertemuan. Pusat = ruang; chip = tujuan nyata. */}
          <div
            aria-label="Jelajahi RuangKumpul"
            className="relative mx-auto hidden aspect-square w-full max-w-[420px] lg:block"
          >
            <KumpulMotif className="absolute inset-0 size-full text-brand-300/30" />
            <div className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white text-brand-800 shadow-lift animate-scale-in">
              <UsersRound className="size-8" aria-hidden="true" />
            </div>
            {orbitItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: `${200 + i * 80}ms` }}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-card border border-white/10 bg-surface py-2 pr-3.5 pl-2 shadow-lift animate-pop-in transition-all duration-200 ease-out-expo hover:-translate-y-[52%] hover:border-brand-300"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-800 transition-colors duration-200 group-hover:bg-brand-800 group-hover:text-white">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-ink">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools unggulan ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6" aria-labelledby="tools-unggulan">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 id="tools-unggulan" className="text-2xl font-extrabold tracking-tight text-ink">
              Tools unggulan
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Paling sering digunakan. Semua gratis, tanpa login.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/tools">Lihat semua</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTools.map((tool, i) => (
            <div
              key={tool.slug}
              style={{ animationDelay: `${i * 70}ms` }}
              className="animate-slide-up-far"
            >
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Artikel terbaru ──────────────────────────────────────────────── */}
      <section className="border-y border-slate-200/60 bg-surface py-14" aria-labelledby="artikel-terbaru">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 id="artikel-terbaru" className="text-2xl font-extrabold tracking-tight text-ink">
              Artikel terbaru
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Bacaan pilihan untuk menambah wawasan.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/artikel">Lihat semua</Link>
          </Button>
        </div>
        <Suspense fallback={<SectionSkeleton />}>
          <LatestArticlesSection />
        </Suspense>
        </div>
      </section>
      {/* ── Komunitas aktif ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6" aria-labelledby="komunitas-aktif">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 id="komunitas-aktif" className="text-2xl font-extrabold tracking-tight text-ink">
              Komunitas aktif
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Temukan tempat berdiskusi yang cocok untukmu.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/komunitas">Lihat semua</Link>
          </Button>
        </div>
        <Suspense fallback={<SectionSkeleton />}>
          <TopCommunitiesSection />
        </Suspense>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-card bg-brand-900 px-6 py-14 text-center sm:px-12">
            <KumpulMotif className="absolute -top-20 -right-16 size-64 text-brand-300/15" />
            <KumpulMotif className="absolute -bottom-24 -left-16 size-72 text-brand-300/10" />
            <h2 className="relative text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Satu akun untuk semua kebutuhan digitalmu
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-pretty text-brand-100">
              Daftar gratis untuk menyimpan bookmark, mengikuti diskusi, dan
              mendapatkan notifikasi konten baru.
            </p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-brand-800 shadow-lg shadow-brand-950/30 hover:bg-brand-50">
                <Link href="/register">Daftar Gratis</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/tentang">Pelajari RuangKumpul</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
