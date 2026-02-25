# Release Checklist (Pre–Apple Submit / TestFlight)

Run before each production deploy or TestFlight upload.

## 1. Build & Lint
- [ ] `npm install`
- [ ] `npm run lint` — fix or document any remaining warnings
- [ ] `npm run build` — must complete with exit code 0

## 2. Environment
- [ ] `.env` or `.env.production` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set
- [ ] Production build is tested with real Supabase project (no blank screen on load)

## 3. Smoke Test (manual)
- [ ] Open app → no "Misconfiguration" or blank screen
- [ ] Sign in / Sign out works
- [ ] Accept Terms flow (if new user) and then İşletme Ekle / Bildir open correctly
- [ ] HUB: load posts, like, comment (no infinite loop or crash)
- [ ] Admin (if admin user): open Admin panel, open Kötüye Kullanım, list loads

## 4. iOS / Capacitor (if releasing native)
- [ ] `npx cap sync ios`
- [ ] Build number incremented (Xcode)
- [ ] Archive & upload to App Store Connect
- [ ] Demo account and privacy/export compliance as in APP_STORE_SUBMISSION.md

## 5. Post-deploy
- [ ] Check Supabase logs for RLS or quota errors
- [ ] Verify Terms/Privacy URLs are reachable
