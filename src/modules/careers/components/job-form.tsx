"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/modules/auth/components/submit-button";
import {
  actionCreateJob,
  actionUpdateJob,
  type JobActionState,
} from "@/modules/careers/actions";
import type { JobWithPoster } from "@/modules/careers/services";

const initialState: JobActionState = { error: null, success: null };

/** Form pasang atau sunting lowongan kerja. */
export function JobForm({ initialJob }: { initialJob?: JobWithPoster }) {
  const isEdit = Boolean(initialJob);
  const [state, formAction] = useActionState(
    isEdit ? actionUpdateJob : actionCreateJob,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {initialJob ? <input type="hidden" name="jobId" value={initialJob.id} /> : null}

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="companyName" className="mb-1.5 block text-sm font-semibold text-ink">
                Nama perusahaan *
              </label>
              <Input
                id="companyName"
                name="companyName"
                required
                maxLength={120}
                defaultValue={initialJob?.company_name ?? ""}
                placeholder="PT Maju Bersama"
                error={state.fieldErrors?.companyName}
              />
            </div>
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-ink">
                Posisi *
              </label>
              <Input
                id="title"
                name="title"
                required
                minLength={5}
                maxLength={200}
                defaultValue={initialJob?.title ?? ""}
                placeholder="Frontend Developer"
                error={state.fieldErrors?.title}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-ink">
              Deskripsi * <span className="font-normal text-ink-muted">(tanggung jawab, kualifikasi, benefit)</span>
            </label>
            <Textarea
              id="description"
              name="description"
              required
              rows={12}
              minLength={30}
              maxLength={10000}
              defaultValue={initialJob?.description ?? ""}
              error={state.fieldErrors?.description}
            />
          </div>

          <div>
            <label htmlFor="applyUrl" className="mb-1.5 block text-sm font-semibold text-ink">
              URL lamaran * <span className="font-normal text-ink-muted">(email/hr portal, pelamar diarahkan ke sini)</span>
            </label>
            <Input
              id="applyUrl"
              name="applyUrl"
              type="url"
              required
              defaultValue={initialJob?.apply_url ?? ""}
              placeholder="https://karier.perusahaan.com/loker-frontend"
              error={state.fieldErrors?.applyUrl}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-slate-200/80 bg-surface p-4">
            <label htmlFor="jobType" className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Tipe pekerjaan *
            </label>
            <Select id="jobType" name="jobType" defaultValue={initialJob?.job_type ?? "full_time"}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Kontrak</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Magang</option>
            </Select>

            <label htmlFor="location" className="mb-1.5 mt-3 block text-xs font-semibold text-ink-secondary">
              Lokasi
            </label>
            <Input
              id="location"
              name="location"
              maxLength={120}
              defaultValue={initialJob?.location ?? ""}
              placeholder="mis. Bandung"
              error={state.fieldErrors?.location}
            />

            <label className="mt-3 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="isRemote"
                defaultChecked={initialJob?.is_remote ?? false}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-semibold text-ink">Bekerja remote</span>
            </label>

            {isEdit && initialJob ? (
              <>
                <label htmlFor="status" className="mb-1.5 mt-4 block text-xs font-semibold text-ink-secondary">
                  Status lowongan
                </label>
                <Select id="status" name="status" defaultValue={initialJob.status}>
                  <option value="published">Tayang (dibuka)</option>
                  <option value="closed">Ditutup</option>
                </Select>
              </>
            ) : null}
          </div>

          <div className="rounded-card border border-slate-200/80 bg-surface p-4">
            <p className="mb-3 text-xs font-semibold text-ink-secondary">Rentang gaji (opsional)</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="salaryMin"
                inputMode="numeric"
                defaultValue={initialJob?.salary_min ?? ""}
                placeholder="4000000"
                aria-label="Gaji minimal"
              />
              <Input
                name="salaryMax"
                inputMode="numeric"
                defaultValue={initialJob?.salary_max ?? ""}
                placeholder="8000000"
                aria-label="Gaji maksimal"
              />
            </div>
            <Select
              name="salaryPeriod"
              defaultValue={initialJob?.salary_period ?? "bulan"}
              className="mt-2"
              aria-label="Periode gaji"
            >
              <option value="bulan">per bulan</option>
              <option value="tahun">per tahun</option>
              <option value="proyek">per proyek</option>
              <option value="jam">per jam</option>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <SubmitButton
              className="flex-1"
              pendingText="Menyimpan..."
            >
              {isEdit ? "Simpan Perubahan" : "Pasang Lowongan"}
            </SubmitButton>
            {isEdit && initialJob ? (
              <Button asChild variant="outline">
                <Link href={`/karier/${initialJob.slug}`}>Kembali</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
