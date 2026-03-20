import { hasAcceptedTermsEffective } from "./termsEffective";

const DBG = "[tg:profileSave:terms]";

/**
 * Profil kaydı için şart kontrolü: kaynak sırası Supabase profiles (gerçek), sonra effective helper.
 * Dönen resolvedAcceptedTermsAt, aynı save içindeki setUser çağrılarında kullanılmalı (stale closure önlemi).
 */
export async function resolveTermsForProfileSave({ me, supabase, setUser }) {
  if (!me?.id) {
    return { ok: false, resolvedAcceptedTermsAt: null, reason: "no_me" };
  }

  let resolvedAcceptedTermsAt = me.acceptedTermsAt ?? null;

  if (!supabase?.from) {
    const ok = hasAcceptedTermsEffective(me);
    if (import.meta.env.DEV) {
      console.log(DBG, { userId: me.id, branch: "no_supabase", ok, frontendAccepted: me.acceptedTermsAt });
    }
    return { ok, resolvedAcceptedTermsAt, reason: ok ? "effective_no_db" : "blocked_no_db" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("accepted_terms_at, created_at")
    .eq("id", me.id)
    .maybeSingle();

  if (import.meta.env.DEV) {
    console.log(DBG, {
      userId: me.id,
      frontendAcceptedTermsAt: me.acceptedTermsAt,
      dbAcceptedTermsAt: data?.accepted_terms_at ?? null,
      dbCreatedAt: data?.created_at ?? null,
      queryError: error?.message ?? null,
    });
  }

  if (error) {
    const ok = hasAcceptedTermsEffective(me);
    if (import.meta.env.DEV) {
      console.warn(DBG, "profiles read failed; falling back to frontend effective", error.message);
    }
    return { ok, resolvedAcceptedTermsAt, reason: "query_error_fallback", queryError: error.message };
  }

  if (data?.accepted_terms_at) {
    resolvedAcceptedTermsAt = data.accepted_terms_at;
    setUser((prev) =>
      prev?.id === me.id ? { ...prev, acceptedTermsAt: data.accepted_terms_at } : prev
    );
    if (import.meta.env.DEV) console.log(DBG, { userId: me.id, decision: "db_has_accepted_terms_at" });
    return { ok: true, resolvedAcceptedTermsAt, reason: "db_accepted_terms_at" };
  }

  const cms = data?.created_at ? new Date(data.created_at).getTime() : null;
  const merged = {
    ...me,
    acceptedTermsAt: resolvedAcceptedTermsAt,
    createdAt: me.createdAt ?? (Number.isFinite(cms) ? cms : null),
  };
  if (hasAcceptedTermsEffective(merged)) {
    if (Number.isFinite(cms) && (me.createdAt == null || me.createdAt === "")) {
      setUser((prev) => (prev?.id === me.id ? { ...prev, createdAt: cms } : prev));
    }
    if (import.meta.env.DEV) console.log(DBG, { userId: me.id, decision: "grandfather_created_at" });
    return { ok: true, resolvedAcceptedTermsAt, reason: "grandfather" };
  }

  const ok = hasAcceptedTermsEffective(me);
  if (import.meta.env.DEV) {
    console.log(DBG, { userId: me.id, decision: ok ? "frontend_effective_only" : "blocked", ok });
  }
  return { ok, resolvedAcceptedTermsAt, reason: ok ? "frontend_effective" : "no_terms" };
}
