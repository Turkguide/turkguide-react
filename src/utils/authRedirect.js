/**
 * OAuth / email redirect target for Supabase (must match Dashboard allowlist exactly).
 *
 * Production: set VITE_AUTH_REDIRECT_URL=https://www.example.com/auth/callback
 * so it matches your canonical domain (www vs apex breaks PKCE storage).
 */
export function getAuthRedirectUrl() {
  const fromEnv = String(import.meta.env.VITE_AUTH_REDIRECT_URL || "").trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/auth/callback`;
  }
  return "";
}
