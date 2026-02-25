# Supabase migrations & RLS (TurkGuide)

Apply these in the Supabase SQL editor (or as migrations) to enforce data integrity and security.

## 1. Unique email and username

Ensure one account per email and one-time username claim:

```sql
-- Unique email (case-insensitive)
create unique index if not exists profiles_email_lower_key
  on public.profiles (lower(email));

-- Unique username (case-insensitive)
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));
```

If your `profiles` table uses different column names, adjust. Run once; idempotent with `if not exists`.

## 2. RPCs for availability checks

Used by the app for register/username change. Create if not present:

- **is_email_available(p_email text)** → returns boolean (true if no profile with lower(email) = lower(p_email)).
- **is_username_available(p_username text)** → returns boolean (true if no profile with lower(username) = lower(p_username)).

See `admin_policies.sql` for commented `create or replace function` examples. Grant execute to `anon` and `authenticated`.

## 3. RLS audit

Verify in Supabase Dashboard → Authentication → Policies (and Table Editor → each table):

- **profiles**: Users can read own row; authenticated can read public fields (e.g. avatar, username) for others; only own row update (or admin).
- **businesses / biz_apps**: Appropriate select/insert/update for owners and admins; public read for approved businesses.
- **appointments**: Own appointments + biz owner visibility; insert by authenticated.
- **hub_posts / hub_likes / hub_comments**: Per your UGC rules (e.g. public read, insert/update/delete by author or admin).
- **admin_logs**: Admin-only select; insert by service or admin.
- **reports**: Admin-only select; insert by authenticated (reporter).

## 4. One-like-per-user-per-post (optional)

To prevent duplicate likes from races:

```sql
-- Example: unique on (user_id, post_id) for hub_likes
alter table public.hub_likes
  add constraint hub_likes_user_post_unique unique (user_id, post_id);
```

Adjust table/column names to match your schema.
