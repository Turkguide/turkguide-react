import { useState, useRef, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { normalizeUsername } from "../../utils/helpers";

/**
 * Hook for Profile operations
 */
export function useProfile({ user, users, biz, resolveUsernameAlias }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const [profileAvatarCache, setProfileAvatarCache] = useState({});
  const [publicProfileCache, setPublicProfileCache] = useState({});
  const inFlightAvatarFetch = useRef({});
  const inFlightPublicProfileFetch = useRef({});

  /**
   * Open profile by username
   */
  async function openProfileByUsername(username) {
    const raw = String(username || "").trim();
    const uname = resolveUsernameAlias(raw);
    const key = normalizeUsername(uname);

    if (!key) {
      setProfileTarget({ type: "user", userId: null, username: raw || uname });
      setProfileOpen(true);
      return;
    }

    // ✅ 1) Önce current user match (en sağlamı)
    if (user && normalizeUsername(user.username) === key) {
      setProfileTarget({ type: "user", userId: user.id, username: user.username });
      setProfileOpen(true);
      return;
    }

    // ✅ 2) users[] içinden id çöz (username değişse bile sağlam kalsın)
    const found = (users || []).find((x) => normalizeUsername(x?.username) === key);

    if (found?.id) {
      setProfileTarget({ type: "user", userId: found.id, username: found.username });
      setProfileOpen(true);
      return;
    }

    // ✅ 3) Local'de yoksa: public.profiles'tan çekmeyi dene (profil bulunamadı fix)
    // UI hemen açılsın, veri gelince cache sayesinde re-render olacak
    setProfileTarget({ type: "user", userId: null, username: uname });
    setProfileOpen(true);

    // Fetch profile in background - don't block UI
    fetchPublicProfileToCache(key).catch((e) => {
      console.warn("openProfileByUsername: failed to fetch public profile:", e);
    });
  }

  /**
   * Open business profile
   */
  function openProfileBiz(bizId) {
    setProfileTarget({ type: "biz", bizId });
    setProfileOpen(true);
  }

  /**
   * Fetch public profile to cache
   */
  async function fetchPublicProfileToCache(usernameKey) {
    if (!usernameKey) return;
    if (inFlightPublicProfileFetch.current[usernameKey]) return;
    inFlightPublicProfileFetch.current[usernameKey] = true;

    try {
      if (!supabase?.from) {
        console.warn("fetchPublicProfileToCache: supabase not available");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar, age, city, state, bio")
        .ilike("username", usernameKey)
        .maybeSingle();

      if (error) {
        console.warn("fetchPublicProfileToCache error:", error);
        return;
      }

      const row = data || null;
      if (!row) {
        // Profile not found in database, but we still allow opening the profile modal
        // with limited info (username only)
        return;
      }

      const mapped = {
        id: row.id || null,
        username: row.username || usernameKey,
        avatar: String(row.avatar || ""),
        age: row.age ?? "",
        city: row.city ?? "",
        state: row.state ?? "",
        bio: row.bio ?? "",
      };

      setPublicProfileCache((prev) => {
        const prevRow = prev?.[usernameKey];
        // don't re-render if unchanged
        if (prevRow && String(prevRow.avatar || "") === String(mapped.avatar || "")) return prev;
        return { ...(prev || {}), [usernameKey]: mapped };
      });
    } catch (e) {
      console.error("fetchPublicProfileToCache exception:", e);
    } finally {
      inFlightPublicProfileFetch.current[usernameKey] = false;
    }
  }

  /**
   * Fetch avatar to cache
   */
  async function fetchAvatarToCache(usernameKey) {
    if (!usernameKey) return;
    if (inFlightAvatarFetch.current[usernameKey]) return;
    inFlightAvatarFetch.current[usernameKey] = true;

    try {
      if (!supabase?.from) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar")
        .ilike("username", usernameKey)
        .maybeSingle();

      if (error) {
        console.warn("fetchAvatarToCache error:", error);
        return;
      }

      const av = String(data?.avatar || "");
      setProfileAvatarCache((prev) => {
        // don't re-render if unchanged
        if (String(prev?.[usernameKey] || "") === av) return prev;
        return { ...(prev || {}), [usernameKey]: av };
      });
    } catch (_) {
      // ignore
    } finally {
      inFlightAvatarFetch.current[usernameKey] = false;
    }
  }

  /**
   * Get avatar by username
   */
  function avatarByUsername(username) {
    const raw = String(username || "").trim();
    const uname = resolveUsernameAlias(raw);
    const key = normalizeUsername(uname);
    if (!key) return "";

    // 1) current authed user (fastest + freshest)
    if (user && normalizeUsername(user.username) === key) {
      return String(user.avatar || "");
    }

    // 2) local users[]
    const found = (users || []).find((x) => normalizeUsername(x?.username) === key);
    const localAvatar = String(found?.avatar || "");
    if (localAvatar) return localAvatar;

    // 3) cached public profile avatar
    const cached = String(profileAvatarCache?.[key] || "");
    if (cached) return cached;

    // 4) not found -> fetch in background, return empty for now
    fetchAvatarToCache(key);
    return "";
  }

  /**
   * Compute profile data from profileTarget
   */
  const profileData = useMemo(() => {
    if (!profileTarget) return null;

    // 👤 USER PROFİLİ
    if (profileTarget.type === "user") {
      // ✅ Kendi profilim: local users[] yerine auth user state'ini kullan
      if (user && normalizeUsername(user.username) === normalizeUsername(profileTarget.username)) {
        const owned = biz.filter(
          (b) => normalizeUsername(b.ownerUsername) === normalizeUsername(user.username) && b.status === "approved"
        );

        return {
          type: "user",
          user: {
            ...user,
            xp: user.xp || 0,
            createdAt: user.createdAt || new Date().toISOString(),
          },
          owned,
        };
      }

      // 👥 Başka kullanıcı (local users[]'tan)
      const targetUname = resolveUsernameAlias(profileTarget.username);

      // 1) Eğer userId geldiyse önce id ile bul (en sağlamı)
      let u = profileTarget.userId ? users.find((x) => String(x.id) === String(profileTarget.userId)) : null;

      // 2) Bulunamazsa username (alias çözülmüş) ile dene
      if (!u) {
        u = users.find((x) => normalizeUsername(x.username) === normalizeUsername(targetUname));
      }

      // ✅ Fallback: users[]'ta yoksa public.profiles cache'ten dene
      if (!u) {
        const key = normalizeUsername(targetUname);
        const cached = key ? publicProfileCache?.[key] : null;
        if (cached) u = cached;
        else {
          // arka planda çek, UI tekrar render olunca profil dolacak
          if (key) fetchPublicProfileToCache(key);
        }
      }

      if (!u) {
        return {
          type: "user",
          user: {
            username: targetUname,
            avatar: "",
            xp: 0,
            createdAt: null,
            city: "",
            state: "",
            country: "",
          },
          owned: [],
          isPlaceholder: true,
        };
      }

      const owned = biz.filter(
        (b) => normalizeUsername(b.ownerUsername) === normalizeUsername(u.username) && b.status === "approved"
      );

      return {
        type: "user",
        user: {
          ...u,
          city: u.city ?? "",
          state: u.state ?? "",
          country: u.country ?? "",
        },
        owned,
        isPlaceholder: false,
      };
    }

    // 🏢 BİZ PROFİLİ
    if (profileTarget.type === "biz") {
      const b = biz.find((x) => x.id === profileTarget.bizId);
      if (!b) return null;

      const resolvedOwner = resolveUsernameAlias(b.ownerUsername);

      const ownerFromAuth =
        user && normalizeUsername(user.username) === normalizeUsername(resolvedOwner)
          ? user
          : null;

      const ownerFromLocal = users.find(
        (x) => normalizeUsername(x.username) === normalizeUsername(resolvedOwner)
      );

      return {
        type: "biz",
        biz: {
          ...b,
          ownerUsername: resolvedOwner,
        },
        owner: ownerFromAuth || ownerFromLocal || null,
      };
    }

    return null;
  }, [profileTarget, users, biz, user, publicProfileCache, resolveUsernameAlias]);

  return {
    // State
    profileOpen,
    setProfileOpen,
    profileTarget,
    setProfileTarget,
    profileData,
    // Functions
    openProfileByUsername,
    openProfileBiz,
    avatarByUsername,
    fetchPublicProfileToCache,
    fetchAvatarToCache,
  };
}
