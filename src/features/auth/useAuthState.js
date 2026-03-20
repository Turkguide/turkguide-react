import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { KEY } from "../../constants";
import { lsSet } from "../../utils/localStorage";
import { ensureSeed } from "../../utils/seed";
import { normalizeUsername } from "../../utils/helpers";
import { resolveCreatedAtFromSession, hasAcceptedTermsValue } from "../../utils/termsEffective";
import { consumePendingAcceptedTerms } from "./pendingProfileFlags";

/**
 * Hook for managing auth state and session restoration
 */
export function useAuthState() {
  const [user, setUser] = useState(null);
  const [booted, setBooted] = useState(false);
  const userRef = useRef(null);

  /**
   * Sync profile row to public.profiles (idempotent upsert).
   * After Apple/OAuth signup, backend trigger may create the row; we upsert to enrich or create.
   * Does not alert on duplicate/conflict (trigger race); one retry on transient failure.
   */
  async function syncPublicProfile(nextUser) {
    if (!supabase?.from || !nextUser?.id) return;
    const unameRaw = String(nextUser?.username || "").trim();
    const emailValue = String(nextUser?.email || "").trim();
    const fallbackUname = "user_" + String(nextUser.id).slice(0, 8);
    const fallbackEmail = emailValue || nextUser.id + "@apple.placeholder";
    const unameKey = normalizeUsername(unameRaw || fallbackUname);
    const avatarStr = typeof nextUser.avatar === "string" ? nextUser.avatar : "";
    const ageVal = nextUser?.age;
    const ageInt =
      ageVal !== null && ageVal !== undefined && ageVal !== ""
        ? (() => {
            const n = Number(ageVal);
            return Number.isInteger(n) ? n : null;
          })()
        : null;
    const payload = {
      id: nextUser.id,
      username: unameKey,
      email: emailValue || fallbackEmail,
      avatar: avatarStr || null,
      city: String(nextUser?.city || "").trim() || null,
      state: String(nextUser?.state || "").trim() || null,
      country: String(nextUser?.country || "").trim() || null,
      bio: String(nextUser?.bio || "").trim() || null,
    };
    if (ageInt != null && Number.isInteger(ageInt)) payload.age = ageInt;
    if (hasAcceptedTermsValue(nextUser?.acceptedTermsAt)) {
      const at = nextUser.acceptedTermsAt;
      payload.accepted_terms_at =
        typeof at === "number" && Number.isFinite(at) ? new Date(at).toISOString() : String(at);
    }

    const doUpsert = () => supabase.from("profiles").upsert(payload, { onConflict: "id" });

    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const { error } = await doUpsert();
        if (!error) return;
        const msg = String(error?.message || error?.code || "").toLowerCase();
        if (/duplicate|unique|already exists|conflict/i.test(msg)) return;
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        if (import.meta.env.DEV) console.warn("syncPublicProfile error:", error);
        alert("Profil kaydedilemedi. Lütfen tekrar giriş yapın veya destek ile iletişime geçin.");
      } catch (e) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        if (import.meta.env.DEV) console.warn("syncPublicProfile exception:", e);
        alert("Profil kaydedilemedi. Lütfen tekrar giriş yapın veya destek ile iletişime geçin.");
      }
      return;
    }
  }

  /** Fetch accepted_terms_at, banned_at from profiles for a user id (for sync use on restore). */
  async function fetchProfileFlags(userId) {
    try {
      if (!supabase?.from || !userId) return { acceptedTermsAt: null, bannedAt: null };
      const { data, error } = await supabase
        .from("profiles")
        .select("accepted_terms_at, banned_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) return { acceptedTermsAt: null, bannedAt: null };
      if (!data) return { acceptedTermsAt: null, bannedAt: null };
      return {
        acceptedTermsAt: data.accepted_terms_at || null,
        bannedAt: data.banned_at || null,
      };
    } catch (e) {
      if (import.meta.env.DEV) console.warn("fetchProfileFlags error:", e);
      return { acceptedTermsAt: null, bannedAt: null };
    }
  }

  /** Oturumdaki user_metadata ile public.profiles birleştir (büyük avatar sadece DB'de olabilir). */
  async function mergeProfileRowFromDb(nextUser) {
    try {
      if (!supabase?.from || !nextUser?.id) return nextUser;
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar, age, city, state, country, bio, accepted_terms_at, banned_at, created_at")
        .eq("id", nextUser.id)
        .maybeSingle();
      if (error || !data) return nextUser;
      const o = { ...nextUser };
      const u = String(data.username ?? "").trim();
      if (u) o.username = u;
      if (typeof data.avatar === "string" && data.avatar.length > 0) o.avatar = data.avatar;
      if (data.city != null) o.city = String(data.city || "");
      if (data.state != null) o.state = String(data.state || "");
      if (data.country != null) o.country = String(data.country || "");
      if (data.bio != null) o.bio = String(data.bio || "");
      if (data.age != null && data.age !== "") o.age = data.age;
      if (data.accepted_terms_at) o.acceptedTermsAt = data.accepted_terms_at;
      if (data.banned_at != null && o.bannedAt == null) o.bannedAt = data.banned_at;
      if (data.created_at && (o.createdAt == null || o.createdAt === "")) {
        const cms = new Date(data.created_at).getTime();
        if (Number.isFinite(cms)) o.createdAt = cms;
      }
      return o;
    } catch (e) {
      if (import.meta.env.DEV) console.warn("mergeProfileRowFromDb:", e);
      return nextUser;
    }
  }

  async function hydrateProfileFlags(nextUser) {
    try {
      if (!supabase?.from) return;
      if (!nextUser?.id) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("accepted_terms_at, banned_at")
        .eq("id", nextUser.id)
        .maybeSingle();
      if (error) return;
      if (!data) return;
      setUser((prev) =>
        prev && String(prev.id) === String(nextUser.id)
          ? {
              ...prev,
              acceptedTermsAt: (data.accepted_terms_at || prev.acceptedTermsAt) ?? null,
              bannedAt: (data.banned_at ?? prev.bannedAt) ?? null,
            }
          : prev
      );
    } catch (e) {
      if (import.meta.env.DEV) console.warn("hydrateProfileFlags error:", e);
    }
  }

  // Keep ref in sync so auth events don't overwrite acceptedTermsAt/bannedAt with null
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    ensureSeed();
    let alive = true;
    let authSub = null;
    const bootTimeout = setTimeout(() => {
      if (alive) setBooted(true);
    }, 4000);

    // 🧹 DEV ortamında eski seed/login kalıntılarını 1 kere temizle
    if (import.meta.env.DEV && !localStorage.getItem("tg_clean_v1")) {
      localStorage.removeItem(KEY.USERS);
      localStorage.removeItem(KEY.USER);
      localStorage.setItem("tg_clean_v1", "done");
    }

    function applyProfileFlags(nextUser) {
      const prev = userRef.current;
      const pendingAccepted = consumePendingAcceptedTerms(nextUser.id);
      /**
       * KRİTİK: fetchProfileFlags ile gelen DB değeri korunmalı.
       * Eski sıra pending ?? prev — prev stale null iken DB’deki accepted_terms_at siliniyordu.
       * Doğru sıra: taze DB (nextUser) → pending (kısa yarış) → prev.
       */
      nextUser.acceptedTermsAt =
        nextUser.acceptedTermsAt ??
        pendingAccepted ??
        (prev?.id === nextUser.id ? prev.acceptedTermsAt : null) ??
        null;
      nextUser.bannedAt =
        nextUser.bannedAt ??
        (prev?.id === nextUser.id ? prev.bannedAt : null) ??
        null;
    }

    const restoreAndListen = async () => {
      let userWasSet = false;
      try {
        // 🔐 Supabase yoksa sadece booted true
        if (!supabase?.auth) {
          if (alive) setBooted(true);
          return;
        }

        // 1) Session restore — önce oturum al, kullanıcıyı hemen göster; flags arka planda
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error && import.meta.env.DEV) console.error("getSession error:", error);

        let session = data?.session;
        if (session?.expires_at) {
          const nowSec = Math.floor(Date.now() / 1000);
          if (session.expires_at <= nowSec + 60) {
            try {
              const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshed?.session) session = refreshed.session;
            } catch (_) {}
          }
        }
        if (session?.user) {
          const md = session.user.user_metadata || {};
          const flags = await fetchProfileFlags(session.user.id);
          let nextUser = {
            id: session.user.id,
            email: session.user.email ?? null,
            username: md.username ?? null,
            avatar: md.avatar ?? "",
            Tier: md.tier ?? md.Tier ?? null,
            XP: Number(md.xp ?? md.XP ?? 0),
            createdAt: resolveCreatedAtFromSession(session, md),
            age: md.age ?? "",
            city: md.city ?? "",
            state: md.state ?? "",
            country: md.country ?? "",
            bio: md.bio ?? "",
            emailConfirmedAt: session.user.email_confirmed_at ?? session.user.confirmed_at ?? null,
            emailVerified:
              !!(session.user.email_confirmed_at ?? session.user.confirmed_at) &&
              !session.user.new_email,
            newEmailPending: session.user.new_email ?? null,
            acceptedTermsAt: flags?.acceptedTermsAt ?? null,
            bannedAt: flags?.bannedAt ?? null,
          };
          applyProfileFlags(nextUser);
          nextUser = await mergeProfileRowFromDb(nextUser);
          setUser(nextUser);
          userWasSet = true;
          if (alive) setBooted(true);
          try {
            await syncPublicProfile(nextUser);
          } catch (_) {}
        } else {
          setUser(null);
        }

        // 2) Auth listener — sadece SIGNED_OUT'ta çıkış yap; ilk yükleme race'inde user silinmesin
        const { data: subData } = supabase.auth.onAuthStateChange(async (event, s) => {
          if (!alive) return;
          if (!s?.user && event !== "SIGNED_OUT") return;
          try {
            if (s?.user) {
              const md = s.user.user_metadata || {};
              const flags = await fetchProfileFlags(s.user.id);
              let nextUser = {
                id: s.user.id,
                email: s.user.email ?? null,
                username: md.username ?? null,
                avatar: md.avatar ?? "",
                Tier: md.tier ?? md.Tier ?? null,
                XP: Number(md.xp ?? md.XP ?? 0),
                createdAt: resolveCreatedAtFromSession(s, md),
                age: md.age ?? "",
                city: md.city ?? "",
                state: md.state ?? "",
                country: md.country ?? "",
                bio: md.bio ?? "",
                emailConfirmedAt: s.user.email_confirmed_at ?? s.user.confirmed_at ?? null,
                emailVerified:
                  !!(s.user.email_confirmed_at ?? s.user.confirmed_at) && !s.user.new_email,
                newEmailPending: s.user.new_email ?? null,
                acceptedTermsAt: flags?.acceptedTermsAt ?? null,
                bannedAt: flags?.bannedAt ?? null,
              };
              applyProfileFlags(nextUser);
              nextUser = await mergeProfileRowFromDb(nextUser);
              setUser((prev) => {
                const next = { ...nextUser };
                if (prev?.id === next.id) {
                  next.acceptedTermsAt = next.acceptedTermsAt ?? prev.acceptedTermsAt ?? null;
                  next.bannedAt = next.bannedAt ?? prev.bannedAt ?? null;
                }
                return next;
              });
              try {
                await syncPublicProfile(nextUser);
              } catch (_) {}
            } else {
              setUser(null);
            }
          } catch (e) {
            if (import.meta.env.DEV) console.error("onAuthStateChange handler:", e);
            if (s?.user) {
              setUser((prev) => {
                const next = {
                  id: s.user.id,
                  email: s.user.email ?? null,
                  username: s.user.user_metadata?.username ?? null,
                  avatar: s.user.user_metadata?.avatar ?? "",
                  acceptedTermsAt: null,
                  bannedAt: null,
                };
                if (prev?.id === next.id) {
                  next.acceptedTermsAt = prev.acceptedTermsAt ?? null;
                  next.bannedAt = prev.bannedAt ?? null;
                }
                return next;
              });
            } else if (event === "SIGNED_OUT") setUser(null);
          }
        });

        authSub = subData?.subscription || null;
      } catch (e) {
        if (import.meta.env.DEV) console.error("restore/auth crash:", e);
        if (!userWasSet) setUser(null);
      } finally {
        clearTimeout(bootTimeout);
        if (alive) setBooted(true);
      }
    };

    restoreAndListen();

    return () => {
      alive = false;
      clearTimeout(bootTimeout);
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
