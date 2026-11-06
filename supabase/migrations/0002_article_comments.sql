-- ============================================================================
-- RuangKumpul — Migration 0002: Komentar artikel
-- Tabel komentar spesifik domain knowledge (bukan polymorphic) sesuai
-- catatan blueprint: integritas referensi lebih penting dari generalisasi.
-- ============================================================================

create table public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.article_comments(id) on delete cascade,
  content text not null check (char_length(content) <= 5000),
  status varchar(20) not null default 'published',
  created_at timestamptz not null default now()
);

create index article_comments_article_idx on public.article_comments (article_id, created_at);
create index article_comments_author_idx on public.article_comments (author_id);

alter table public.article_comments enable row level security;

-- Komentar terlihat jika artikelnya published (atau penulis artikel sendiri)
create policy "article_comments_select" on public.article_comments
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = article_id and (
        a.status = 'published' or a.author_id = auth.uid()
      )
    )
  );

-- Pengguna login berkomentar pada artikel published
create policy "article_comments_insert" on public.article_comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.articles a
      where a.id = article_id and a.status = 'published'
    )
  );

-- Penulis komentar atau moderator boleh mengubah/menghapus
create policy "article_comments_update" on public.article_comments
  for update to authenticated
  using (author_id = auth.uid() or public.is_moderator())
  with check (author_id = auth.uid() or public.is_moderator());

create policy "article_comments_delete" on public.article_comments
  for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator());

-- ---------------------------------------------------------------------------
-- View counter (atomik, dipanggil dari route handler publik)
-- ---------------------------------------------------------------------------
create or replace function public.increment_article_view(article uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles
  set view_count = view_count + 1
  where id = article and status = 'published';
$$;

grant execute on function public.increment_article_view(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Notifikasi otomatis saat komentar masuk (server-side, melewati RLS insert)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author uuid;
  target_title text;
  resource_kind text;
  resource_path text;
begin
  if new.author_id is null then
    return new;
  end if;

  if TG_TABLE_NAME = 'comments' then
    select p.author_id, p.title, p.slug into target_author, target_title, resource_path
    from public.posts p where p.id = new.post_id;
    resource_kind := 'post';
  else
    select a.author_id, a.title, a.slug into target_author, target_title, resource_path
    from public.articles a where a.id = new.article_id;
    resource_kind := 'article';
  end if;

  if target_author is null or target_author = new.author_id then
    return new; -- jangan notifikasi diri sendiri
  end if;

  insert into public.notifications (user_id, actor_id, type, title, message, resource_type, resource_id)
  values (
    target_author,
    new.author_id,
    'comment',
    'Komentar baru',
    'Ada komentar baru pada ' || resource_kind || ' "' || left(target_title, 80) || '".',
    resource_kind,
    (case when resource_kind = 'post' then new.post_id else new.article_id end)
  );

  return new;
end;
$$;

create trigger trg_notify_post_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

create trigger trg_notify_article_comment
  after insert on public.article_comments
  for each row execute function public.notify_on_comment();
