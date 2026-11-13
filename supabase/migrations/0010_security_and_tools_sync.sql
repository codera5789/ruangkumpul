-- ============================================================================
-- RuangKumpul — Migration 0010 (Security Hardening & Sinkronisasi Tools)
-- Memperbaiki celah RLS & integritas kolom turunan hasil audit codebase:
--   1. product_inquiries_insert: perbaiki bug self-shadowing `p.seller_id = seller_id`
--   2. Kunci kolom counter/solusi turunan (posts, articles, events, marketplace_products)
--      dan kolom imutabel product_inquiries lewat GUC internal + trigger BEFORE UPDATE
--   3. Cegah anggota komunitas berstatus 'banned' menghapus barisnya sendiri
--   4. can_read_post: wajibkan komunitas berstatus 'active'; comments_insert_author:
--      wajibkan status post 'published'; reactions_insert_own: validasi akses target
--   5. check_rate_limit: dukung bucket dengan UUID di mana pun (mis. tool-usage:<uid>:<slug>)
--      dan perbandingan case-insensitive
--   6. set_updated_at search_path, hapus fungsi yatim notify_on_comment(), unique index posts.slug
--   7. Sinkronkan 3 tool baru ke tabel public.tools (total 24 tools) + pesan welcome
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. product_inquiries_insert — perbaiki shadowing `p.seller_id = seller_id`
-- ---------------------------------------------------------------------------
drop policy if exists "product_inquiries_insert" on public.product_inquiries;
create policy "product_inquiries_insert" on public.product_inquiries
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'new'
    and exists (
      select 1
      from public.marketplace_products p
      where p.id = product_inquiries.product_id
        and p.status = 'published'
        and p.seller_id = product_inquiries.seller_id
        and p.seller_id <> auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Perlindungan kolom turunan & imutabel lewat transaction-local GUC
-- ---------------------------------------------------------------------------
create or replace function public.increment_article_view(article uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.internal_counter_update', '1', true);
  update public.articles
  set view_count = view_count + 1
  where id = article and status = 'published';
end;
$$;

grant execute on function public.increment_article_view(uuid) to anon, authenticated;

create or replace function public.increment_post_view(p_post uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.internal_counter_update', '1', true);
  update public.posts
  set view_count = view_count + 1
  where id = p_post and status = 'published';
end;
$$;

grant execute on function public.increment_post_view(uuid) to anon, authenticated;

create or replace function public.sync_event_participant_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.internal_counter_update', '1', true);
  update public.events
  set participant_count = (
    select count(*) from public.event_registrations
    where event_id = coalesce(new.event_id, old.event_id)
  )
  where id = coalesce(new.event_id, old.event_id);
  return null;
end;
$$;

create or replace function public.sync_marketplace_inquiry_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.internal_counter_update', '1', true);
  update public.marketplace_products
  set inquiry_count = (
    select count(*)
    from public.product_inquiries
    where product_id = coalesce(new.product_id, old.product_id)
  )
  where id = coalesce(new.product_id, old.product_id);
  return null;
end;
$$;

create or replace function public.set_accepted_answer(
  p_post_id uuid,
  p_comment_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_author_id uuid;
  v_community_id uuid;
  v_post_type public.post_type;
  v_current_accepted uuid;
  v_comment_post_id uuid;
  v_comment_status varchar(20);
  v_is_staff boolean := false;
begin
  if v_caller_id is null then
    raise exception 'Wajib login untuk menentukan solusi.';
  end if;

  select author_id, community_id, post_type, accepted_comment_id
  into v_author_id, v_community_id, v_post_type, v_current_accepted
  from public.posts
  where id = p_post_id and status = 'published';

  if v_author_id is null then
    raise exception 'Postingan tidak ditemukan atau tidak aktif.';
  end if;

  if v_post_type <> 'question' then
    raise exception 'Hanya postingan bertipe pertanyaan yang dapat memiliki solusi.';
  end if;

  if v_caller_id <> v_author_id then
    if v_community_id is not null then
      v_is_staff := public.is_community_staff(v_community_id);
    end if;
    if not v_is_staff and not public.is_moderator() and not public.is_admin() then
      raise exception 'Hanya pembuat pertanyaan atau moderator yang dapat menentukan solusi.';
    end if;
  end if;

  perform set_config('app.internal_counter_update', '1', true);

  if p_comment_id is null or v_current_accepted = p_comment_id then
    update public.posts
    set accepted_comment_id = null,
        updated_at = now()
    where id = p_post_id;
    return false;
  end if;

  select post_id, status
  into v_comment_post_id, v_comment_status
  from public.comments
  where id = p_comment_id;

  if v_comment_post_id is null or v_comment_post_id <> p_post_id or v_comment_status <> 'published' then
    raise exception 'Komentar tidak valid untuk postingan ini.';
  end if;

  update public.posts
  set accepted_comment_id = p_comment_id,
      updated_at = now()
  where id = p_post_id;

  return true;
end;
$$;

revoke all on function public.set_accepted_answer(uuid, uuid) from public, anon;
grant execute on function public.set_accepted_answer(uuid, uuid) to authenticated;

create or replace function public.guard_derived_fields_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_internal boolean := current_setting('app.internal_counter_update', true) = '1';
  v_privileged boolean :=
    current_user in ('postgres', 'supabase_admin', 'service_role')
    or public.is_admin();
begin
  if v_internal or v_privileged then
    return new;
  end if;

  if tg_table_name = 'posts' then
    if new.view_count is distinct from old.view_count then
      raise exception 'Kolom view_count hanya dapat diperbarui oleh sistem' using errcode = '42501';
    end if;
    -- Izinkan FK ON DELETE SET NULL saat komentar terpilih dihapus (pg_trigger_depth() > 0).
    if new.accepted_comment_id is distinct from old.accepted_comment_id
      and not (new.accepted_comment_id is null and pg_trigger_depth() > 0) then
      raise exception 'Gunakan RPC set_accepted_answer untuk mengubah solusi terpilih' using errcode = '42501';
    end if;
    if (new.author_id is distinct from old.author_id or new.community_id is distinct from old.community_id)
      and not public.is_moderator() then
      raise exception 'Kolom kepemilikan atau komunitas post tidak dapat dipindahkan' using errcode = '42501';
    end if;
  elsif tg_table_name = 'articles' then
    if new.view_count is distinct from old.view_count then
      raise exception 'Kolom view_count artikel hanya dapat diperbarui oleh sistem' using errcode = '42501';
    end if;
  elsif tg_table_name = 'events' then
    if new.participant_count is distinct from old.participant_count then
      raise exception 'Kolom participant_count hanya dapat diperbarui oleh sistem' using errcode = '42501';
    end if;
  elsif tg_table_name = 'marketplace_products' then
    if new.inquiry_count is distinct from old.inquiry_count then
      raise exception 'Kolom inquiry_count hanya dapat diperbarui oleh sistem' using errcode = '42501';
    end if;
  elsif tg_table_name = 'product_inquiries' then
    if new.product_id is distinct from old.product_id
      or new.buyer_id is distinct from old.buyer_id
      or new.seller_id is distinct from old.seller_id
      or new.buyer_name is distinct from old.buyer_name
      or new.buyer_contact is distinct from old.buyer_contact
      or new.message is distinct from old.message then
      raise exception 'Detail pengirim inquiry tidak dapat diubah' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_posts_derived_fields on public.posts;
create trigger trg_guard_posts_derived_fields
  before update on public.posts
  for each row execute function public.guard_derived_fields_update();

drop trigger if exists trg_guard_articles_derived_fields on public.articles;
create trigger trg_guard_articles_derived_fields
  before update on public.articles
  for each row execute function public.guard_derived_fields_update();

drop trigger if exists trg_guard_events_derived_fields on public.events;
create trigger trg_guard_events_derived_fields
  before update on public.events
  for each row execute function public.guard_derived_fields_update();

drop trigger if exists trg_guard_marketplace_products_derived_fields on public.marketplace_products;
create trigger trg_guard_marketplace_products_derived_fields
  before update on public.marketplace_products
  for each row execute function public.guard_derived_fields_update();

drop trigger if exists trg_guard_product_inquiries_immutable on public.product_inquiries;
create trigger trg_guard_product_inquiries_immutable
  before update on public.product_inquiries
  for each row execute function public.guard_derived_fields_update();

-- ---------------------------------------------------------------------------
-- 3. Cegah anggota komunitas yang diblokir ('banned') menghapus barisnya
-- ---------------------------------------------------------------------------
drop policy if exists "community_members_delete_self_or_staff" on public.community_members;
create policy "community_members_delete_self_or_staff" on public.community_members
  for delete to authenticated
  using (
    (user_id = auth.uid() and status <> 'banned')
    or public.is_admin()
    or public.is_community_staff(community_id)
  );

create or replace function public.guard_community_member_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
    if old.status = 'banned' and not public.is_community_staff(old.community_id) then
      raise exception 'Anggota yang diblokir tidak dapat menghapus status blokirnya' using errcode = '42501';
    end if;
    return old;
  end if;

  if old.role = 'owner' then
    if new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.user_id is distinct from old.user_id
      or new.community_id is distinct from old.community_id then
      raise exception 'Baris owner komunitas tidak dapat diubah' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
    and not public.is_community_owner(new.community_id) then
    raise exception 'Hanya owner komunitas yang dapat mengubah role anggota' using errcode = '42501';
  end if;

  if old.status = 'banned'
    and new.status is distinct from old.status
    and not public.is_community_staff(old.community_id) then
    raise exception 'Hanya staff komunitas yang dapat mencabut status blokir' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. can_read_post, comments_insert_author, reactions_insert_own
-- ---------------------------------------------------------------------------
create or replace function public.can_read_post(
  p_post_id uuid,
  p_user_id uuid default null  -- diabaikan: identitas selalu auth.uid()
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
        p.author_id = auth.uid()
        or (
          p.status = 'published'
          and (
            p.community_id is null
            or exists (
              select 1 from public.communities c
              where c.id = p.community_id
                and c.status = 'active'
                and (
                  c.visibility = 'public'
                  or exists (
                    select 1 from public.community_members m
                    where m.community_id = p.community_id
                      and m.user_id = auth.uid()
                      and m.status = 'approved'
                  )
                )
            )
          )
        )
      )
  );
$$;

drop policy if exists "comments_insert_author" on public.comments;
create policy "comments_insert_author" on public.comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_read_post(post_id)
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists "reactions_insert_own" on public.reactions;
create policy "reactions_insert_own" on public.reactions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      (target_type = 'post' and public.can_read_post(target_id))
      or (target_type = 'comment' and exists (
        select 1 from public.comments c
        where c.id = target_id and public.can_read_post(c.post_id)
      ))
      or (target_type = 'article' and exists (
        select 1 from public.articles a
        where a.id = target_id
          and (a.status = 'published' or a.author_id = auth.uid() or public.is_moderator())
      ))
    )
  );

-- ---------------------------------------------------------------------------
-- 5. check_rate_limit — deteksi UUID di posisi mana pun (case-insensitive)
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
  v_bucket_uuid text;
begin
  if p_bucket is null or p_max_hits is null or p_window_seconds is null then
    return true;
  end if;

  if p_max_hits < 1 or p_max_hits > 10000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    return true;
  end if;

  -- Bucket yang memuat UUID (mis. comment:<uid> atau tool-usage:<uid>:<slug>)
  -- hanya boleh memotong kuota milik pemilik UUID tersebut.
  v_bucket_uuid := substring(
    lower(p_bucket) from '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  );
  if v_bucket_uuid is not null then
    if v_uid is null or v_bucket_uuid <> lower(v_uid::text) then
      return true;
    end if;
  end if;

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
-- 6. Hygiene fungsi & indeks: search_path set_updated_at, fungsi yatim, unique slug
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop function if exists public.notify_on_comment();

create unique index if not exists posts_slug_idx on public.posts (slug);

-- ---------------------------------------------------------------------------
-- 7. Sinkronisasi 3 web tools baru ke tabel public.tools + handle_new_user()
-- ---------------------------------------------------------------------------
insert into public.tools (name, slug, description, category_id, icon, route, seo_title, seo_description)
select v.name, v.slug, v.description, c.id, v.icon, v.route, v.seo_title, v.seo_description
from (values
  (
    'Konverter Markdown ke HTML',
    'markdown-converter',
    'Ubah teks Markdown menjadi kode HTML siap pakai dan pratinjau tampilan secara langsung. 100% diproses di browser.',
    'developer',
    'FileCode',
    '/tools/markdown-converter',
    'Konverter Markdown ke HTML Online — Live Preview Gratis',
    'Konversi Markdown ke format HTML secara online dan instan. Dilengkapi pratinjau langsung dua kolom, aman tanpa kirim data ke server.'
  ),
  (
    'Generator Favicon & Ikon Web',
    'favicon-generator',
    'Buat paket ukuran favicon lengkap (16x16, 32x32, 180x180, 192x192, 512x512) dari satu file logo gambar secara instan.',
    'desain',
    'AppWindow',
    '/tools/favicon-generator',
    'Generator Favicon Online Gratis — Buat Paket Ikon Web & PWA',
    'Generate paket favicon lengkap untuk website, Apple Touch Icon, dan Android Chrome PWA dari gambar PNG/JPG/SVG langsung di peramban.'
  ),
  (
    'Pembanding Teks (Diff Checker)',
    'diff-checker',
    'Bandingkan dua teks atau kode secara berdampingan. Temukan penambahan, penghapusan, dan perbedaan baris secara instan.',
    'developer',
    'Columns2',
    '/tools/diff-checker',
    'Pembanding Teks Online (Diff Checker) — Cek Perbedaan Baris',
    'Bandingkan dua versi teks atau kode program secara instan di browser. Sorotan perbedaan baris warna hijau dan merah, aman dan gratis.'
  )
) as v(name, slug, description, cat_slug, icon, route, seo_title, seo_description)
left join public.tool_categories c on c.slug = v.cat_slug
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  icon = excluded.icon,
  route = excluded.route,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;

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
    'Lengkapi profilmu, jelajahi 24 tools gratis, dan temukan komunitas yang cocok untukmu.'
  );

  return new;
end;
$$;
