-- ============================================================================
-- RuangKumpul — Modul Baru (Migration 0004)
-- 1. Ruang Event      — events + event_registrations
-- 2. Ruang Karier     — job_listings
-- 3. Ruang Produktivitas — notes + tasks
-- 4. Newsletter       — newsletter_subscribers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. RUANG EVENT
-- ---------------------------------------------------------------------------
create type public.event_format as enum ('online', 'offline', 'hybrid');
create type public.event_status as enum ('published', 'cancelled', 'archived');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null,
  slug varchar(220) not null unique,
  description text not null check (char_length(description) <= 10000),
  format public.event_format not null default 'online',
  location varchar(200),
  online_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  category varchar(60),
  cover_url text,
  status public.event_status not null default 'published',
  max_participants integer check (max_participants is null or max_participants > 0),
  participant_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_status_starts_idx on public.events (status, starts_at);
create index events_organizer_idx on public.events (organizer_id);
create index events_title_trgm_idx on public.events using gin (title gin_trgm_ops);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_registrations_user_idx on public.event_registrations (user_id);

-- Sinkronisasi jumlah peserta
create or replace function public.sync_event_participant_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.events
  set participant_count = (
    select count(*) from public.event_registrations
    where event_id = coalesce(new.event_id, old.event_id)
  )
  where id = coalesce(new.event_id, old.event_id);
  return null;
end;
$$;

create trigger trg_event_registrations_insert
  after insert on public.event_registrations
  for each row execute function public.sync_event_participant_count();
create trigger trg_event_registrations_delete
  after delete on public.event_registrations
  for each row execute function public.sync_event_participant_count();

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

create policy "events_select" on public.events
  for select using (
    status = 'published'
    or organizer_id = auth.uid()
    or public.is_moderator()
  );
create policy "events_insert_own" on public.events
  for insert to authenticated with check (organizer_id = auth.uid() and status = 'published');
create policy "events_update_own" on public.events
  for update to authenticated
  using (organizer_id = auth.uid() or public.is_moderator())
  with check (organizer_id = auth.uid() or public.is_moderator());
create policy "events_delete_own" on public.events
  for delete to authenticated
  using (organizer_id = auth.uid() or public.is_moderator());

create policy "event_registrations_select" on public.event_registrations
  for select using (user_id = auth.uid());
create policy "event_registrations_insert_own" on public.event_registrations
  for insert to authenticated with check (user_id = auth.uid());
create policy "event_registrations_delete_own" on public.event_registrations
  for delete to authenticated using (user_id = auth.uid());

create trigger trg_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. RUANG KARIER
-- ---------------------------------------------------------------------------
create type public.job_type as enum ('full_time', 'part_time', 'contract', 'freelance', 'internship');
create type public.job_status as enum ('published', 'closed');

create table public.job_listings (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles(id) on delete cascade,
  company_name varchar(120) not null,
  title varchar(200) not null,
  slug varchar(220) not null unique,
  description text not null check (char_length(description) <= 10000),
  job_type public.job_type not null default 'full_time',
  location varchar(120),
  is_remote boolean not null default false,
  salary_min bigint,
  salary_max bigint,
  salary_period varchar(20) not null default 'bulan'
    check (salary_period in ('bulan', 'tahun', 'proyek', 'jam')),
  apply_url text not null,
  status public.job_status not null default 'published',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_salary_range_check check (salary_min is null or salary_max is null or salary_max >= salary_min)
);

create index job_listings_status_idx on public.job_listings (status, created_at desc);
create index job_listings_posted_by_idx on public.job_listings (posted_by);
create index job_listings_title_trgm_idx on public.job_listings using gin (title gin_trgm_ops);
create index job_listings_company_trgm_idx on public.job_listings using gin (company_name gin_trgm_ops);

alter table public.job_listings enable row level security;

create policy "job_listings_select" on public.job_listings
  for select using (
    status = 'published'
    or posted_by = auth.uid()
    or public.is_moderator()
  );
create policy "job_listings_insert_own" on public.job_listings
  for insert to authenticated with check (posted_by = auth.uid() and status = 'published');
create policy "job_listings_update_own" on public.job_listings
  for update to authenticated
  using (posted_by = auth.uid() or public.is_moderator())
  with check (posted_by = auth.uid() or public.is_moderator());
create policy "job_listings_delete_own" on public.job_listings
  for delete to authenticated
  using (posted_by = auth.uid() or public.is_moderator());

create trigger trg_job_listings_updated_at before update on public.job_listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. RUANG PRODUKTIVITAS — catatan & tugas (100% milik pengguna)
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null default 'Catatan tanpa judul',
  content text not null default '' check (char_length(content) <= 50000),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_idx on public.notes (user_id, updated_at desc);

create type public.task_status as enum ('todo', 'doing', 'done');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null,
  status public.task_status not null default 'todo',
  due_date date,
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_idx on public.tasks (user_id, status, position);

alter table public.notes enable row level security;
alter table public.tasks enable row level security;

create policy "notes_own" on public.notes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_own" on public.tasks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger trg_notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger trg_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. NEWSLETTER
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null,
  source varchar(50) not null default 'footer',
  is_active boolean not null default true,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- Satu email aktif; re-subscribe mengaktifkan kembali baris lama.
create unique index newsletter_subscribers_email_idx
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter_subscribers_insert" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);
create policy "newsletter_subscribers_admin_read" on public.newsletter_subscribers
  for select to authenticated using (public.is_admin());
create policy "newsletter_subscribers_admin_update" on public.newsletter_subscribers
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
