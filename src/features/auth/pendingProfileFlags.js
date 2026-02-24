/**
 * Pending profile flags (e.g. acceptedTermsAt) set by App before React state commits.
 * useAuthState reads these in auth callbacks so token refresh doesn't overwrite
 * a just-accepted terms value (race condition fix).
 */
const pendingByUserId = {};

export function setPendingAcceptedTerms(userId, value) {
  if (userId) pendingByUserId[userId] = value;
}

export function consumePendingAcceptedTerms(userId) {
  const value = pendingByUserId[userId];
  if (userId && value != null) delete pendingByUserId[userId];
  return value ?? undefined;
}
