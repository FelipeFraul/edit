-- Public, sanitized snapshot for the website.
-- Admin drafts remain untouched and should continue to be used only by the admin UI.

create table if not exists public.published_site_content (
  id text primary key,
  status text not null default 'published',
  hero_json jsonb not null,
  content_json jsonb not null,
  version_number integer,
  published_at timestamptz not null default now(),
  published_by text,
  updated_at timestamptz not null default now(),
  content_hash text,
  schema_version integer
);

create index if not exists published_site_content_status_idx
  on public.published_site_content (status);

create index if not exists published_site_content_published_at_idx
  on public.published_site_content (published_at desc);

alter table public.published_site_content enable row level security;

drop policy if exists published_site_content_select_published on public.published_site_content;

create policy published_site_content_select_published
on public.published_site_content
for select
to anon
using (status = 'published');
