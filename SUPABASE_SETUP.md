# Supabase Setup (Admin Content)

## 1) Environment variables
Set these in local `.env` and Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only (if you add API routes/functions):

- `SUPABASE_SERVICE_ROLE_KEY`

## 2) Run migration
Apply this SQL in Supabase SQL Editor:

- `supabase/migrations/20260303_admin_content_init.sql`

This creates:

- `hero_variants`
- `section04_voice_filters`
- `section04_taxonomy_items`
- `section05_brands`
- `section05_brand_panels`
- `section05_audio_library`
- `section06_stats`
- `site_settings`
- `content_versions`

All editable-item tables include:

- `id` (uuid)
- `order_index` (int)
- `is_active` (bool)
- `deleted_at` (timestamptz nullable)
- `created_at` / `updated_at`

## 3) RLS behavior
Public site reads only active/non-deleted rows:

- `is_active = true`
- `deleted_at is null`

Admin write access is restricted by `public.is_admin()`:

- current default: `admin@editgroup.com`

If needed, edit the SQL function:

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'YOUR_ADMIN_EMAIL';
$$;
```

## 4) Storage buckets
Created by migration:

- `public-assets` (logos, posters, images)
- `audio` (mp3/wav/ogg)

Store only references in DB:

- `file_path`
- `bucket`
- `public_url`

## 5) Current app status
Admin UI is working with local persistence (`localStorage`) already.

Next step (integration phase) is wiring UI CRUD to Supabase tables using the same data model fields:

- `order_index`
- `is_active`
- `deleted_at`

without changing layout/animations/player/modal logic.
