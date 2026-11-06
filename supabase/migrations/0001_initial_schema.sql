-- ============================================================================
-- RuangKumpul — Initial Schema (Migration 0001)
-- All-in-One Digital Super App (tools, knowledge, community)
-- Target: Supabase / PostgreSQL 15+
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'contributor', 'moderator', 'admin', 'super_admin');
create type public.community_visibility as enum ('public', 'private');
create type public.community_status as enum ('active', 'suspended', 'archived');
create type public.community_member_role as enum ('owner', 'moderator', 'member');
create type public.community_member_status as enum ('pending', 'approved', 'banned');
create type public.post_type as enum ('discussion', 'question', 'announcement');
create type public.post_status as enum ('draft', 'published', 'hidden', 'deleted');
create type public.article_status as enum ('draft', 'review', 'published', 'archived');
create type public.tool_status as enum ('active', 'inactive');
create type public.report_status as enum ('pending', 'reviewing', 'resolved', 'rejected');

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Role checks (SECURITY DEFINER to avoid recursive RLS on user_roles)
create or replace function public.has_any_role(roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(roles)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['admin', 'super_admin']::public.user_role[]);
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['moderator', 'admin', 'super_admin']::public.user_role[]);
$$;

grant execute on function public.has_any_role(public.user_role[]) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_moderator() to anon, authenticated;

-- Auto-create profile on signup
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Identity domain
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(32) not null unique,
  full_name varchar(120),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  website_url text,
  location varchar(120),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_.-]{3,32}$')
);

create index profiles_username_trgm_idx on public.profiles using gin (username gin_trgm_ops);
create index profiles_full_name_trgm_idx on public.profiles using gin (full_name gin_trgm_ops);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles (user_id);

-- ---------------------------------------------------------------------------
-- Community domain
-- ---------------------------------------------------------------------------

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name varchar(100) not null,
  slug varchar(100) not null unique,
  description text check (char_length(description) <= 2000),
  icon_url text,
  cover_url text,
  visibility public.community_visibility not null default 'public',
  status public.community_status not null default 'active',
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index communities_status_visibility_idx on public.communities (status, visibility);
create index communities_owner_idx on public.communities (owner_id);
create index communities_name_trgm_idx on public.communities using gin (name gin_trgm_ops);

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.community_member_role not null default 'member',
  status public.community_member_status not null default 'approved',
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create index community_members_user_idx on public.community_members (user_id);
create index community_members_community_idx on public.community_members (community_id);

-- keep member_count in sync
create or replace function public.sync_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.communities
  set member_count = (
    select count(*) from public.community_members
    where community_id = coalesce(new.community_id, old.community_id)
      and status = 'approved'
  )
  where id = coalesce(new.community_id, old.community_id);
  return null;
end;
$$;

create constraint trigger trg_member_count_insert
  after insert on public.community_members
  deferrable initially deferred
  for each row execute function public.sync_member_count();

create constraint trigger trg_member_count_update
  after update of status on public.community_members
  deferrable initially deferred
  for each row execute function public.sync_member_count();

create constraint trigger trg_member_count_delete
  after delete on public.community_members
  deferrable initially deferred
  for each row execute function public.sync_member_count();

-- first member of a new community becomes owner
create or replace function public.grant_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_members (community_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'approved')
  on conflict (community_id, user_id) do nothing;
  return new;
end;
$$;

create trigger trg_grant_owner_membership
  after insert on public.communities
  for each row execute function public.grant_owner_membership();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null,
  slug varchar(220) not null,
  content text not null check (char_length(content) <= 20000),
  post_type public.post_type not null default 'discussion',
  status public.post_status not null default 'published',
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_community_idx on public.posts (community_id, created_at desc);
create index posts_author_idx on public.posts (author_id);
create index posts_status_idx on public.posts (status, created_at desc);
create index posts_title_trgm_idx on public.posts using gin (title gin_trgm_ops);
create index posts_content_trgm_idx on public.posts using gin (content gin_trgm_ops);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) <= 5000),
  status varchar(20) not null default 'published',
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type varchar(20) not null,
  target_id uuid not null,
  reaction_type varchar(20) not null default 'like',
  created_at timestamptz not null default now(),
  constraint reactions_target_type_check check (target_type in ('post', 'comment', 'article')),
  unique (user_id, target_type, target_id, reaction_type)
);

