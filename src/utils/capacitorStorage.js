/**
 * Auth storage for Supabase: Capacitor Preferences on native (iOS/Android),
 * localStorage on web. Ensures session is persisted and sent with requests in Apple/TestFlight build.
 */

function isNative() {
  try {
    return typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
  } catch (_) {
    return false;
  }
}

const PREFIX = "tg_sb_";

export const supabaseAuthStorage = {
  getItem: async (key) => {
    if (isNative()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const p = Preferences.get({ key: PREFIX + key });
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("storage_timeout")), 3000)
        );
        const { value } = await Promise.race([p, timeout]);
        return value ?? null;
      } catch (_) {
        return null;
      }
    }
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    } catch (_) {
      return null;
    }
  },
  setItem: async (key, value) => {
    if (isNative()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.set({ key: PREFIX + key, value: String(value) });
      } catch (_) {}
      return;
    }
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch (_) {}
  },
  removeItem: async (key) => {
    if (isNative()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.remove({ key: PREFIX + key });
      } catch (_) {}
      return;
    }
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch (_) {}
  },
};
