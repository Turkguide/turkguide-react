import { hasAcceptedTermsEffective, hasAcceptedTermsValue } from "./termsEffective";
import { termsDebugLog } from "./termsDebugLog";

const DBG = "[tg:terms:hydrate]";

/**
 * profiles.accepted_terms_at doğruluk kaynağı — stale state ve .single() hatalarına karşı.
 * @returns {{ ok: boolean, reason: string, dbAcceptedTermsAt?: string|null }}
 */
export async function hydrateTermsAcceptanceFromDb({ supabase, user, setUser }) {
  const userId = user?.id;
  if (!userId || !supabase?.from) {
    const ok = hasAcceptedTermsEffective(user);
    termsDebugLog({
      path: "hydrateTermsAcceptanceFromDb",
      userId,
      userState: user?.acceptedTermsAt ?? null,
      dbValue: null,
      queryError: null,
      ok,
      reason: "no_db_or_id",
      blockedReason: ok ? null : "no_db_or_id",
    });
    return {
      ok,
      reason: "no_db_or_id",
      dbAcceptedTermsAt: null,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("accepted_terms_at, banned_at, created_at")
    .eq("id", userId)
    .maybeSingle();

  const dbRaw = data?.accepted_terms_at ?? null;
  termsDebugLog({
    path: "hydrateTermsAcceptanceFromDb:afterQuery",
    userId,
    userState: user?.acceptedTermsAt ?? null,
    dbValue: dbRaw,
    queryError: error?.message ?? null,
    hasProfileRow: !!data,
    blockedReason: error ? `query_error:${error.message}` : null,
  });
  if (import.meta.env.DEV) {
    console.log(DBG, {
      userId,
      frontendAcceptedTermsAt: user?.acceptedTermsAt ?? null,
      dbAcceptedTermsAt: dbRaw,
      error: error?.message ?? null,
    });
  }

  if (error) {
    const ok = hasAcceptedTermsEffective(user);
    termsDebugLog({
      path: "hydrateTermsAcceptanceFromDb:queryFailed",
      userId,
      userState: user?.acceptedTermsAt ?? null,
      dbValue: dbRaw,
      queryError: error.message,
      ok,
      reason: "query_error",
      blockedReason: ok ? null : "query_error_no_effective_fallback",
    });
    if (import.meta.env.DEV) {
      console.warn(DBG, "query failed; frontend effective only", error.message, { ok });
    }
    return { ok, reason: "query_error", dbAcceptedTermsAt: null };
  }

  const dbAt = dbRaw;
  if (hasAcceptedTermsValue(dbAt)) {
    setUser?.((prev) =>
      String(prev?.id) === String(userId)
        ? {
            ...prev,
            acceptedTermsAt: dbAt,
            bannedAt: data?.banned_at ?? prev?.bannedAt ?? null,
            createdAt:
              prev?.createdAt ??
              (data?.created_at ? new Date(data.created_at).getTime() : prev?.createdAt),
          }
        : prev
    );
    termsDebugLog({
      path: "hydrateTermsAcceptanceFromDb:allowed",
      userId,
      userState: user?.acceptedTermsAt ?? null,
      dbValue: dbAt,
      ok: true,
      reason: "db_accepted_terms_at",
      blockedReason: null,
    });
    return { ok: true, reason: "db_accepted_terms_at", dbAcceptedTermsAt: dbAt };
  }

  const createdMs = data?.created_at ? new Date(data.created_at).getTime() : null;
  const merged = {
    ...user,
    createdAt: user.createdAt ?? (Number.isFinite(createdMs) ? createdMs : null),
  };
  if (hasAcceptedTermsEffective(merged)) {
    if (Number.isFinite(createdMs) && (user.createdAt == null || user.createdAt === "")) {
      setUser?.((prev) =>
        String(prev?.id) === String(userId) ? { ...prev, createdAt: createdMs } : prev
      );
    }
    termsDebugLog({
      path: "hydrateTermsAcceptanceFromDb:allowed",
      userId,
      userState: user?.acceptedTermsAt ?? null,
      dbValue: dbRaw,
      ok: true,
      reason: "grandfather_or_effective",
      blockedReason: null,
    });
    return { ok: true, reason: "grandfather_or_effective", dbAcceptedTermsAt: null };
  }

  termsDebugLog({
    path: "hydrateTermsAcceptanceFromDb:blocked",
    userId,
    userState: user?.acceptedTermsAt ?? null,
    dbValue: dbRaw,
    profileCreatedAt: data?.created_at ?? null,
    ok: false,
    reason: "no_acceptance_in_db",
    blockedReason: !dbRaw ? "missing_db_terms" : "no_grandfather",
  });
  if (import.meta.env.DEV) {
    console.warn(DBG, "blocked", { userId, reason: "no_acceptance_in_db" });
  }
  return { ok: false, reason: "no_acceptance_in_db", dbAcceptedTermsAt: null };
}
