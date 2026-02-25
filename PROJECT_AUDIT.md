# TurkGuide — Production & Apple-Review Audit

## 1. PROJECT MAP (key files/modules)

```
src/
├── App.jsx                    # Root: state, routing (active tab), modals, report/business flows
├── main.jsx
├── supabaseClient.js         # Supabase client; env validation (can export null if env missing)
├── constants/index.js         # KEY, DEFAULT_ADMINS, DEFAULT_ADMIN_EMAILS, MAX_IMAGE_BYTES
├── theme/themeTokens.js
├── hooks/
│   ├── useBoot.js             # Restore users/biz/posts/dms/appts from localStorage
│   ├── useSystemTheme.js
│   └── useFileToBase64.jsx
├── utils/
│   ├── helpers.js             # now, uid, fmt, normalizeUsername, uuid, openDirections, openCall, trackMetric
│   ├── localStorage.js       # lsGet, lsSet
│   ├── capacitorStorage.js    # Auth storage adapter for Capacitor
│   ├── contentFilter.js       # UGC filter / blocked content
│   └── seed.js                # ensureSeed (DEV cleanup)
├── features/
│   ├── auth/
│   │   ├── useAuthState.js    # Session restore, onAuthStateChange, syncPublicProfile, fetchProfileFlags, hydrateProfileFlags
│   │   ├── useAuth.js         # requireAuth, loginNow, logout, deleteAccount, oauthLogin
│   │   ├── useAuthCallback.js # OAuth callback handling
│   │   ├── AuthModal.jsx      # Login / Register forms + terms checkbox on register
│   │   ├── authService.js     # signIn, signUp, signOut, getSession
│   │   └── pendingProfileFlags.js  # Race fix for acceptedTermsAt on token refresh
│   ├── business/
│   │   ├── useBusiness.js     # Biz list, apply, admin approve/reject/delete, openBizApply, reports resolve
│   │   ├── useBusinessEdit.js # Edit biz (admin or owner)
│   │   └── BizApplyForm.jsx
│   ├── hub/
│   │   └── useHub.js          # fetchHubPosts, hubShare, hubLike, hubComment, deleteHubComment, hubRepost, edit/delete post
│   ├── admin/
│   │   ├── useAdmin.js        # adminMode (role from profiles + DEFAULT_ADMINS/DEFAULT_ADMIN_EMAILS), admin logs
│   │   └── AdminPanel.jsx     # Dashboard, İşletmeler, Randevular, Kullanıcılar, Kötüye Kullanım, Loglar
│   ├── profile/
│   │   ├── useProfile.js      # Profile modal data, open by username
│   │   └── useUserManagement.js # setUsername, setAvatar, profiles upsert, block user
│   ├── messages/
│   │   ├── useMessages.js     # DMs, openDmToUser, openDmToBiz, sendDm
│   │   └── DMModal.jsx
│   ├── appointments/
│   │   └── useAppointment.js  # openAppointment, submitAppointment
│   ├── notifications/
│   │   └── useNotifications.js
│   └── settings/
│       └── useSettings.js, SettingsModal.jsx
├── components/
│   ├── ui/                    # Button, Card, Modal, Chip, Avatar, BizCta, inputStyle, etc.
│   ├── layout/                # TopBar, LandingHero, Seg, CategoryGrid
│   ├── tabs/                  # BusinessTab, HubTab
│   └── modals/                # ProfileModal, EditBizModal, EditUserModal, AppointmentModal, InfoModal
└── services/media.js

supabase/
├── ugc_safety.sql             # handle_new_user, profiles accepted_terms_at/banned_at, user_blocks, RLS
├── report_policies.sql        # reports table, RLS, insert_report RPC
├── admin_logs.sql             # admin_logs table, RLS
└── admin_policies.sql        # Reference (many policies commented out)
```

---

## 2. TOP 15 HIGHEST-RISK ISSUES

| # | Risk | Why |
|---|------|-----|
| 1 | **Supabase client can be null** | If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, client is null but app still mounts; many calls use `supabase?.from` and fail silently or throw in unexpected places. |
| 2 | **Env vars not validated at build time** | Missing env in production only fails at runtime; no fail-fast at build. |
| 3 | **Unique email/username not enforced in DB** | RPCs `is_email_available` / `is_username_available` are used in app but admin_policies.sql shows them commented; if not applied in Supabase, duplicates possible. No UNIQUE index on profiles(username) or email. |
| 4 | **Admin access relies on client + localStorage** | `adminMode` = server role from profiles OR (DEV + unlock + DEFAULT_ADMINS). DEFAULT_ADMIN_EMAILS in code; if RLS is wrong, non-admin could access admin data. |
| 5 | **Reports: normal users cannot read own reports** | RLS only allows admin to SELECT reports; reporter cannot see their own submission status. (May be intentional.) |
| 6 | **105 ESLint warnings** | No errors but many unused vars, missing deps in useEffect; could hide bugs or cause stale closures. |
| 7 | **Console.log in production** | App.jsx and supabaseClient log ENV/URL/KEY; supabaseClient logs "KEY OK" — should be dev-only. |
| 8 | **syncPublicProfile can throw "invalid input syntax for type integer"** | Fixed for age; if profiles has other integer columns without guards, same class of bug. |
| 9 | **Terms gating race** | hydrateProfileFlags now preserves acceptedTermsAt; pendingAcceptedTerms used in applyProfileFlags. Multiple code paths (requireAuth DB fetch, visibility refresh) — worth one more pass for edge cases. |
| 10 | **No centralized error messages (TR/EN)** | Many `alert("...")` strings; no shared map for common errors or network/auth failures. |
| 11 | **Hub: optimistic UI rollback** | useHub does optimistic updates; on error it restores. Need to ensure every catch path restores state. |
| 12 | **Appointments/businesses RLS** | admin_policies.sql is mostly commented; actual RLS for businesses, biz_apps, appointments, hub_posts must be verified in Supabase. |
| 13 | **Storage buckets (avatars/images)** | No storage RLS or path sanitization audited in this codebase; could be in Supabase dashboard. |
| 14 | **One-like-per-user-per-post** | Hub like is toggled in UI and DB; no unique constraint mentioned for (user, post). Could allow double-like from race. |
| 15 | **Release checklist** | APP_STORE_SUBMISSION.md exists but no short "Release Checklist" with npm run build/lint, env check, smoke test steps. |

