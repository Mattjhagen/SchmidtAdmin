-- Site content tables powering the Site Editor (/admin) AND the public
-- website (walls2.com reads these via the anon key + site-content.js).
-- These tables already exist in production; this migration documents them
-- and makes fresh environments match.

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null default '',
  service_slug text not null default '',
  service_name text not null default '',
  description text not null default '',
  image_url text not null default '',
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_config (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.service_overrides (
  slug text primary key,
  long_description text,
  image_url text,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;
alter table public.site_config enable row level security;
alter table public.service_overrides enable row level security;

-- Public (anon) visitors may READ everything; only authenticated admin
-- users may write. Policies are guarded so re-running is safe.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'portfolio_items' and policyname = 'public read portfolio') then
    create policy "public read portfolio" on public.portfolio_items for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'portfolio_items' and policyname = 'authenticated write portfolio') then
    create policy "authenticated write portfolio" on public.portfolio_items for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'site_config' and policyname = 'public read site_config') then
    create policy "public read site_config" on public.site_config for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'site_config' and policyname = 'authenticated write site_config') then
    create policy "authenticated write site_config" on public.site_config for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'service_overrides' and policyname = 'public read service_overrides') then
    create policy "public read service_overrides" on public.service_overrides for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'service_overrides' and policyname = 'authenticated write service_overrides') then
    create policy "authenticated write service_overrides" on public.service_overrides for all to authenticated using (true) with check (true);
  end if;
end $$;
