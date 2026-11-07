import { Suspense } from "react";
import { BookOpen, Compass, Users } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/layout/search-input";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { CommunityCard } from "@/modules/community/components/community-card";
import { PersonalizedSection } from "@/modules/community/components/personalized-section";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { FEATURED_TOOL_SLUGS, getToolBySlug, TOOL_COUNT } from "@/modules/tools/tools-registry/registry";
import { ToolCard } from "@/modules/tools/components/tool-card";
import { listLatestArticles } from "@/modules/knowledge/services";
import { listTopCommunities } from "@/modules/community/services";

const pillars = [
  {
    icon: Compass,
    title: "Tools",
    caption: "Gratis digunakan",
    description: `${TOOL_COUNT} tools praktis untuk kerja, belajar, dan bisnis — tanpa login.`,
    href: "/tools",
  },
  {
    icon: BookOpen,
    title: "Pengetahuan",
    caption: "Belajar bersama",
    description: "Artikel dan tutorial pilihan untuk mengembangkan skill Anda.",
    href: "/artikel",
  },
  {
    icon: Users,
    title: "Komunitas",
    caption: "Terhubung bersama",
    description: "Diskusi, berbagi ide, dan bangun jaringan dengan sesama.",
    href: "/komunitas",
  },
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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-accent-600">
        {/* Ornamen latar — murni dekoratif */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-accent-400/25 blur-3xl animate-float" />
          <div className="absolute -right-24 -bottom-32 size-96 rounded-full bg-brand-300/20 blur-3xl animate-float [animation-delay:-3.5s]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 animate-slide-up-far">
            <Badge className="border border-white/20 bg-white/10 text-white transition-colors duration-300 hover:bg-white/20">
              All-in-One Platform
            </Badge>
            <Badge className="border border-white/20 bg-white/10 text-white transition-colors duration-300 hover:bg-white/20">
              Community Driven
            </Badge>
            <Badge className="border border-white/20 bg-white/10 text-white transition-colors duration-300 hover:bg-white/20">
              Digital Ecosystem
            </Badge>
          </div>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl animate-slide-up-far [animation-delay:80ms]">
            Temukan semua yang kamu butuhkan.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-brand-100 sm:text-lg animate-slide-up-far [animation-delay:160ms]">
            {siteConfig.description}
          </p>

          <div className="mx-auto mt-8 max-w-2xl animate-slide-up-far [animation-delay:240ms]">
            <SearchInput className="[&_input]:h-14 [&_input]:rounded-2xl [&_input]:bg-white [&_input]:text-base [&_input]:shadow-lg [&_input]:transition-shadow [&_input]:duration-300 hover:[&_input]:shadow-xl focus-within:[&_input]:shadow-xl" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-100 animate-slide-up-far [animation-delay:320ms]">
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
      </section>

      {/* ── Pilar utama ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6" aria-labelledby="pilar-utama">
        <h2 id="pilar-utama" className="sr-only">Pilar utama</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map((pillar, i) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              style={{ animationDelay: `${i * 90}ms` }}
              className="group rounded-card border border-slate-200/80 bg-surface p-6 shadow-card transition-all duration-300 ease-out-expo animate-slide-up-far hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-800 text-white transition-all duration-300 ease-out-expo group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-brand-800/25">
                <pillar.icon className="size-6" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">
                {pillar.caption}
              </p>
              <h3 className="mt-1 text-lg font-bold text-ink">{pillar.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                {pillar.description}
              </p>
            </Link>
          ))}
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
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6" aria-labelledby="artikel-terbaru">
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
          <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-800 to-accent-600 px-6 py-14 text-center sm:px-12">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 right-10 size-56 rounded-full bg-white/10 blur-3xl animate-float" />
              <div className="absolute -bottom-24 left-6 size-64 rounded-full bg-accent-300/20 blur-3xl animate-float [animation-delay:-3s]" />
            </div>
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