---

## 3. STEP-BY-STEP FIX PLAN (small, safe steps)

### Phase A — Code quality & stability (no schema changes)
- **A1** Env: Validate `VITE_SUPABASE_*` at build time (Vite define or env check in supabaseClient); ensure app shows a single "Misconfiguration" screen when supabase is null instead of partial behavior.
- **A2** Remove or guard console.log in production (App.jsx, supabaseClient.js).
- **A3** Lint: Fix unused imports/vars in App.jsx and supabaseClient (lsGet, uid, isAdminUser, ensureSeed, etc.) and fix react-hooks/exhaustive-deps where it causes real bugs (or add eslint-disable with comment).
- **A4** Defensive: Ensure all critical supabase calls are behind `if (!supabase?.from) return;` or similar and show user-facing error where appropriate.

### Phase B — Auth & terms
- **B1** Confirm terms: Register form has checkbox; acceptTerms writes to profiles; requireAuth opens terms gate and can refresh from DB with timeout. No change unless audit finds a gap.
- **B2** Session: refreshSession on visibility and in submitReport already present; ensure no double-refresh loops.

### Phase C — Database / Supabase (migrations)
- **C1** Create migration (or document) for: unique index on profiles(lower(email)), profiles(lower(username)) if not already applied.
- **C2** Ensure is_email_available and is_username_available RPCs exist and are granted; document in README or migration.
- **C3** RLS: Audit businesses, biz_apps, appointments, hub_posts, admin_logs — list required policies and add missing ones as separate migration files.

### Phase D — Admin panel
- **D1** AdminPanel: Fix useMemo dependency warnings (safeBiz, safeUsers, etc.) by wrapping in useMemo or moving inside.
- **D2** Ensure every admin action checks adminMode and that server (RLS) enforces role.

### Phase E — Observability & release
- **E1** Add a short RELEASE_CHECKLIST.md (build, lint, env, smoke test, TestFlight steps).
- **E2** AUDIT_CHANGELOG.md: Log each issue → fix → files → how verified.

---

## 4. IMPLEMENTATION ORDER

1. **A1 + A2 + A4** (env + console + defensive) in one small commit. ✅
2. **A3** Lint: one commit for App.jsx and supabaseClient only. ✅
3. **D1** AdminPanel useMemo. ✅
4. **C1 + C2** Document or add SQL for unique email/username and RPCs. (See `supabase/README_MIGRATIONS.md`.)
5. **E1 + E2** Release checklist and changelog. ✅

After each group: `npm run lint`, `npm run build`, smoke test note in changelog.

---

## 5. ISSUES FIXED IN THIS PASS

| Done | Item |
|------|------|
| ✅ | Misconfiguration screen when Supabase env missing (wrapper App → AppContent; no conditional hooks). |
| ✅ | Production console.log removed/guarded (supabaseClient + App.jsx). |
| ✅ | App.jsx lint: unused vars, catch params (_ignored), useEffect deps; hooks no longer conditional. |
| ✅ | AdminPanel: safeBiz/safeUsers/safeAppts/safeLogs/safeReports wrapped in useMemo. |
| ✅ | RELEASE_CHECKLIST.md and AUDIT_CHANGELOG.md added. |
| ✅ | Auth/terms + defensive guards: supabase null checks in loginNow, oauthLogin, deleteAccount; logout/deleteAccount TR error messages; DEV-only console in useAuth, useAuthState, acceptTerms; useAuthState lsGet removed. |

---

## 6. REMAINING RISKS & NEXT STEPS

- **DB uniqueness**: Apply unique constraints / RPCs for email and username per `supabase/README_MIGRATIONS.md` (or admin_policies.sql commented blocks).
- **RLS**: Verify in Supabase dashboard that businesses, biz_apps, appointments, hub_posts, admin_logs have correct RLS; admin-only tables (e.g. reports SELECT) are admin-only.
- **Lint**: 85 warnings remain in other files (TopBar, HubTab, useAuth, BizApplyForm, etc.); fix in follow-up or allow with rule.
- **Storage**: Audit storage bucket policies and path sanitization in Supabase.
- **One-like-per-user-per-post**: Add unique constraint or upsert in DB if not already present.
