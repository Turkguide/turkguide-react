import { hydrateTermsAcceptanceFromDb } from "./termsDbHydrate";

/**
 * Profil kaydı öncesi şart çözümü — tek kaynak hydrateTermsAcceptanceFromDb ile aynı mantık.
 */
export async function resolveTermsForProfileSave({ me, supabase, setUser }) {
  if (!me?.id) {
    return { ok: false, resolvedAcceptedTermsAt: null, reason: "no_me", queryError: null };
  }

  const r = await hydrateTermsAcceptanceFromDb({ supabase, user: me, setUser });
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
