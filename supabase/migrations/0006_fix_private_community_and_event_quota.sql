-- ============================================================================
-- RuangKumpul — Migration 0006 (v2 — fix enum: p_statuses kini
--   community_member_status[], bukan text[])
-- Perbaikan keamanan & bug:
--   1. Komunitas privat yang benar-benar privat:
--      a. post/komentar komunitas privat tidak lagi terbaca publik via URL
--         langsung (posts_select & comments_select sebelumnya hanya cek
--         status='published').
--      b. anggota approved/pending kini bisa melihat komunitas privatnya
--         (communities_select sebelumnya hanya mengizinkan owner/moderator
--         platform, sehingga anggota yang disetujui pun mendapat 404).
--      c. permintaan gabung (status='pending') ke komunitas privat kini
--         diizinkan RLS — sebelumnya gagal diam-diam.
--   2. RPC register_event: cek kuota + insert dilakukan atomik di dalam
--      advisory lock per-event, mencegah oversubscription saat dua pengguna
--      mendaftar bersamaan.
--
-- Catatan: helper menggunakan SECURITY DEFINER agar tidak terjadi rekursi
-- policy (pola yang sama dengan is_admin()/is_moderator() di 0001).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper akses komunitas (SECURITY DEFINER — bypass RLS, anti rekursi)
-- ---------------------------------------------------------------------------

-- Apakah auth.uid() anggota komunitas dengan salah satu status tertentu?
create or replace function public.is_community_member(
  p_community_id uuid,
  p_statuses community_member_status[],
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_community_id is not null
    and p_user_id is not null
    and exists (
      select 1 from public.community_members m
      where m.community_id = p_community_id
        and m.user_id = p_user_id
        and m.status = any (p_statuses)
    );
$$;

-- Apakah post terbaca oleh auth.uid()?
-- Aturan: penulis selalu bisa; post published di luar komunitas atau di
-- komunitas publik bisa semua; post komunitas privat hanya anggota approved.
create or replace function public.can_read_post(
  p_post_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and (
        p.author_id = p_user_id
        or (
          p.status = 'published'
          and (
            p.community_id is null
            or exists (
              select 1 from public.communities c
              where c.id = p.community_id and c.visibility = 'public'
            )
            or exists (
              select 1 from public.community_members m
              where m.community_id = p.community_id
                and m.user_id = p_user_id
                and m.status = 'approved'
            )
          )
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 1a. communities_select — anggota pending/approved boleh melihat komunitasnya
-- ---------------------------------------------------------------------------
drop policy if exists "communities_select" on public.communities;
create policy "communities_select" on public.communities
  for select using (
    (visibility = 'public' and status = 'active')
    or owner_id = auth.uid()
    or public.is_moderator()
    or public.is_community_member(id, array['pending', 'approved'])
  );

-- ---------------------------------------------------------------------------
-- 1b. community_members_insert_self — izinkan 'pending' untuk komunitas privat
-- ---------------------------------------------------------------------------
drop policy if exists "community_members_insert_self" on public.community_members;
create policy "community_members_insert_self" on public.community_members
  for insert to authenticated with check (
    user_id = auth.uid()
    and (
      exists (
        select 1 from public.communities c
        where c.id = community_members.community_id
          and c.status = 'active'
          and (
            -- komunitas publik aktif: gabung langsung (approved)
            (c.visibility = 'public' and community_members.status = 'approved')
            -- komunitas privat aktif: hanya permintaan (pending, role member)
            or (c.visibility = 'private' and community_members.status = 'pending' and community_members.role = 'member')
          )
      )
      or public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- 1c. posts_select — konten komunitas privat hanya untuk anggota approved
-- ---------------------------------------------------------------------------
drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts
  for select using (
    public.is_moderator()
    or public.can_read_post(id)
  );

-- ---------------------------------------------------------------------------
-- 1d. comments_select — komentar mengikuti visibilitas post induknya
-- ---------------------------------------------------------------------------
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select using (
    public.is_moderator()
    or public.can_read_post(comments.post_id)
  );

-- ---------------------------------------------------------------------------
-- 2. register_event — registrasi atomik (anti race kuota)
-- ---------------------------------------------------------------------------
create or replace function public.register_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_event public.events%rowtype;
  v_count integer;
begin
  if v_user is null then
    return 'unauthenticated';
  end if;

  -- Kunci per-event: serialisasi cek-kuota + insert untuk event yang sama.
  perform pg_advisory_xact_lock(
    hashtextextended('register_event:' || p_event_id::text, 0)
  );

  select * into v_event from public.events where id = p_event_id;
  if not found or v_event.status <> 'published' then
    return 'unavailable';
  end if;
  if v_event.starts_at < now() then
    return 'ended';
  end if;

  if exists (
    select 1 from public.event_registrations
    where event_id = p_event_id and user_id = v_user
  ) then
    return 'already';
  end if;

  if v_event.max_participants is not null then
    select count(*) into v_count
    from public.event_registrations
    where event_id = p_event_id;
    if v_count >= v_event.max_participants then
      return 'full';
    end if;
  end if;

  insert into public.event_registrations (event_id, user_id)
  values (p_event_id, v_user);

  return 'ok';
end;
$$;

revoke all on function public.register_event(uuid) from public, anon;
grant execute on function public.register_event(uuid) to authenticated;
