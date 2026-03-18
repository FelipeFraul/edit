-- Enable UUID generator
create extension if not exists pgcrypto;

-- Generic timestamp updater
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Generic helper: only authenticated admin by e-mail can write.
-- Replace the e-mail below if needed.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'admin@editgroup.com';
$$;

-- Hero variants
create table if not exists public.hero_variants (
  id uuid primary key default gen_random_uuid(),
  pos int not null,
  title text,
  subtitle text,
  content text,
  kicker text,
  animated_prefix text,
  animated_words text[] default '{}',
  tagline text,
  who text,
  "when" text,
  category text,
  modal_title text,
  video_src text,
  poster text,
  bg_image text,
  mobile_bg_image text,
  top_cta_label text,
  top_cta_href text,
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hero_variants_set_updated_at
before update on public.hero_variants
for each row execute function public.set_updated_at();

-- Section 04: filters
create table if not exists public.section04_voice_filters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  content text,
  hint text,
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger section04_voice_filters_set_updated_at
before update on public.section04_voice_filters
for each row execute function public.set_updated_at();

-- Section 04: taxonomy tree (hierarchical by parent_id)
create table if not exists public.section04_taxonomy_items (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid not null references public.section04_voice_filters(id) on delete cascade,
  parent_id uuid references public.section04_taxonomy_items(id) on delete cascade,
  title text not null,
  subtitle text,
  content text,
  level int not null default 1,
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_section04_taxonomy_filter_id on public.section04_taxonomy_items(filter_id);
create index if not exists idx_section04_taxonomy_parent_id on public.section04_taxonomy_items(parent_id);

create trigger section04_taxonomy_items_set_updated_at
before update on public.section04_taxonomy_items
for each row execute function public.set_updated_at();

-- Section 05: brands
create table if not exists public.section05_brands (
  id uuid primary key default gen_random_uuid(),
  title text not null,         -- brand name
  subtitle text,               -- optional alt text
  content text,                -- optional notes
  logo_file_path text,
  logo_bucket text default 'public-assets',
  logo_public_url text,
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger section05_brands_set_updated_at
before update on public.section05_brands
for each row execute function public.set_updated_at();

-- Section 05: panel content by brand
create table if not exists public.section05_brand_panels (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.section05_brands(id) on delete cascade,
  title text not null,
  subtitle text,
  content text,                -- description
  voice_type text,
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_section05_brand_panels_brand_id on public.section05_brand_panels(brand_id);

create trigger section05_brand_panels_set_updated_at
before update on public.section05_brand_panels
for each row execute function public.set_updated_at();

-- Section 05: audio library
create table if not exists public.section05_audio_library (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.section05_brands(id) on delete set null,
  title text not null,         -- audio display name
  subtitle text,
  content text,
  file_path text,
  bucket text default 'audio',
  public_url text,
  mime_type text,
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_section05_audio_brand_id on public.section05_audio_library(brand_id);

create trigger section05_audio_library_set_updated_at
before update on public.section05_audio_library
for each row execute function public.set_updated_at();

-- Section 06: stats
create table if not exists public.section06_stats (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  title text not null,
  subtitle text,
  content text,                -- description
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger section06_stats_set_updated_at
before update on public.section06_stats
for each row execute function public.set_updated_at();

-- Site settings (footer + texts by section)
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text,
  subtitle text,
  content text,
  value_json jsonb default '{}'::jsonb,
  order_index int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- Content versions (snapshot for publish/revert)
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  version_number int not null,
  data_json jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  is_published boolean not null default false
);

create unique index if not exists ux_content_versions_version_number on public.content_versions(version_number);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Enable RLS
alter table public.hero_variants enable row level security;
alter table public.section04_voice_filters enable row level security;
alter table public.section04_taxonomy_items enable row level security;
alter table public.section05_brands enable row level security;
alter table public.section05_brand_panels enable row level security;
alter table public.section05_audio_library enable row level security;
alter table public.section06_stats enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_versions enable row level security;

-- Public read (only active + not deleted)
create policy "hero public read" on public.hero_variants for select
using (is_active = true and deleted_at is null);

create policy "section04 filters public read" on public.section04_voice_filters for select
using (is_active = true and deleted_at is null);

create policy "section04 taxonomy public read" on public.section04_taxonomy_items for select
using (is_active = true and deleted_at is null);

create policy "section05 brands public read" on public.section05_brands for select
using (is_active = true and deleted_at is null);

create policy "section05 panels public read" on public.section05_brand_panels for select
using (is_active = true and deleted_at is null);

create policy "section05 audio public read" on public.section05_audio_library for select
using (is_active = true and deleted_at is null);

create policy "section06 stats public read" on public.section06_stats for select
using (is_active = true and deleted_at is null);

create policy "site settings public read" on public.site_settings for select
using (is_active = true and deleted_at is null);

create policy "content versions public read published only" on public.content_versions for select
using (is_published = true);

-- Admin full access
create policy "hero admin all" on public.hero_variants for all
using (public.is_admin())
with check (public.is_admin());

create policy "section04 filters admin all" on public.section04_voice_filters for all
using (public.is_admin())
with check (public.is_admin());

create policy "section04 taxonomy admin all" on public.section04_taxonomy_items for all
using (public.is_admin())
with check (public.is_admin());

create policy "section05 brands admin all" on public.section05_brands for all
using (public.is_admin())
with check (public.is_admin());

create policy "section05 panels admin all" on public.section05_brand_panels for all
using (public.is_admin())
with check (public.is_admin());

create policy "section05 audio admin all" on public.section05_audio_library for all
using (public.is_admin())
with check (public.is_admin());

create policy "section06 stats admin all" on public.section06_stats for all
using (public.is_admin())
with check (public.is_admin());

create policy "site settings admin all" on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

create policy "content versions admin all" on public.content_versions for all
using (public.is_admin())
with check (public.is_admin());

-- Storage RLS policies
create policy "public assets read"
on storage.objects for select
using (bucket_id = 'public-assets');

create policy "audio read"
on storage.objects for select
using (bucket_id = 'audio');

create policy "admin upload public assets"
on storage.objects for insert
with check (bucket_id = 'public-assets' and public.is_admin());

create policy "admin upload audio"
on storage.objects for insert
with check (bucket_id = 'audio' and public.is_admin());

create policy "admin update objects"
on storage.objects for update
using (public.is_admin())
with check (public.is_admin());

create policy "admin delete objects"
on storage.objects for delete
using (public.is_admin());
