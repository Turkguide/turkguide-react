# delete-my-account

Edge Function for user self-deletion. Requires **service role** to delete from `auth.users`.

## Deploy

From project root:

```bash
supabase functions deploy delete-my-account
```

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in the project (it is available automatically in deployed functions).

## Behavior

1. Client calls `supabase.functions.invoke("delete-my-account", { method: "POST" })` with the session (JWT sent automatically).
2. Function verifies the JWT and gets the user id.
3. Deletes the row from `public.profiles` for that user (avoids FK issues).
4. Calls `auth.admin.deleteUser(userId)` to remove the user from Supabase Auth.
5. Returns `{ ok: true }` or `{ error: "..." }`.

## RLS

No RLS is needed for this flow: the function uses the service role client to delete the profile and the auth user. The client only invokes the function; it cannot delete other users.
