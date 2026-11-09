-- ============================================================================
-- RuangKumpul — Migration 0007
-- Perbaikan keamanan & bug hasil audit:
--
--   1. community_members_select / _update / _delete memakai subquery langsung
--      ke community_members sehingga memicu
--      "infinite recursion detected in policy for relation community_members".
--      Akibatnya SEMUA query ke community_members gagal: gabung komunitas,
--      daftar anggota, cek keanggotaan, dan buat diskusi.
--      → diganti helper SECURITY DEFINER is_community_staff().
--
--   2. can_join_community() tidak memvalidasi role untuk komunitas publik,
--      sehingga pengguna bisa insert dirinya sebagai 'owner' lalu menjadi
--      staff (privilege escalation). Role kini wajib 'member'.
--
--   3. community_members_update tidak punya WITH CHECK yang membatasi nilai
--      baru, sehingga moderator bisa menaikkan dirinya menjadi 'owner'.
--      → WITH CHECK melarang role 'owner' (except admin).
--
--   4. event_registrations_insert_own hanya mengecek user_id, sehingga kuota
--      dan status event bisa dilewati dengan insert langsung (bypass RPC).
--      → WITH CHECK memakai can_register_event().
--
--   5. comments_insert_author tidak mengecek visibilitas post, sehingga
--      pengguna yang tahu UUID post komunitas privat bisa berkomentar.
--      → WITH CHECK memakai can_read_post().
--
--   6. handle_new_user menghasilkan username dari local-part email apa adanya,
--      sehingga email plus-addressed (user+tag@…) gagal CHECK username dan
--      seluruh signup dibatalkan ("Database error saving new user").
--      → local-part disanitasi ke [a-z0-9_.-] lebih dulu.
--
--   7. Form newsletter tidak bisa membaca baris lama (SELECT hanya untuk admin)
--      sehingga pelanggan yang sudah ada selalu mendapat error 23505.
--      → RPC subscribe_newsletter() SECURITY DEFINER (insert/upsert aman).
--
--   8. user_roles: admin biasa bisa memberi/mencabut role admin lewat PostgREST
--      (aturan hanya ada di server action) → policy memisahkan super_admin.
--   9. create_notification SECURITY DEFINER terbuka untuk PUBLIC → revoke.
--  10. profiles.is_verified bisa dicentang sendiri → trigger penjaga.
--  11. Moderator bisa mengubah/mengeluarkan baris owner → trigger penjaga.
--  12. check_rate_limit menerima bucket sembarang → bucket UUID hanya untuk
--      pemiliknya, parameter dibatasi, dan hit lama dibersihkan berkala.
--
-- Aman dijalankan berulang (idempotent) dan kompatibel dengan data lama.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: apakah auth.uid() adalah owner/moderator approved di komunitas?
-- SECURITY DEFINER agar tidak memicu rekursi RLS pada community_members.
-- ---------------------------------------------------------------------------
create or replace function public.is_community_staff(
  p_community_id uuid,
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
        and m.status = 'approved'
        and m.role in ('owner', 'moderator')
    );
$$;

-- ---------------------------------------------------------------------------
-- 1. community_members_select — hilangkan subquery rekursif
-- ---------------------------------------------------------------------------
drop policy if exists "community_members_select" on public.community_members;
create policy "community_members_select" on public.community_members
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_moderator()
    or public.is_community_member(community_id, array['pending', 'approved'])
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.visibility = 'public'
        and c.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. can_join_community — role wajib 'member' (cegah self-promote ke owner)
