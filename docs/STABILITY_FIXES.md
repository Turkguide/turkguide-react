# Stability Fixes — Report, Add Business, New User, DB Writes

## Root causes addressed

1. **Business submit (İşletme Ekle)**  
   - Insert was **not awaited**; success alert and modal close ran before the DB call completed.  
   - **Fix:** Await `supabase.from("biz_apps").insert()`. Update local state and close modal only after successful insert. On error, show message and leave modal open.

2. **New user / Apple login (Profil kaydedilemedi)**  
   - `syncPublicProfile` (profiles upsert) was not awaited in callers, causing unhandled promise rejections.  
   - No retry or handling for duplicate/conflict when the backend trigger created the row first.  
   - **Fix:** Await `syncPublicProfile` in `restoreAndListen` and `onAuthStateChange`. In `syncPublicProfile`: one retry after 800ms; treat duplicate/unique/conflict as success (no alert); only alert after retry fails.

3. **Accept terms (Kayıt zaman aşımına uğradı)**  
   - Two updates (profiles + legacy `users` table); dependency on non-existent or slow `users` table could cause timeouts.  
   - **Fix:** Single update to `profiles` only. Timeout increased to 15s. Clear error handling; no fallback to a second table.

4. **Report submit (Bildir)**  
   - No double-submit guard; no timeout on session refresh, so UI could hang.  
   - **Fix:** `submittingReport` state to disable button and show "Gönderiliyor…". Session refresh + getSession wrapped in `Promise.race` with 10s timeout. `setSubmittingReport(false)` in `finally`.

## Files changed

| File | Change |
|------|--------|
| `src/features/business/useBusiness.js` | submitBizApplication: await insert; success/close only on success; no optimistic local add before insert |
| `src/features/auth/useAuthState.js` | syncPublicProfile: retry once, ignore duplicate/conflict, no alert for duplicate; callers await syncPublicProfile |
| `src/App.jsx` | acceptTerms: single profiles update, 15s timeout; submitReport: submittingReport guard, 10s session timeout, disabled button state |

## Supabase / backend

- **handle_new_user** (ugc_safety.sql): Ensures a profiles row exists after signup. Deploy this trigger so "Database error saving new user" is avoided; client upsert remains as fallback.
- **insert_report** (report_policies.sql): RPC must exist and be granted to `authenticated`. Session is refreshed before call.
- **biz_apps**: RLS must allow insert for authenticated users (e.g. with check `auth.uid() = user_id` or equivalent).
- **profiles**: RLS must allow update for own row (`auth.uid() = id`) for accepted_terms_at.

## Verification

- **İşletme Ekle:** Submit form → only "Başvurunuz alındı" and modal close after successful insert; on failure, error message and modal stays open.
- **Bildir:** Click Gönder once → button shows "Gönderiliyor…" and is disabled until request finishes; no double submit.
- **Terms:** Accept → single DB update; timeout only if network/DB is slow (15s).
- **Apple login:** New user → profiles upsert with retry; duplicate from trigger is ignored; alert only on real failure after retry.
