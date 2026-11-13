-- ============================================================================
-- RuangKumpul - Migration 0009 (Pilar 4: Ruang Marketplace)
-- Tabel kategori, produk digital/jasa, inquiry pemesanan, trigger sinkronisasi,
-- serta kebijakan Row Level Security (RLS).
-- ============================================================================

create type public.marketplace_product_type as enum (
  'template',
  'source_code',
  'ui_kit',
  'digital_asset',
  'freelance_service'
);

create type public.marketplace_license_type as enum (
  'free',
  'personal',
  'commercial',
  'open_source'
);

create type public.marketplace_product_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.marketplace_inquiry_status as enum (
  'new',
  'replied',
  'closed'
);

-- ---------------------------------------------------------------------------
-- 1. Kategori Marketplace
-- ---------------------------------------------------------------------------
create table public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  slug varchar(80) not null unique,
  name varchar(120) not null,
  description varchar(300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.marketplace_categories enable row level security;

create policy "marketplace_categories_select" on public.marketplace_categories
  for select using (true);
create policy "marketplace_categories_admin_insert" on public.marketplace_categories
  for insert to authenticated with check (public.is_admin());
create policy "marketplace_categories_admin_update" on public.marketplace_categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "marketplace_categories_admin_delete" on public.marketplace_categories
  for delete to authenticated using (public.is_admin());

insert into public.marketplace_categories (slug, name, description, sort_order) values
  ('template-kode', 'Template Kode', 'Boilerplate aplikasi, starter kit, dan skrip siap pakai.', 1),
  ('modul-ui', 'Modul UI & Desain', 'Komponen antarmuka, UI kit, dan sistem desain.', 2),
  ('aset-digital', 'Aset Digital', 'Ikon, ilustrasi, dokumen panduan, dan e-book teknis.', 3),
  ('jasa-freelance', 'Jasa Freelance', 'Layanan pengembangan web, desain produk, dan konsultasi.', 4),
  ('lainnya', 'Lainnya', 'Produk digital dan layanan komunitas lainnya.', 5)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Produk & Jasa Marketplace
-- ---------------------------------------------------------------------------
create table public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.marketplace_categories(id) on delete set null,
  title varchar(200) not null,
  slug varchar(220) not null unique,
  summary varchar(300) not null,
  description text not null check (char_length(description) <= 10000),
  product_type public.marketplace_product_type not null default 'template',
  price_idr bigint not null default 0 check (price_idr >= 0),
  license_type public.marketplace_license_type not null default 'personal',
  preview_url text,
  demo_url text,
  thumbnail_url text,
  tags text[] not null default '{}',
  status public.marketplace_product_status not null default 'published',
  inquiry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marketplace_products_status_created_idx
  on public.marketplace_products (status, created_at desc);
create index marketplace_products_seller_idx
  on public.marketplace_products (seller_id);
create index marketplace_products_category_idx
  on public.marketplace_products (category_id);
create index marketplace_products_type_idx
  on public.marketplace_products (product_type);
create index marketplace_products_price_idx
  on public.marketplace_products (price_idr);
create index marketplace_products_title_trgm_idx
  on public.marketplace_products using gin (title gin_trgm_ops);

create trigger trg_marketplace_products_updated_at
  before update on public.marketplace_products
  for each row execute function public.set_updated_at();

alter table public.marketplace_products enable row level security;

create policy "marketplace_products_select" on public.marketplace_products
  for select using (
    status = 'published'
    or seller_id = auth.uid()
    or public.is_moderator()
  );

create policy "marketplace_products_insert_own" on public.marketplace_products
  for insert to authenticated
  with check (
    seller_id = auth.uid()
    and status in ('draft', 'published')
  );

create policy "marketplace_products_update_own" on public.marketplace_products
  for update to authenticated
  using (seller_id = auth.uid() or public.is_moderator())
  with check (seller_id = auth.uid() or public.is_moderator());

create policy "marketplace_products_delete_own" on public.marketplace_products
  for delete to authenticated
  using (seller_id = auth.uid() or public.is_moderator());

-- ---------------------------------------------------------------------------
-- 3. Inquiry Pemesanan Produk
-- ---------------------------------------------------------------------------
create table public.product_inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_name varchar(120) not null,
  buyer_contact varchar(160) not null,
  message text not null check (char_length(message) between 10 and 2000),
  status public.marketplace_inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_inquiries_product_idx
  on public.product_inquiries (product_id, created_at desc);
create index product_inquiries_seller_status_idx
  on public.product_inquiries (seller_id, status);
create index product_inquiries_buyer_idx
  on public.product_inquiries (buyer_id);

create trigger trg_product_inquiries_updated_at
  before update on public.product_inquiries
  for each row execute function public.set_updated_at();

create or replace function public.sync_marketplace_inquiry_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

create trigger trg_product_inquiries_insert
  after insert on public.product_inquiries
  for each row execute function public.sync_marketplace_inquiry_count();

create trigger trg_product_inquiries_delete
  after delete on public.product_inquiries
  for each row execute function public.sync_marketplace_inquiry_count();

alter table public.product_inquiries enable row level security;

create policy "product_inquiries_select" on public.product_inquiries
  for select to authenticated
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or public.is_moderator()
  );

create policy "product_inquiries_insert" on public.product_inquiries
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'new'
    and exists (
      select 1
      from public.marketplace_products p
      where p.id = product_id
        and p.status = 'published'
        and p.seller_id = seller_id
        and p.seller_id <> auth.uid()
    )
  );

create policy "product_inquiries_update_seller" on public.product_inquiries
  for update to authenticated
  using (seller_id = auth.uid() or public.is_moderator())
  with check (seller_id = auth.uid() or public.is_moderator());

create policy "product_inquiries_delete" on public.product_inquiries
  for delete to authenticated
  using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or public.is_moderator()
  );
