import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/modules/careers/components/job-form";
import { getJobBySlug } from "@/modules/careers/services";

export const metadata: Metadata = { title: "Sunting Lowongan" };

interface EditJobPageProps {
  params: Promise<{ slug: string }>;
}

async function EditJobContent({ params }: EditJobPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/karier/${slug}/edit`);

  const [job, { data: isMod }] = await Promise.all([
    getJobBySlug(slug),
    supabase.rpc("is_moderator"),
  ]);

  if (!job) notFound();
  if (job.posted_by !== user.id && !isMod) {
    redirect(`/karier/${slug}`);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/karier/${job.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke {job.title}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Sunting Lowongan</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Perbarui posisi, rentang gaji, URL lamaran, atau status lowongan.
        </p>
      </div>
      <JobForm initialJob={job} />
    </div>
  );
}

export default function EditLowonganPage({ params }: EditJobPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" aria-hidden="true">
          <div className="h-96 animate-pulse rounded-card bg-slate-200/50" />
        </div>
      }
    >
      <EditJobContent params={params} />
    </Suspense>
  );
}
