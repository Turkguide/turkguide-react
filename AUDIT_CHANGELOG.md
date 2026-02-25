# Audit Changelog — TurkGuide Production-Stable / Apple-Review-Safe

| Issue | Fix | Files changed | How verified |
|-------|-----|---------------|--------------|
| (Audit doc) | Project map + Top 15 risks + plan | PROJECT_AUDIT.md added | — |
| Supabase null / hooks | Misconfiguration screen in wrapper; AppContent holds all hooks | App.jsx | Lint + build |
| Env / console | DEV-only logs; no prod console in supabaseClient | supabaseClient.js | — |
| Lint App.jsx | Unused vars prefixed/removed; catch _ignored; useEffect deps | App.jsx | npm run lint (0 errors) |
| Release docs | RELEASE_CHECKLIST.md, AUDIT_CHANGELOG.md | (new files) | — |
| AdminPanel useMemo | safeBiz/safeUsers/safeAppts/safeLogs/safeReports in useMemo | AdminPanel.jsx | npm run lint (5 fewer warnings) |
| Supabase docs | Migration/RLS steps for unique email/username, RPCs, one-like | supabase/README_MIGRATIONS.md, PROJECT_AUDIT.md §5–6 | — |
| Auth/terms + defensive | loginNow/oauthLogin/deleteAccount: supabase guard + TR alerts; logout catch alert; DEV-only console | useAuth.js | lint, build |
| Auth state | DEV-only console; remove unused lsGet | useAuthState.js | lint |
| acceptTerms | DEV-only console; TR error message | App.jsx | build |
