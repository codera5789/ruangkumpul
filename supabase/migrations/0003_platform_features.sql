-- ============================================================================
-- RuangKumpul — Platform Features (Migration 0003)
-- 1. Policy insert audit_logs untuk admin (agar audit berjalan tanpa service role)
-- 2. user_settings — preferensi notifikasi & tema
-- 3. rate_limit_hits + check_rate_limit() — rate limiting berbasis database
-- 4. Trigger notifikasi otomatis (komentar, suka, selamat datang)
-- 5. increment_post_view() — view counter diskusi
-- 6. Deduplikasi laporan (1 user = 1 laporan per target)
-- 7. Perluas tipe resource bookmarks (event, job)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Audit logs: admin boleh menulis via RLS (fallback tanpa service role)
-- ---------------------------------------------------------------------------
create policy "audit_logs_admin_insert" on public.audit_logs
  for insert to authenticated with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. user_settings
-- ---------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notify_comments boolean not null default true,
  notify_likes boolean not null default true,
  notify_mentions boolean not null default true,
  notify_product boolean not null default true,
  theme varchar(10) not null default 'system'
    check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_own" on public.user_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger trg_user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Rate limiting berbasis database (aman untuk serverless/multi-instance)
-- ---------------------------------------------------------------------------
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  hit_at timestamptz not null default now()
);

create index rate_limit_hits_bucket_idx on public.rate_limit_hits (bucket, hit_at desc);

alter table public.rate_limit_hits enable row level security;
-- Tidak ada policy: tabel hanya disentuh lewat fungsi security definer di bawah.

create or replace function public.check_rate_limit(
  p_bucket text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  if p_bucket is null or p_max_hits is null or p_window_seconds is null then
    return true;
  end if;

  -- Buang hit di luar jendela waktu (pembersihan oportunistik per bucket).
  delete from public.rate_limit_hits
  where bucket = p_bucket
    and hit_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into v_hits
  from public.rate_limit_hits
  where bucket = p_bucket
    and hit_at >= now() - make_interval(secs => p_window_seconds);

  if v_hits >= p_max_hits then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 4a. Helper: buat notifikasi menghormati preferensi penerima
-- ---------------------------------------------------------------------------
create or replace function public.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type varchar,
  p_title varchar,
  p_message text,
  p_resource_type varchar default null,
  p_resource_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs record;
begin
  -- Jangan notifikasi diri sendiri.
  if p_user_id is null or p_actor_id is null or p_user_id = p_actor_id then
    return;
  end if;

  select * into v_prefs from public.user_settings where user_id = p_user_id;

  case p_type
    when 'comment' then
      if found and v_prefs.notify_comments = false then return; end if;
    when 'like' then
      if found and v_prefs.notify_likes = false then return; end if;
    when 'mention' then
      if found and v_prefs.notify_mentions = false then return; end if;
    else
      -- tipe lain (welcome, system): selalu kirim
      null;
  end case;

  insert into public.notifications (user_id, actor_id, type, title, message, resource_type, resource_id)
  values (p_user_id, p_actor_id, p_type, p_title, p_message, p_resource_type, p_resource_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4b. Trigger: komentar diskusi → notifikasi penulis post & penulis komentar induk
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts;
  v_parent_author uuid;
begin
  select * into v_post from public.posts where id = new.post_id;
  if v_post.id is null then
    return new;
  end if;

  -- Penulis post
  perform public.create_notification(
    v_post.author_id,
    new.author_id,
    'comment',
    'Komentar baru di diskusimu',
    left(new.content, 140),
    'post',
    v_post.id
  );

  -- Penulis komentar induk (balasan)
  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> v_post.author_id then
      perform public.create_notification(
        v_parent_author,
        new.author_id,
        'comment',
        'Balasan baru di komentarmu',
        left(new.content, 140),
        'post',
        v_post.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_post_comment on public.comments;
create trigger trg_notify_post_comment
  after insert on public.comments
  for each row execute function public.notify_on_post_comment();

-- ---------------------------------------------------------------------------
-- 4c. Trigger: suka → notifikasi pemilik target (post & artikel)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_title varchar(200);
  v_href_label text;
begin
  if new.reaction_type <> 'like' then
    return new;
  end if;

  if new.target_type = 'post' then
    select author_id, title into v_owner, v_title from public.posts where id = new.target_id;
    v_href_label := 'diskusimu';
  elsif new.target_type = 'article' then
    select author_id, title into v_owner, v_title from public.articles where id = new.target_id;
    v_href_label := 'artikelmu';
  else
    return new; -- like komentar tidak dinotifikasi (mengurangi kebisingan)
  end if;

  perform public.create_notification(
    v_owner,
    new.user_id,
    'like',
    'Seseorang menyukai ' || v_href_label,
    coalesce(v_title, ''),
    new.target_type,
    new.target_id
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_reaction on public.reactions;
create trigger trg_notify_reaction
  after insert on public.reactions
  for each row execute function public.notify_on_reaction();

-- ---------------------------------------------------------------------------
-- 4d. Trigger: komentar artikel → notifikasi penulis artikel
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_article_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  select author_id into v_author from public.articles where id = new.article_id;

  perform public.create_notification(
    v_author,
    new.author_id,
    'comment',
    'Komentar baru di artikelmu',
    left(new.content, 140),
    'article',
    new.article_id
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_article_comment on public.article_comments;
create trigger trg_notify_article_comment
  after insert on public.article_comments
  for each row execute function public.notify_on_article_comment();

-- ---------------------------------------------------------------------------
-- 4e. Perbarui handle_new_user: buat user_settings + notifikasi selamat datang
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    left(split_part(coalesce(new.email, 'user'), '@', 1), 20)
      || '_' || substr(md5(random()::text), 1, 6),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notifications (user_id, type, title, message)
  values (
    new.id,
    'welcome',
    'Selamat datang di RuangKumpul! 🎉',
    'Lengkapi profilmu, jelajahi 21 tools gratis, dan temukan komunitas yang cocok untukmu.'
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. View counter diskusi
-- ---------------------------------------------------------------------------
create or replace function public.increment_post_view(p_post uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set view_count = view_count + 1 where id = p_post;
$$;

grant execute on function public.increment_post_view(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Deduplikasi laporan: satu pengguna satu laporan per target
-- ---------------------------------------------------------------------------
drop index if exists reports_unique_per_reporter;
create unique index reports_unique_per_reporter
  on public.reports (reporter_id, target_type, target_id);

-- ---------------------------------------------------------------------------
-- 7. Perluas tipe resource bookmarks: event & job; resource_id jadi text
--    (uuid untuk konten database, slug untuk tool dari registry statis)
-- ---------------------------------------------------------------------------
alter table public.bookmarks drop constraint bookmarks_resource_type_check;
alter table public.bookmarks add constraint bookmarks_resource_type_check
  check (resource_type in ('tool', 'article', 'post', 'event', 'job'));

alter table public.bookmarks alter column resource_id type text using resource_id::text;