create index reactions_target_idx on public.reactions (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Knowledge domain
-- ---------------------------------------------------------------------------

create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  slug varchar(80) not null unique,
  description text
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null unique,
  slug varchar(50) not null unique
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.article_categories(id) on delete set null,
  title varchar(200) not null,
  slug varchar(220) not null unique,
  excerpt text check (char_length(excerpt) <= 500),
  content jsonb not null default '[]'::jsonb,
  featured_image text,
  status public.article_status not null default 'draft',
  published_at timestamptz,
  seo_title varchar(200),
  seo_description text,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_status_published_idx on public.articles (status, published_at desc);
create index articles_author_idx on public.articles (author_id);
create index articles_category_idx on public.articles (category_id);
create index articles_title_trgm_idx on public.articles using gin (title gin_trgm_ops);
create index articles_excerpt_trgm_idx on public.articles using gin (excerpt gin_trgm_ops);

create table public.article_tag_relations (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create index article_tag_relations_tag_idx on public.article_tag_relations (tag_id);

-- ---------------------------------------------------------------------------
-- Tools domain
-- ---------------------------------------------------------------------------

create table public.tool_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  slug varchar(80) not null unique,
  description text
);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.tool_categories(id) on delete set null,
  name varchar(100) not null,
  slug varchar(100) not null unique,
  description text not null,
  icon varchar(50),
  route varchar(200) not null,
  is_free boolean not null default true,
  status public.tool_status not null default 'active',
  seo_title varchar(200),
  seo_description text,
  usage_count bigint not null default 0,
  created_at timestamptz not null default now()
);

create index tools_status_idx on public.tools (status);
create index tools_category_idx on public.tools (category_id);
create index tools_name_trgm_idx on public.tools using gin (name gin_trgm_ops);

create table public.tool_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, tool_id)
);

create table public.tool_usage_logs (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  session_hash varchar(64),
  used_at timestamptz not null default now()
);

create index tool_usage_logs_tool_idx on public.tool_usage_logs (tool_id, used_at desc);

-- ---------------------------------------------------------------------------
-- Platform domain
-- ---------------------------------------------------------------------------

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_type varchar(20) not null,
  resource_id uuid not null,
  created_at timestamptz not null default now(),
  constraint bookmarks_resource_type_check check (resource_type in ('tool', 'article', 'post')),
  unique (user_id, resource_type, resource_id)
);

create index bookmarks_user_idx on public.bookmarks (user_id, resource_type, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type varchar(30) not null,
  title varchar(200) not null,
  message text,
  resource_type varchar(20),
  resource_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type varchar(20) not null,
  target_id uuid not null,
  reason varchar(50) not null,
  description text,
  status public.report_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint reports_target_type_check check (target_type in ('post', 'comment', 'article', 'community', 'user'))
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_reporter_idx on public.reports (reporter_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action varchar(60) not null,
  resource_type varchar(30) not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key varchar(80) not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger trg_articles_updated_at before update on public.articles
  for each row execute function public.set_updated_at();
create trigger trg_site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.article_categories enable row level security;
alter table public.tags enable row level security;
alter table public.articles enable row level security;
alter table public.article_tag_relations enable row level security;
alter table public.tool_categories enable row level security;
alter table public.tools enable row level security;
alter table public.tool_favorites enable row level security;
alter table public.tool_usage_logs enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;

-- profiles: public read, self update
create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- user_roles: read own or admin; write admin only
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());
create policy "user_roles_admin_write" on public.user_roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- communities: public read of active/public; users create own; owner edits
create policy "communities_select" on public.communities
  for select using (
    (visibility = 'public' and status = 'active')
    or owner_id = auth.uid()
    or public.is_moderator()
  );
create policy "communities_insert_own" on public.communities
  for insert to authenticated with check (owner_id = auth.uid());
create policy "communities_update_owner" on public.communities
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy "communities_delete_owner" on public.communities
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

-- community_members: read membership of visible communities; join own;
create policy "community_members_select" on public.community_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.visibility = 'public'
    )
    or exists (
      select 1 from public.community_members m
      where m.community_id = community_id and m.user_id = auth.uid()
    )
  );
create policy "community_members_insert_self" on public.community_members
  for insert to authenticated with check (
    user_id = auth.uid()
    and (
      -- joining a public community as member...
      exists (
        select 1 from public.communities c
        where c.id = community_id and c.visibility = 'public' and c.status = 'active'
      )
      -- ...or admin anywhere
      or public.is_admin()
    )
  );
create policy "community_members_update" on public.community_members
  for update to authenticated
  using (
    exists (
      select 1 from public.community_members m
      where m.community_id = community_members.community_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'moderator')
        and m.status = 'approved'
    )
    or public.is_admin()
  );
create policy "community_members_delete_self_or_staff" on public.community_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.community_members m
      where m.community_id = community_members.community_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'moderator')
        and m.status = 'approved'
    )
    or public.is_admin()
  );

-- posts: published visible to all; author manages own; must be approved member to post in community
create policy "posts_select" on public.posts
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_moderator()
  );
create policy "posts_insert_author" on public.posts
  for insert to authenticated with check (
    author_id = auth.uid()
    and (
      community_id is null
      or exists (
        select 1 from public.community_members m
        where m.community_id = posts.community_id
          and m.user_id = auth.uid()
          and m.status = 'approved'
          and m.role in ('owner', 'moderator', 'member')
      )
    )
  );
create policy "posts_update_author" on public.posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_moderator())
  with check (author_id = auth.uid() or public.is_moderator());
create policy "posts_delete_author" on public.posts
  for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator());