-- ---------------------------------------------------------------------------
create or replace function public.can_join_community(
  p_community_id uuid,
  p_member_status text,
  p_member_role text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community_id
      and c.status = 'active'
      and p_member_role = 'member'
      and (
        -- komunitas publik aktif: gabung langsung (approved)
        (c.visibility = 'public' and p_member_status = 'approved')
        -- komunitas privat aktif: hanya permintaan (pending)
        or (c.visibility = 'private' and p_member_status = 'pending')
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. community_members_update — tidak ada subquery rekursif + batasi role baru
-- ---------------------------------------------------------------------------
drop policy if exists "community_members_update" on public.community_members;
create policy "community_members_update" on public.community_members
  for update to authenticated
  using (public.is_admin() or public.is_community_staff(community_id))
  with check (
    public.is_admin()
    or (public.is_community_staff(community_id) and role <> 'owner')
  );

-- ---------------------------------------------------------------------------
-- 4. community_members_delete — tidak ada subquery rekursif
-- ---------------------------------------------------------------------------
drop policy if exists "community_members_delete_self_or_staff" on public.community_members;
create policy "community_members_delete_self_or_staff" on public.community_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_community_staff(community_id)
  );

-- ---------------------------------------------------------------------------
-- 5. event_registrations_insert_own — hormati status, jadwal, dan kuota event
-- ---------------------------------------------------------------------------
create or replace function public.can_register_event(
  p_event_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null
    and exists (
      select 1 from public.events e
      where e.id = p_event_id
        and e.status = 'published'
        and e.starts_at >= now()
        and (
          e.max_participants is null
          or (
            select count(*) from public.event_registrations r
            where r.event_id = e.id
          ) < e.max_participants
        )
        and not exists (
          select 1 from public.event_registrations r2
          where r2.event_id = e.id and r2.user_id = p_user_id
        )
    );
$$;

drop policy if exists "event_registrations_insert_own" on public.event_registrations;
create policy "event_registrations_insert_own" on public.event_registrations
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_register_event(event_id)
  );

-- ---------------------------------------------------------------------------
-- 6. comments_insert_author — komentar hanya pada post yang boleh dibaca
-- ---------------------------------------------------------------------------
drop policy if exists "comments_insert_author" on public.comments;
create policy "comments_insert_author" on public.comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_read_post(post_id)
  );

-- ---------------------------------------------------------------------------
-- 7. handle_new_user — sanitasi username agar signup tidak pernah gagal CHECK
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
begin
  v_base := left(
    regexp_replace(
      lower(split_part(coalesce(new.email, 'user'), '@', 1)),
      '[^a-z0-9_.-]',
      '',
      'g'
    ),
    20
  );
  if char_length(v_base) < 3 then
    v_base := 'user';
  end if;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    v_base || '_' || substr(md5(random()::text), 1, 6),
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
-- 8. subscribe_newsletter — insert/re-activate tanpa membuka SELECT tabel
-- ---------------------------------------------------------------------------
drop policy if exists "newsletter_subscribers_insert" on public.newsletter_subscribers;

