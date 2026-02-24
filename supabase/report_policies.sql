-- Reports table and RLS policies
-- Run in Supabase SQL editor
-- Admin users must have role = 'admin' in public.profiles to see reports (reports_admin_select).

-- Ensure profiles has role column (required for admin reports RLS)
alter table public.profiles add column if not exists role text default 'user';

-- Table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  reporter_id uuid,
  reporter_username text,
  target_type text,
  target_id text,
  target_owner text,
  target_label text,
  reason text,
  status text default 'open'
);

alter table public.reports enable row level security;

-- Allow ANY authenticated user (admin veya normal user) to insert their own report.
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated"
on public.reports for insert
to authenticated
with check (auth.uid() = reporter_id);

-- Allow admin to read reports
drop policy if exists "reports_admin_select" on public.reports;
create policy "reports_admin_select"
on public.reports for select
to authenticated
using ((select role from public.profiles p where p.id = auth.uid()) = 'admin');

-- Allow admin to update/delete reports if needed
drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update"
on public.reports for update
to authenticated
using ((select role from public.profiles p where p.id = auth.uid()) = 'admin')
with check ((select role from public.profiles p where p.id = auth.uid()) = 'admin');

drop policy if exists "reports_admin_delete" on public.reports;
create policy "reports_admin_delete"
on public.reports for delete
to authenticated
using ((select role from public.profiles p where p.id = auth.uid()) = 'admin');
