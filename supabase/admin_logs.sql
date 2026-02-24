-- Admin logs: tüm adminler (profiles.role = 'admin') logları görebilir ve ekleyebilir.
-- Supabase SQL Editor'da çalıştır.

create table if not exists public.admin_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  admin_id uuid references auth.users(id),
  admin_username text,
  action text,
  payload jsonb default '{}'
);

alter table public.admin_logs enable row level security;

drop policy if exists "admin_logs_admin_only" on public.admin_logs;
drop policy if exists "admin_logs_admin_select" on public.admin_logs;
drop policy if exists "admin_logs_admin_insert" on public.admin_logs;

-- Sadece admin (profiles.role = 'admin') tüm logları görebilir
create policy "admin_logs_admin_select"
on public.admin_logs for select
to authenticated
using ((select role from public.profiles p where p.id = auth.uid()) = 'admin');

-- Sadece admin yeni log ekleyebilir
create policy "admin_logs_admin_insert"
on public.admin_logs for insert
to authenticated
with check ((select role from public.profiles p where p.id = auth.uid()) = 'admin');
