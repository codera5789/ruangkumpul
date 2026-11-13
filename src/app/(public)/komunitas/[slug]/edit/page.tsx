import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreateCommunityForm } from "@/modules/community/components/create-community-form";

export const metadata: Metadata = {
  title: "Sunting Komunitas",
};

interface EditCommunityPageProps {
  params: Promise<{ slug: string }>;
}

function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-11 w-full rounded-xl bg-slate-200/70" />
      <div className="h-28 w-full rounded-xl bg-slate-200/70" />
      <div className="h-20 w-20 rounded-2xl bg-slate-200/70" />
    </div>
  );
}

async function EditCommunityContent({ params }: EditCommunityPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/komunitas/${slug}/edit`);

  const [{ data: community }, { data: isAdmin }] = await Promise.all([
    supabase
      .from("communities")
      .select("id, slug, name, description, visibility, icon_url, owner_id")
      .eq("slug", slug)
      .single(),
    supabase.rpc("is_admin"),
  ]);

  if (!community) notFound();
  if (community.owner_id !== user.id && !isAdmin) {
    redirect(`/komunitas/${slug}`);
  }

  return (
    <>
      <Link
        href={`/komunitas/${community.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke {community.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Sunting Komunitas
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Perbarui nama, deskripsi, ikon, atau visibilitas komunitasmu.
        </p>
      </div>

      <div className="rounded-card border border-slate-200/80 bg-surface p-6 shadow-card sm:p-8">
        <CreateCommunityForm mode="edit" initialCommunity={community} />
      </div>
    </>
  );
}

export default function EditKomunitasPage({ params }: EditCommunityPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Suspense fallback={<FormSkeleton />}>
        <EditCommunityContent params={params} />
      </Suspense>
    </div>
  );
}
