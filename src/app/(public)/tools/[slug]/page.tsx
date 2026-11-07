import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { BookmarkButton } from "@/components/shared/bookmark-button";
import { ToolCard } from "@/modules/tools/components/tool-card";
import { ToolRenderer } from "@/modules/tools/components/tool-renderer";
import { ToolFavoriteButton } from "@/modules/tools/components/tool-favorite-button";
import { ToolUsageLogger } from "@/modules/tools/components/tool-usage-logger";
import {
  TOOL_CATEGORIES,
  TOOLS,
  getCategoryBySlug,
  getToolBySlug,
  getToolsByCategory,
} from "@/modules/tools/tools-registry/registry";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) return { title: "Tool tidak ditemukan" };

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    keywords: tool.keywords,
    alternates: { canonical: tool.route },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: tool.route,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) notFound();

  const category = getCategoryBySlug(tool.category);
  const related = getToolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 4);

  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    description: tool.seoDescription,
    url: `${siteConfig.url}${tool.route}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/tools` },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `${siteConfig.url}${tool.route}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="animate-fade-in">
      <script
        type="application/ld+json"
        // Data berasal dari registry statis kami, bukan input pengguna.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-5xl items-center gap-1.5 px-4 pt-6 text-sm text-ink-secondary sm:px-6"
      >
        <Link href="/" className="hover:text-brand-800">Beranda</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <Link href="/tools" className="hover:text-brand-800">Tools</Link>
        <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />
        <span className="truncate font-medium text-ink">{tool.name}</span>
      </nav>

      {/* Header tool */}
      <header className="mx-auto max-w-5xl px-4 pt-4 pb-8 sm:px-6 animate-slide-up-far">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-ink">
              {tool.name}
            </h1>
            <p className="mt-2 max-w-3xl text-pretty text-ink-secondary">
              {tool.description}
            </p>
            {category ? (
              <p className="mt-3 text-sm">
                Kategori:{" "}
                <span className="font-semibold text-brand-800">{category.name}</span>
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ToolFavoriteButton toolSlug={tool.slug} />
            <BookmarkButton resourceType="tool" resourceId={tool.slug} />
          </div>
        </div>
      </header>

      {/* Antarmuka tool */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 animate-scale-in">
        <ToolUsageLogger slug={tool.slug} />
        <ToolRenderer slug={tool.slug} />
      </div>

      {/* Cara pakai */}
      <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6" aria-labelledby="cara-pakai">
        <h2 id="cara-pakai" className="text-xl font-extrabold text-ink">
          Cara menggunakan {tool.name}
        </h2>
        <ol className="mt-4 space-y-3">
          {tool.howTo.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-ink-secondary">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="text-xl font-extrabold text-ink">
          Pertanyaan umum
        </h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-card border border-slate-200/80 bg-surface px-5">
          {tool.faqs.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {faq.question}
                <ChevronRight
                  className="size-4 shrink-0 text-ink-muted transition-transform group-open:rotate-90"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-secondary">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Tool terkait */}
      {related.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pt-12 pb-16 sm:px-6" aria-labelledby="terkait">
          <h2 id="terkait" className="text-xl font-extrabold text-ink">
            Tool terkait
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-secondary">
            Lihat semua{" "}
            <Link href="/tools" className="font-semibold text-brand-700 hover:underline">
              {TOOLS.length} tools RuangKumpul
            </Link>
            : kategori {TOOL_CATEGORIES.map((c) => c.name.toLowerCase()).join(", ")}.
          </p>
        </section>
      ) : null}
    </div>
  );
}
