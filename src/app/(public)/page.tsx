import { Suspense } from "react";
import { BookOpen, Compass, Users } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/layout/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { CommunityCard } from "@/modules/community/components/community-card";
import { ArticleCard } from "@/modules/knowledge/components/article-card";
import { FEATURED_TOOL_SLUGS, getToolBySlug } from "@/modules/tools/tools-registry/registry";
import { ToolCard } from "@/modules/tools/components/tool-card";
import { listLatestArticles } from "@/modules/knowledge/services";
import { listTopCommunities } from "@/modules/community/services";

const pillars = [
  {
    icon: Compass,
    title: "Tools",
    caption: "Gratis digunakan",
    description: "21 tools praktis untuk kerja, belajar, dan bisnis — tanpa login.",
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
        articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
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
        communities.map((community) => (
          <CommunityCard key={community.id} community={community} />
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
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-accent-600">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            <Badge className="border border-white/20 bg-white/10 text-white">
              All-in-One Platform
            </Badge>
            <Badge className="border border-white/20 bg-white/10 text-white">
              Community Driven
            </Badge>
            <Badge className="border border-white/20 bg-white/10 text-white">
              Digital Ecosystem
            </Badge>
          </div>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Temukan semua yang kamu butuhkan.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-brand-100 sm:text-lg">
            {siteConfig.description}
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchInput className="[&_input]:h-14 [&_input]:rounded-2xl [&_input]:bg-white [&_input]:text-base [&_input]:shadow-lg" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-100">
            <Link href="/tools" className="underline-offset-4 hover:underline">
              21 tools gratis
            </Link>
            <span aria-hidden="true" className="text-white/40">•</span>
            <Link href="/artikel" className="underline-offset-4 hover:underline">
              Artikel &amp; tutorial
            </Link>
            <span aria-hidden="true" className="text-white/40">•</span>
            <Link href="/komunitas" className="underline-offset-4 hover:underline">
              Komunitas aktif
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pilar utama ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6" aria-labelledby="pilar-utama">
        <h2 id="pilar-utama" className="sr-only">Pilar utama</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="group rounded-card border border-slate-200/80 bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-800 text-white">
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
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
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
        <div className="rounded-card bg-gradient-to-br from-brand-800 to-accent-600 px-6 py-14 text-center sm:px-12">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Satu akun untuk semua kebutuhan digitalmu
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-brand-100">
            Daftar gratis untuk menyimpan bookmark, mengikuti diskusi, dan
            mendapatkan notifikasi konten baru.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-brand-800 hover:bg-brand-50">
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
      </section>
    </div>
  );
}
