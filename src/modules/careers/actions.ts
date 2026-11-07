"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

export interface JobActionState {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
}

function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const createJobSchema = z
  .object({
    companyName: z.string().trim().min(2, "Nama perusahaan minimal 2 karakter").max(120),
    title: z.string().trim().min(5, "Posisi minimal 5 karakter").max(200),
    description: z
      .string()
      .trim()
      .min(30, "Deskripsi minimal 30 karakter (tugas, kualifikasi, benefit)")
      .max(10000),
    jobType: z.enum(["full_time", "part_time", "contract", "freelance", "internship"]),
    location: z.string().trim().max(120).optional().or(z.literal("")),
    isRemote: z.boolean().default(false),
    salaryMin: z.string().trim().optional().or(z.literal("")),
    salaryMax: z.string().trim().optional().or(z.literal("")),
    salaryPeriod: z.enum(["bulan", "tahun", "proyek", "jam"]).default("bulan"),
    applyUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => /^https?:\/\/.+\..+/.test(v), "URL lamaran harus dimulai https://"),
  })
  .refine(
    (d) => d.isRemote || (d.location ?? "").length > 0,
    { message: "Lokasi wajib diisi untuk lowongan non-remote", path: ["location"] },
  );

export async function actionCreateJob(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = createJobSchema.safeParse({
    companyName: formData.get("companyName"),
    title: formData.get("title"),
    description: formData.get("description"),
    jobType: formData.get("jobType") || "full_time",
    location: formData.get("location"),
    isRemote: formData.get("isRemote") === "on",
    salaryMin: formData.get("salaryMin"),
    salaryMax: formData.get("salaryMax"),
    salaryPeriod: formData.get("salaryPeriod") || "bulan",
    applyUrl: formData.get("applyUrl"),
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Kamu harus masuk untuk memasang lowongan.", success: null };

  try {
    await enforceRateLimit(`job-create:${user.id}`, 5, 3600);
  } catch {
    return { error: "Batas memasang lowongan tercapai. Coba lagi nanti.", success: null };
  }

  const salaryMin = parsed.data.salaryMin ? Number(parsed.data.salaryMin.replace(/\D/g, "")) : null;
  const salaryMax = parsed.data.salaryMax ? Number(parsed.data.salaryMax.replace(/\D/g, "")) : null;

  if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
    return { error: "Gaji maksimal tidak boleh lebih kecil dari minimal.", success: null };
  }

  // Slug unik: perusahaan + posisi + random suffix.
  const baseSlug =
    slugify(`${parsed.data.companyName} ${parsed.data.title}`).slice(0, 180) || "lowongan";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: job, error } = await supabase
    .from("job_listings")
    .insert({
      posted_by: user.id,
      company_name: parsed.data.companyName,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      job_type: parsed.data.jobType,
      location: parsed.data.location || null,
      is_remote: parsed.data.isRemote,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_period: parsed.data.salaryPeriod,
      apply_url: parsed.data.applyUrl,
      status: "published",
    })
    .select("slug")
    .single();

  if (error || !job) {
    console.error("[careers] gagal membuat lowongan:", error?.message);
    return { error: "Gagal membuat lowongan. Coba lagi.", success: null };
  }

  revalidatePath("/karier");
  redirect(`/karier/${job.slug}`);
}

export async function actionCloseJob(formData: FormData): Promise<void> {
  const jobSlug = String(formData.get("jobSlug") || "");
  if (!jobSlug) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS: pemilik atau moderator.
  await supabase.from("job_listings").update({ status: "closed" }).eq("slug", jobSlug);

  revalidatePath("/karier");
  revalidatePath(`/karier/${jobSlug}`);
}
