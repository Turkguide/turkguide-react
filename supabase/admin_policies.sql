-- Admin roles and RLS policies (reference)
-- Apply in Supabase SQL editor or migrations.

-- 1) Profiles role column (if missing)
-- alter table public.profiles add column if not exists role text default 'user';

-- 2) Helper policy check
-- We treat role='admin' as full access.

-- Admin logs table (example schema)
-- create table if not exists public.admin_logs (
--   id uuid default gen_random_uuid() primary key,
--   admin_id uuid references auth.users(id),
--   admin_username text,
--   action text,
--   payload jsonb,
--   created_at timestamptz default now()
-- );

-- Enable RLS
-- alter table public.profiles enable row level security;
-- alter table public.businesses enable row level security;
-- alter table public.biz_apps enable row level security;
-- alter table public.appointments enable row level security;
-- alter table public.hub_posts enable row level security;
-- alter table public.admin_logs enable row level security;

-- Profiles: users can read own; admins can read all
-- create policy "profiles_read_own_or_admin"
-- on public.profiles for select
-- using (auth.uid() = id or (select role from public.profiles p where p.id = auth.uid()) = 'admin');

-- Profiles: allow authenticated users to read public profiles (avatars, username, etc.)
-- NOTE: This is required so users can see each other's profile photos.
-- create policy "profiles_read_authenticated"
-- on public.profiles for select
-- to authenticated
-- using (true);

-- Username availability check (safe for anon/auth via RPC)
-- create or replace function public.is_username_available(p_username text)
-- returns boolean
-- language sql
-- security definer
-- set search_path = public
-- as $$
--   select not exists (
--     select 1 from public.profiles
--     where lower(username) = lower(p_username)
--   );
-- $$;
-- grant execute on function public.is_username_available(text) to anon, authenticated;

-- Email availability check (safe for anon/auth via RPC)
-- create or replace function public.is_email_available(p_email text)
-- returns boolean
-- language sql
-- security definer
-- set search_path = public
-- as $$
--   select not exists (
--     select 1 from public.profiles
--     where lower(email) = lower(p_email)
--   );
-- $$;
-- grant execute on function public.is_email_available(text) to anon, authenticated;

-- Optional: enforce unique usernames at DB level (case-insensitive)
-- create unique index if not exists profiles_username_lower_unique
-- on public.profiles (lower(username));

-- Businesses: admin full access; public read approved
-- create policy "businesses_public_read"
-- on public.businesses for select
-- using (status = 'approved' or (select role from public.profiles p where p.id = auth.uid()) = 'admin');
-- create policy "businesses_admin_write"
-- on public.businesses for all
-- using ((select role from public.profiles p where p.id = auth.uid()) = 'admin')
-- with check ((select role from public.profiles p where p.id = auth.uid()) = 'admin');

-- Business applications: admin only
-- create policy "biz_apps_admin_only"
-- on public.biz_apps for all
-- using ((select role from public.profiles p where p.id = auth.uid()) = 'admin')
-- with check ((select role from public.profiles p where p.id = auth.uid()) = 'admin');

-- Appointments: admin only (or biz owner by business_id if needed)
-- create policy "appointments_admin_only"
-- on public.appointments for all
-- using ((select role from public.profiles p where p.id = auth.uid()) = 'admin')
-- with check ((select role from public.profiles p where p.id = auth.uid()) = 'admin');

-- HUB posts: admin or owner
-- create policy "hub_posts_owner_or_admin"
-- on public.hub_posts for all
-- using (
--   auth.uid() = user_id
--   or (select role from public.profiles p where p.id = auth.uid()) = 'admin'
-- )
-- with check (
--   auth.uid() = user_id
--   or (select role from public.profiles p where p.id = auth.uid()) = 'admin'
-- );

-- Admin logs: admin only
-- create policy "admin_logs_admin_only"
-- on public.admin_logs for all
-- using ((select role from public.profiles p where p.id = auth.uid()) = 'admin')
-- with check ((select role from public.profiles p where p.id = auth.uid()) = 'admin');
