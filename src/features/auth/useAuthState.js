import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { KEY } from "../../constants";
import { lsGet, lsSet } from "../../utils/localStorage";
import { ensureSeed } from "../../utils/seed";

/**
 * Hook for managing auth state and session restoration
 */
export function useAuthState() {
  const [user, setUser] = useState(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    ensureSeed();
    let alive = true;
    let authSub = null;

    // 🧹 DEV ortamında eski seed/login kalıntılarını 1 kere temizle
    if (import.meta.env.DEV && !localStorage.getItem("tg_clean_v1")) {
      localStorage.removeItem(KEY.USERS);
      localStorage.removeItem(KEY.USER);
      localStorage.setItem("tg_clean_v1", "done");
    }

    const restoreAndListen = async () => {
      try {
        // 🔐 Supabase yoksa sadece booted true
        if (!supabase?.auth) {
          if (alive) setBooted(true);
          return;
        }

        // 1) Session restore
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error) console.error("❌ getSession error:", error);

        const session = data?.session;
        if (session?.user) {
          const md = session.user.user_metadata || {};
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: md.username ?? null,
            avatar: md.avatar ?? "",
            Tier: md.tier ?? md.Tier ?? null,
            XP: Number(md.xp ?? md.XP ?? 0),
            createdAt: md.createdAt ?? null,
            age: md.age ?? "",
            city: md.city ?? "",
            state: md.state ?? "",
            bio: md.bio ?? "",
          });
        } else {
          setUser(null);
        }

        // 2) Auth listener (login/logout/refresh değişimlerinde state güncelle)
        const { data: subData } = supabase.auth.onAuthStateChange((_event, s) => {
          if (!alive) return;

          if (s?.user) {
            const md = s.user.user_metadata || {};
            setUser({
              id: s.user.id,
              email: s.user.email,
              username: md.username ?? null,
              avatar: md.avatar ?? "",
              Tier: md.tier ?? md.Tier ?? null,
              XP: Number(md.xp ?? md.XP ?? 0),
              createdAt: md.createdAt ?? null,
              age: md.age ?? "",
              city: md.city ?? "",
              state: md.state ?? "",
              bio: md.bio ?? "",
            });
          } else {
            setUser(null);
          }
        });

        authSub = subData?.subscription || null;
      } catch (e) {
        console.error("💥 restore/auth crash:", e);
        setUser(null);
      } finally {
        if (alive) setBooted(true);
      }
    };

    restoreAndListen();

    return () => {
      alive = false;
      try {
        authSub?.unsubscribe?.();
      } catch (_) {}
    };
  }, []);

  // Persist user to localStorage
  useEffect(() => {
    if (!booted) return;
    if (user) lsSet(KEY.USER, user);
    else localStorage.removeItem(KEY.USER);
  }, [user, booted]);

  return { user, setUser, booted };
}
