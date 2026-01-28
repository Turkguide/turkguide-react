export function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function lsGet(key, fallback) {
  return safeParse(localStorage.getItem(key), fallback);
}

export function lsSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("localStorage.setItem failed (quota exceeded?):", e);
    // Silently fail - app should continue working even if localStorage is full
  }
}