-- comments: visible on visible posts; author manages own
create policy "comments_select" on public.comments
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and (
        p.status = 'published'
        or p.author_id = auth.uid()
      )
    )
  );
create policy "comments_insert_author" on public.comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'published'
    )
  );
create policy "comments_update_author" on public.comments
  for update to authenticated
  using (author_id = auth.uid() or public.is_moderator())
  with check (author_id = auth.uid() or public.is_moderator());
create policy "comments_delete_author" on public.comments
  for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator());

-- reactions: everyone reads; users manage own
create policy "reactions_select" on public.reactions
  for select using (true);
create policy "reactions_insert_own" on public.reactions
  for insert to authenticated with check (user_id = auth.uid());
create policy "reactions_update_own" on public.reactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reactions_delete_own" on public.reactions
  for delete to authenticated using (user_id = auth.uid());

-- taxonomy: public read, admin write
create policy "article_categories_select" on public.article_categories
  for select using (true);
create policy "article_categories_admin_write" on public.article_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tags_select" on public.tags
  for select using (true);
create policy "tags_select_insert" on public.tags
  for insert to authenticated with check (true);

-- articles: public reads published; contributors write; author manages drafts
create policy "articles_select" on public.articles
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_moderator()
  );
create policy "articles_insert_contributor" on public.articles
  for insert to authenticated with check (
    author_id = auth.uid()
    and public.has_any_role(array['contributor', 'moderator', 'admin', 'super_admin']::public.user_role[])
  );
create policy "articles_update_author" on public.articles
  for update to authenticated
  using (
    author_id = auth.uid()
    or public.has_any_role(array['moderator', 'admin', 'super_admin']::public.user_role[])
  )
  with check (
    author_id = auth.uid()
    or public.has_any_role(array['moderator', 'admin', 'super_admin']::public.user_role[])
  );
create policy "articles_delete_admin" on public.articles
  for delete to authenticated
  using (
    author_id = auth.uid()
    or public.has_any_role(array['admin', 'super_admin']::public.user_role[])
  );

-- article_tag_relations follow article write access
create policy "article_tag_relations_select" on public.article_tag_relations
  for select using (true);
create policy "article_tag_relations_write" on public.article_tag_relations
  for all to authenticated
  using (
    exists (select 1 from public.articles a where a.id = article_id and a.author_id = auth.uid())
    or public.is_moderator()
  )
  with check (
    exists (select 1 from public.articles a where a.id = article_id and a.author_id = auth.uid())
    or public.is_moderator()
  );

-- tools: public read of active; admin write
create policy "tool_categories_select" on public.tool_categories
  for select using (true);
create policy "tool_categories_admin_write" on public.tool_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tools_select" on public.tools
  for select using (status = 'active' or public.is_admin());
create policy "tools_admin_write" on public.tools
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tool_favorites_own" on public.tool_favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- usage logs: anyone can log usage; only admin reads
create policy "tool_usage_logs_insert" on public.tool_usage_logs
  for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());
create policy "tool_usage_logs_admin_read" on public.tool_usage_logs
  for select to authenticated using (public.is_admin());

-- bookmarks: strictly private
create policy "bookmarks_own" on public.bookmarks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notifications: only recipient reads/updates; writes happen via service role or triggers
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- reports: reporter sees own; moderators see all
create policy "reports_select" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_moderator());
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports_moderator_update" on public.reports
  for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- audit logs: admin read; writes via service role
create policy "audit_logs_admin_read" on public.audit_logs
  for select to authenticated using (public.is_admin());

-- site settings: public read, admin write
create policy "site_settings_select" on public.site_settings
  for select using (true);
create policy "site_settings_admin_write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets (avatars, community media, article images)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('communities', 'communities', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('articles', 'articles', true)
on conflict (id) do nothing;

-- public read of media buckets
create policy "media_public_read" on storage.objects
  for select using (bucket_id in ('avatars', 'communities', 'articles'));

-- users manage files inside their own top-level folder
create policy "media_owner_write" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('avatars', 'communities', 'articles')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars', 'communities', 'articles')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id in ('avatars', 'communities', 'articles')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Seed: tool categories (matches blueprint's 20 launch tools)
-- ---------------------------------------------------------------------------
insert into public.tool_categories (name, slug, description) values
  ('Teks', 'teks', 'Tools pengolahan teks: hitung kata, ubah format, dan lainnya'),
  ('Developer', 'developer', 'Tools untuk developer: format dan validasi JSON, generator UUID'),
  ('Encoding', 'encoding', 'Encode dan decode Base64, URL, dan format lainnya'),
  ('Generator', 'generator', 'Generator QR code, password aman, dan lainnya'),
  ('Kalkulator', 'kalkulator', 'Kalkulator persen, umur, tanggal, dan konversi satuan'),
  ('Produktivitas', 'produktivitas', 'Timer pomodoro, checklist, dan tools produktivitas'),
  ('Desain', 'desain', 'Color picker, gradient generator, dan tools desain'),
  ('File', 'file', 'Kompres gambar, merge dan split PDF')
on conflict (slug) do nothing;
