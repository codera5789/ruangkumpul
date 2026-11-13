"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { uniqueSlug } from "@/lib/utils";
import { isUuid, zodFieldErrors, type ActionState } from "@/lib/form";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

export type JobActionState = ActionState;

const jobSchema = z
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

function parseAndValidateJobPayload(formData: FormData) {
  const parsed = jobSchema.safeParse({
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
    return {
      ok: false as const,
      state: { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) },
    };
  }

  const salaryMin = parsed.data.salaryMin ? Number(parsed.data.salaryMin.replace(/\D/g, "")) : null;
  const salaryMax = parsed.data.salaryMax ? Number(parsed.data.salaryMax.replace(/\D/g, "")) : null;

  if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
    return {
      ok: false as const,
      state: { error: "Gaji maksimal tidak boleh lebih kecil dari minimal.", success: null },
    };
  }

  return {
    ok: true as const,
    payload: {
      company_name: parsed.data.companyName,
      title: parsed.data.title,
      description: parsed.data.description,
      job_type: parsed.data.jobType,
      location: parsed.data.location || null,
      is_remote: parsed.data.isRemote,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_period: parsed.data.salaryPeriod,
      apply_url: parsed.data.applyUrl,
    },
  };
}

export async function actionCreateJob(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const validated = parseAndValidateJobPayload(formData);
  if (!validated.ok) return validated.state;

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Kamu harus masuk untuk memasang lowongan.", success: null };

  try {
    await enforceRateLimit(`job-create:${user.id}`, 5, 3600);
  } catch {
    return { error: "Batas memasang lowongan tercapai. Coba lagi nanti.", success: null };
  }

  // Slug unik: perusahaan + posisi + random suffix.
  const slug = uniqueSlug(`${validated.payload.company_name} ${validated.payload.title}`, "lowongan", 180);

  const { data: job, error } = await supabase
    .from("job_listings")
    .insert({
      posted_by: user.id,
      slug,
      ...validated.payload,
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

export async function actionUpdateJob(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const jobId = String(formData.get("jobId") || "");
  if (!isUuid(jobId)) return { error: "Lowongan tidak valid.", success: null };

  const validated = parseAndValidateJobPayload(formData);
  if (!validated.ok) return validated.state;

  const status = formData.get("status") === "closed" ? "closed" : "published";

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Kamu harus masuk untuk menyunting lowongan.", success: null };

  const [{ data: existing }, { data: isMod }] = await Promise.all([
    supabase.from("job_listings").select("id, slug, posted_by").eq("id", jobId).single(),
    supabase.rpc("is_moderator"),
  ]);

  if (!existing) return { error: "Lowongan tidak ditemukan.", success: null };
  if (existing.posted_by !== user.id && !isMod) {
    return { error: "Kamu tidak punya izin menyunting lowongan ini.", success: null };
  }

  const { data: updated, error } = await supabase
    .from("job_listings")
    .update({
      ...validated.payload,
      status,
    })
    .eq("id", jobId)
    .select("id");

  if (error || !updated || updated.length === 0) {
    console.error("[careers] gagal memperbarui lowongan:", error?.message);
    return { error: "Gagal menyimpan perubahan lowongan.", success: null };
  }

  revalidatePath("/karier");
  revalidatePath(`/karier/${existing.slug}`);
  revalidatePath(`/karier/${existing.slug}/edit`);
  return { error: null, success: "Perubahan lowongan disimpan." };
}

export async function actionCloseJob(formData: FormData): Promise<void> {
  const jobSlug = String(formData.get("jobSlug") || "");
  const nextStatus = formData.get("nextStatus") === "published" ? "published" : "closed";
  if (!jobSlug) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  // RLS: pemilik atau moderator.
  await supabase.from("job_listings").update({ status: nextStatus }).eq("slug", jobSlug);

  revalidatePath("/karier");
  revalidatePath(`/karier/${jobSlug}`);
}
