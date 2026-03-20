import { hasAcceptedTermsEffective, hasAcceptedTermsValue } from "./termsEffective";

const DBG = "[tg:terms:hydrate]";

/**
 * profiles.accepted_terms_at doğruluk kaynağı — stale state ve .single() hatalarına karşı.
 * @returns {{ ok: boolean, reason: string, dbAcceptedTermsAt?: string|null }}
 */
export async function hydrateTermsAcceptanceFromDb({ supabase, user, setUser }) {
  const userId = user?.id;
  if (!userId || !supabase?.from) {
    return {
      ok: hasAcceptedTermsEffective(user),
      reason: "no_db_or_id",
      dbAcceptedTermsAt: null,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("accepted_terms_at, banned_at, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (import.meta.env.DEV) {
    console.log(DBG, {
      userId,
      frontendAcceptedTermsAt: user?.acceptedTermsAt ?? null,
      dbAcceptedTermsAt: data?.accepted_terms_at ?? null,
      error: error?.message ?? null,
    });
  }

  if (error) {
    const ok = hasAcceptedTermsEffective(user);
    if (import.meta.env.DEV) {
      console.warn(DBG, "query failed; frontend effective only", error.message, { ok });
    }
    return { ok, reason: "query_error", dbAcceptedTermsAt: null };
  }

  const dbAt = data?.accepted_terms_at ?? null;
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
    return { ok: true, reason: "grandfather_or_effective", dbAcceptedTermsAt: null };
  }

  if (import.meta.env.DEV) {
    console.warn(DBG, "blocked", { userId, reason: "no_acceptance_in_db" });
  }
  return { ok: false, reason: "no_acceptance_in_db", dbAcceptedTermsAt: null };
}
