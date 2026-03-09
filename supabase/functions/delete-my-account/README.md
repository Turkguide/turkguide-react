# delete-my-account

Edge Function for permanent user account deletion. Uses service role to clean all user data then remove the auth user.

## Deploy

```bash
supabase functions deploy delete-my-account
```

Deploy to the **same** Supabase project the web app uses. The app must have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` pointing to this project.

## CORS

The function returns full CORS headers so browser requests from your production origin succeed:

- `OPTIONS` → 204 with `Access-Control-Allow-Origin`, `Allow-Headers`, `Allow-Methods: POST, OPTIONS`
- All responses include the same CORS headers.

## Behavior

1. Client calls `supabase.functions.invoke("delete-my-account", { method: "POST" })` with session (JWT sent automatically).
2. Function verifies JWT and gets user id (and username from `profiles`).
3. Deletes in order (avoids FK issues):
   - `reports` (reporter_id)
   - `user_blocks` (blocker_id, then blocked_id)
   - `dms` (from_username / to_username)
   - `notifications` (from_username / to_username)
   - `appointments` (from_username)
   - `hub_posts` (user_id)
   - `biz_apps` (user_id, owner_username, applicant)
   - `businesses` (owner_username)
   - `admin_logs` (admin_id — FK to auth.users, must run before auth delete)
   - `profiles` (id)
4. Calls `auth.admin.deleteUser(userId)`.
5. Returns `{ ok: true }` or on failure `{ error, step?, code?, details? }` (HTTP 500). Frontend shows `error` and `step` to the user.

## Tables cleaned

- reports, user_blocks, dms, notifications, appointments, hub_posts, biz_apps, businesses, admin_logs, profiles, then auth.users.
