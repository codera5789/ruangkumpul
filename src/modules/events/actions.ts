"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { zodFieldErrors } from "@/lib/form";
import { requireUser } from "@/lib/auth";
import { parseWibDateTime } from "@/lib/datetime";
import { enforceRateLimit } from "@/lib/rate-limit";

export interface EventActionState {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
}

const createEventSchema = z
  .object({
    title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200),
    description: z
      .string()
      .trim()
      .min(20, "Deskripsi minimal 20 karakter")
      .max(10000, "Deskripsi maksimal 10.000 karakter"),
    format: z.enum(["online", "offline", "hybrid"]),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    onlineUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https?:\/\/.+\..+/.test(v), "URL harus dimulai https://")
      .optional()
      .or(z.literal("")),
    startsAt: z.string().trim().min(1, "Tanggal mulai wajib diisi"),
    endsAt: z.string().trim().optional().or(z.literal("")),
    category: z.string().trim().max(60).optional().or(z.literal("")),
    maxParticipants: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || (/^\d+$/.test(v) && Number(v) > 0),
        "Kuota harus bilangan bulat positif",
      ),
  })
  .refine(
    (data) => data.format === "online" || (data.location ?? "").length > 0,
    { message: "Lokasi wajib untuk event offline/hybrid", path: ["location"] },
  );

export async function actionCreateEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const parsed = createEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    format: formData.get("format") || "online",
    location: formData.get("location"),
    onlineUrl: formData.get("onlineUrl"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    category: formData.get("category"),
    maxParticipants: formData.get("maxParticipants"),
  });

  if (!parsed.success) {
    return { error: null, success: null, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Kamu harus masuk untuk membuat event.", success: null };

  try {
    await enforceRateLimit(`event-create:${user.id}`, 5, 3600);
  } catch {
    return { error: "Batas membuat event tercapai. Coba lagi nanti.", success: null };
  }

  const startsAt = parseWibDateTime(parsed.data.startsAt);
  if (!startsAt) {
    return { error: "Tanggal mulai tidak valid.", success: null };
  }

  let endsAt: Date | null = null;
  if (parsed.data.endsAt) {
    endsAt = parseWibDateTime(parsed.data.endsAt);
    if (!endsAt) {
      return { error: "Tanggal berakhir tidak valid.", success: null };
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      return { error: "Tanggal berakhir harus setelah tanggal mulai.", success: null };
    }
  }

  const maxParticipants = parsed.data.maxParticipants
    ? Number(parsed.data.maxParticipants)
    : null;

  const baseSlug = slugify(parsed.data.title).slice(0, 200) || "event";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      format: parsed.data.format,
      location: parsed.data.location || null,
      online_url: parsed.data.onlineUrl || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      category: parsed.data.category || null,
      max_participants: maxParticipants && maxParticipants > 0 ? maxParticipants : null,
      status: "published",
    })
    .select("slug")
    .single();

  if (error || !event) {
    console.error("[events] gagal membuat event:", error?.message);
    return { error: "Gagal membuat event. Coba lagi.", success: null };
  }

  revalidatePath("/event");
  redirect(`/event/${event.slug}`);
}

export async function actionToggleEventRegistration(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const eventSlug = String(formData.get("eventSlug") || "");
  if (!eventSlug) return { error: "Event tidak valid.", success: null };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/event/${eventSlug}`);

  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("slug", eventSlug)
    .single();
  if (!event || event.status !== "published") {
    return { error: "Event tidak tersedia untuk pendaftaran.", success: null };
  }

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("id", existing.id);
    if (error) {
      console.error("[events] gagal membatalkan pendaftaran:", error.message);
      return { error: "Gagal membatalkan pendaftaran. Coba lagi.", success: null };
    }
    revalidatePath(`/event/${eventSlug}`);
    return { error: null, success: "Pendaftaran dibatalkan." };
  }

  // RPC atomik: cek kuota + insert dalam satu transaksi (anti race kuota).
  const { data: result, error } = await supabase.rpc("register_event", {
    p_event_id: event.id,
  });

  if (error) {
    console.error("[events] register_event gagal:", error.message);
    return { error: "Gagal mendaftar. Coba lagi.", success: null };
  }

  revalidatePath(`/event/${eventSlug}`);
  switch (result) {
    case "ok":
      return { error: null, success: "Berhasil mendaftar! Sampai jumpa di event." };
    case "already":
      return { error: null, success: "Kamu sudah terdaftar di event ini." };
    case "full":
      return { error: "Maaf, kuota event sudah penuh.", success: null };
    case "ended":
      return { error: "Event ini sudah dimulai atau berakhir.", success: null };
    default:
      return { error: "Event tidak tersedia untuk pendaftaran.", success: null };
  }
}

export async function actionDeleteEvent(formData: FormData): Promise<void> {
  const eventSlug = String(formData.get("eventSlug") || "");
  if (!eventSlug) return;

  const { supabase, user } = await requireUser();
  if (!user) return;

  // RLS: organizer atau moderator.
  await supabase.from("events").delete().eq("slug", eventSlug);
  revalidatePath("/event");
  redirect("/event");
}
