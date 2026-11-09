import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { CommunitySearch } from "@/modules/community/components/community-search";
import { listPublicCommunitiesPaginated } from "@/modules/community/services";

export const metadata: Metadata = {
  title: "Komunitas · Temukan dan Bangun Komunitasmu",
  description:
    "Jelajahi komunitas di RuangKumpul: diskusi, berbagi ide, dan bangun jaringan dengan sesama pengguna dari berbagai minat.",
  keywords: ["komunitas online indonesia", "forum diskusi", "community indonesia"],
  alternates: { canonical: "/komunitas" },
};

const PAGE_SIZE = 24;

async function KomunitasContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.min(100, Number(pageParam) || 1));

  const { communities: visible, total } = await listPublicCommunitiesPaginated({
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="animate-fade-in">
      <PageHero
        eyebrow="Ruang Komunitas"
        title="Temukan komunitasmu."
        description="Bergabung dengan diskusi yang relevan, atau bangun komunitas sendiri untuk minat dan profesimu."
      >
        <Button
          asChild
          size="lg"
          className="bg-white text-brand-800 shadow-lg shadow-brand-950/25 hover:bg-brand-50"
        >
          <Link href="/komunitas/buat">
            <Plus className="size-5" aria-hidden="true" />
            Buat Komunitas
          </Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {visible.length > 0 ? (
          <>
            <CommunitySearch communities={visible} />
            {totalPages > 1 ? (
              <Pagination page={page} totalPages={totalPages} basePath="/komunitas" className="mt-10" />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Users}
            title="Belum ada komunitas"
            description="Jadilah pelopor! Buat komunitas pertama dan kumpulkan orang-orang dengan minat yang sama."
            action={
              <Button asChild>
                <Link href="/komunitas/buat">Buat Komunitas Pertama</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

export default function KomunitasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <KomunitasContent searchParams={searchParams} />
    </Suspense>
  );
}