create or replace function public.subscribe_newsletter(
  p_email text,
  p_source text default 'footer'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_source text := coalesce(nullif(trim(coalesce(p_source, '')), ''), 'footer');
begin
  -- Validasi ringan di database; validasi lengkap tetap di server action.
  if v_email = '' or position('@' in v_email) = 0 or char_length(v_email) > 255 then
    return 'invalid';
  end if;

  insert into public.newsletter_subscribers (email, source, is_active)
  values (v_email, v_source, true)
  on conflict (lower(email)) do update
    set is_active = true,
        unsubscribed_at = null,
        source = excluded.source;

  return 'ok';
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. user_roles — admin biasa tidak boleh memberi/mencabut role admin
--    (sebelumnya hanya dijaga di server action; PostgREST bisa melewatinya)
-- ---------------------------------------------------------------------------
drop policy if exists "user_roles_admin_write" on public.user_roles;
create policy "user_roles_admin_write" on public.user_roles
  for all to authenticated
  using (public.is_admin() and role not in ('admin', 'super_admin'))
  with check (public.is_admin() and role not in ('admin', 'super_admin'));

drop policy if exists "user_roles_super_admin_write" on public.user_roles;
drop policy if exists "user_roles_super_admin_write" on public.user_roles;
create policy "user_roles_super_admin_write" on public.user_roles
  for all to authenticated
  using (public.has_any_role(array['super_admin']::public.user_role[]))
  with check (public.has_any_role(array['super_admin']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- 10. create_notification — SECURITY DEFINER, jangan bisa dipanggil client
--     (dipakai trigger; trigger berjalan sebagai owner)
-- ---------------------------------------------------------------------------
revoke all on function public.create_notification(uuid, uuid, varchar, varchar, text, varchar, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11. profiles.is_verified — user tidak boleh memberi centang sendiri
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_verified is distinct from old.is_verified and not public.is_admin() then
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_verified on public.profiles;
create trigger trg_protect_profile_verified
  before update on public.profiles
  for each row execute function public.protect_profile_verified();

-- ---------------------------------------------------------------------------
-- 12. community_members — lindungi baris owner dari moderator
--     (RLS tidak bisa melihat OLD, jadi aturan ini ditegakkan trigger)
-- ---------------------------------------------------------------------------
create or replace function public.is_community_owner(
  p_community_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null
    and (
      exists (
        select 1 from public.communities c
        where c.id = p_community_id and c.owner_id = p_user_id
      )
      or exists (
        select 1 from public.community_members m
        where m.community_id = p_community_id
          and m.user_id = p_user_id
          and m.role = 'owner'
          and m.status = 'approved'
      )
    );
$$;

create or replace function public.guard_community_member_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin platform boleh melakukan apa pun (termasuk memperbaiki data).
  if public.is_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.role = 'owner' then
      raise exception 'Owner komunitas tidak dapat dikeluarkan' using errcode = '42501';
    end if;
    return old;
  end if;

  -- Baris owner tidak boleh diubah (role/status/identitas) oleh non-admin.
  if old.role = 'owner' then
    if new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.user_id is distinct from old.user_id
      or new.community_id is distinct from old.community_id then
      raise exception 'Baris owner komunitas tidak dapat diubah' using errcode = '42501';
    end if;
    return new;
  end if;

  -- Hanya owner komunitas yang boleh mengubah role anggota.
  if new.role is distinct from old.role
    and not public.is_community_owner(new.community_id) then
    raise exception 'Hanya owner komunitas yang dapat mengubah role anggota' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_community_member_update on public.community_members;
create trigger trg_guard_community_member_update
  before update on public.community_members
  for each row execute function public.guard_community_member_write();

drop trigger if exists trg_guard_community_member_delete on public.community_members;
create trigger trg_guard_community_member_delete
  before delete on public.community_members
  for each row execute function public.guard_community_member_write();

-- ---------------------------------------------------------------------------
-- 13. check_rate_limit — cegah lockout korban lewat bucket berisi UUID orang lain
--     dan batasi parameter agar tidak bisa dipakai untuk spam tabel.
--     Bucket user-scoped yang dipakai aplikasi selalu berakhiran UUID user:
--     comment:<uid>, post-create:<uid>, like:<uid>, dst.
-- ---------------------------------------------------------------------------
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
  v_uid uuid := auth.uid();
  v_suffix text;
begin
  if p_bucket is null or p_max_hits is null or p_window_seconds is null then
    return true;
  end if;

  -- Batas wajar; nilai aneh dari pemanggil langsung dianggap lolos.
  if p_max_hits < 1 or p_max_hits > 10000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    return true;
  end if;

  -- Bucket yang berakhiran UUID hanya boleh disentuh pemilik UUID tersebut.
  -- Tanpa ini, siapa pun bisa menghabiskan kuota komentar pengguna lain.
  if p_bucket ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_suffix := right(p_bucket, 36);
    if v_uid is null or v_suffix <> v_uid::text then
      return true;
    end if;
  end if;

  -- Pembersihan oportunistik hit lama (mencegah tabel tumbuh tanpa batas).
  if random() < 0.02 then
    delete from public.rate_limit_hits where hit_at < now() - interval '1 day';
  end if;

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
-- Grants (fungsi baru dapat dipanggil dari client dengan anon key)
-- ---------------------------------------------------------------------------
grant execute on function public.is_community_staff(uuid, uuid) to authenticated;
grant execute on function public.can_register_event(uuid, uuid) to authenticated;
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;
grant execute on function public.is_community_owner(uuid, uuid) to authenticated;
