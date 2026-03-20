import { TERMS_ENFORCEMENT_START_MS } from "../constants";

/**
 * Oturum + user_metadata ile hesap oluşturma zamanı (ms).
 * Önce metadata, yoksa Supabase auth `user.created_at`.
 */
export function resolveCreatedAtFromSession(session, md = {}) {
  const m = md.createdAt;
  if (m != null) {
    if (typeof m === "number" && Number.isFinite(m)) return m;
    const t = Date.parse(String(m));
    return Number.isFinite(t) ? t : null;
  }
  const ca = session?.user?.created_at;
  if (ca) {
    const ms = new Date(ca).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

/**
 * Kullanıcının hesap oluşturma zamanı (ms). Metadata, profil veya auth.created_at.
 */
export function userCreatedAtMs(user) {
  if (!user) return null;
  const c = user.createdAt;
  if (c == null) return null;
  if (typeof c === "number" && Number.isFinite(c)) return c;
  const t = Date.parse(String(c));
  return Number.isFinite(t) ? t : null;
}

/**
 * Şartlar “kabul edilmiş” sayılır:
 * - profiles / user üzerinde acceptedTermsAt var, veya
 * - TERMS_ENFORCEMENT_START_MS öncesi kayıtlı (mevcut ekip / geçmiş kullanıcılar).
 *
 * Bu tarihten sonra kayıt olanlar kayıtta şart kutusunu işaretlemek zorunda (useAuth.loginNow register).
 */
export function hasAcceptedTermsEffective(user) {
  if (!user) return false;
  if (user.acceptedTermsAt) return true;
  const t = userCreatedAtMs(user);
  if (t != null && t < TERMS_ENFORCEMENT_START_MS) return true;
  return false;
}
