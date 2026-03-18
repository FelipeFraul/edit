-- Admin CMS persistence tables

create table if not exists public.admin_drafts (
  id text primary key,
  data_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_versions (
  id text primary key,
  version_number integer not null,
  data_json jsonb not null,
  created_at timestamptz not null,
  created_by text not null,
  is_published boolean not null default false
);

create index if not exists admin_versions_version_number_idx
  on public.admin_versions (version_number desc);

-- Keep updated_at fresh on draft row updates
create or replace function public.touch_admin_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_drafts_updated_at on public.admin_drafts;
create trigger trg_admin_drafts_updated_at
before update on public.admin_drafts
for each row
execute function public.touch_admin_drafts_updated_at();

-- Seed singleton draft row if missing
insert into public.admin_drafts (id, data_json)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- Basic RLS policies for anon key usage from admin frontend.
-- Restrict this in production by using auth and tighter policies.
alter table public.admin_drafts enable row level security;
alter table public.admin_versions enable row level security;

drop policy if exists admin_drafts_select_all on public.admin_drafts;
drop policy if exists admin_drafts_insert_all on public.admin_drafts;
drop policy if exists admin_drafts_update_all on public.admin_drafts;
drop policy if exists admin_versions_select_all on public.admin_versions;
drop policy if exists admin_versions_insert_all on public.admin_versions;

create policy admin_drafts_select_all on public.admin_drafts
for select using (true);

create policy admin_drafts_insert_all on public.admin_drafts
for insert with check (true);

create policy admin_drafts_update_all on public.admin_drafts
for update using (true) with check (true);

create policy admin_versions_select_all on public.admin_versions
for select using (true);

create policy admin_versions_insert_all on public.admin_versions
for insert with check (true);
