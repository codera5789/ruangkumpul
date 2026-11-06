import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { CommunitySearch } from "@/modules/community/components/community-search";
import { listTopCommunities } from "@/modules/community/services";

export const metadata: Metadata = {
  title: "Komunitas — Temukan dan Bangun Komunitasmu",
  description:
    "Jelajahi komunitas di RuangKumpul: diskusi, berbagi ide, dan bangun jaringan dengan sesama pengguna dari berbagai minat.",
  keywords: ["komunitas online indonesia", "forum diskusi", "community indonesia"],
  alternates: { canonical: "/komunitas" },
};

async function KomunitasContent() {
  const communities = await listTopCommunities(24);

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-brand-800 to-accent-600">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-brand-200">Ruang Komunitas</p>
              <h1 className="mt-1 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Temukan komunitasmu.
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-brand-100">
                Bergabung dengan diskusi yang relevan, atau bangun komunitas
                sendiri untuk minat dan profesimu.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-white text-brand-800 hover:bg-brand-50"
            >
              <Link href="/komunitas/buat">
                <Plus className="size-5" aria-hidden="true" />
                Buat Komunitas
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {communities.length > 0 ? (
          <CommunitySearch communities={communities} />
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

export default function KomunitasPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <KomunitasContent />
    </Suspense>
  );
}
