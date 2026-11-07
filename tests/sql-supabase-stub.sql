-- Stub skema Supabase (auth + storage + roles) untuk verifikasi migration lokal.
-- Meniru perilaku Supabase secukupnya utk menjalankan migration 0001-0006.

create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- auth.uid(): baca dari GUC request.jwt.claim.sub (cara simulasi user di test)
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create schema storage;
create table storage.buckets (
  id text primary key,
  name text,
  public boolean default false
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid default auth.uid(),
  created_at timestamptz default now()
);
create function storage.foldername(p_name text) returns text[]
language sql immutable
as $$ select string_to_array(p_name, '/') $$;

-- Grants ala bootstrap Supabase
grant usage on schema public, auth, storage to anon, authenticated;
grant all on all tables in schema auth to anon, authenticated;
grant all on all sequences in schema auth to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;
grant execute on all functions in schema auth, storage to anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated;
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated;
