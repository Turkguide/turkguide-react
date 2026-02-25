-- UGC safety: terms acceptance, user blocks, moderation flags
-- Run in Supabase SQL editor

-- Yeni auth kullanıcısı (Apple/OAuth dahil) oluşunca otomatik profiles satırı — "Database error saving new user" önlenir
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    coalesce(nullif(trim(new.email), ''), new.id::text || '@apple.placeholder'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'user_' || left(new.id::text, 8))
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user: %', sqlerrm;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Profiles: terms acceptance + ban flag
alter table public.profiles
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists banned_at timestamptz;

-- Allow authenticated users to insert their own profile row (Apple/OAuth yeni kullanıcı)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- Allow users to update their own profile (for terms acceptance)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow admin to update profiles (ban)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using ((select role from public.profiles p where p.id = auth.uid()) = 'admin')
with check ((select role from public.profiles p where p.id = auth.uid()) = 'admin');

-- User blocks
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  blocker_id uuid not null,
  blocked_id uuid not null
);

create unique index if not exists user_blocks_unique
on public.user_blocks (blocker_id, blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks_select_self" on public.user_blocks;
create policy "user_blocks_select_self"
on public.user_blocks for select
to authenticated
using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "user_blocks_insert_self" on public.user_blocks;
create policy "user_blocks_insert_self"
on public.user_blocks for insert
to authenticated
with check (auth.uid() = blocker_id);

drop policy if exists "user_blocks_delete_self" on public.user_blocks;
create policy "user_blocks_delete_self"
on public.user_blocks for delete
to authenticated
using (auth.uid() = blocker_id);
