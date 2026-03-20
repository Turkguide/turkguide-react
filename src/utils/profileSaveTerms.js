import { hydrateTermsAcceptanceFromDb } from "./termsDbHydrate";
import { termsDebugLog } from "./termsDebugLog";

/**
 * Profil kaydı — requireAuth ile aynı DB hydrate mantığı (çift kontrol yok).
 */
export async function resolveTermsForProfileSave({ me, supabase, setUser }) {
  if (!me?.id) {
    return { ok: false, resolvedAcceptedTermsAt: null, reason: "no_me", queryError: null };
  }

  const r = await hydrateTermsAcceptanceFromDb({ supabase, user: me, setUser });
  termsDebugLog({
    path: "profileSave:resolveTermsForProfileSave",
    userId: me.id,
    userState: me?.acceptedTermsAt ?? null,
    dbAcceptedTermsAt: r.dbAcceptedTermsAt ?? null,
    ok: r.ok,
    reason: r.reason,
    blockedReason: !r.ok ? r.reason : null,
  });
  if (!r.ok) {
    return {
      ok: false,
      resolvedAcceptedTermsAt: me.acceptedTermsAt ?? null,
      reason: r.reason,
      queryError: null,
    };
  }

  return {
    ok: true,
    resolvedAcceptedTermsAt: r.dbAcceptedTermsAt ?? me.acceptedTermsAt ?? null,
    reason: r.reason,
    queryError: null,
  };
}
