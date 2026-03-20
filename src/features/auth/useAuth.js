import { useState } from "react";
import { authService } from "./authService";
import { KEY, DEFAULT_ADMINS, DEFAULT_ADMIN_EMAILS } from "../../constants";
import { supabase } from "../../supabaseClient";
import { normalizeUsername } from "../../utils/helpers";
import { clearAllTgSupabasePreferences } from "../../utils/capacitorStorage";

/**
 * Hook for authentication operations
 */
export function useAuth({
  user,
  setUser,
  setShowAuth,
  setShowRegister,
  setShowTermsGate: _setShowTermsGate,
  setTermsChecked: _setTermsChecked,
  setActive,
  setShowSettings,
  setShowBizApply,
  setProfileOpen,
  setProfileTarget,
  setShowEditUser,
  setEditUserCtx,
  setShowDm,
  setDmTarget,
  setDmText,
  setShowAppt,
  setApptBizId,
  setApptMsg,
  setShowDeleteAccountConfirm,
}) {
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const OAUTH_TERMS_KEY = "tg_oauth_terms_accepted_v1";

  function isAdminIdentity(u) {
    const email = String(u?.email || "").trim().toLowerCase();
    const uname = normalizeUsername(String(u?.username || ""));
    return DEFAULT_ADMIN_EMAILS.includes(email) || DEFAULT_ADMINS.includes(uname);
  }

  /**
   * Hard reset - clears all UI state and storage
   */
  function hardResetToHome() {
    // ✅ Supabase session tokens can remain if network/signOut fails.
    // Clear any `sb-*-auth-token` keys so refresh won't restore the session.
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("sb-") && k.includes("-auth-token")) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}

    try {
      const toRemoveS = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("sb-") && k.includes("-auth-token")) toRemoveS.push(k);
      }
      toRemoveS.forEach((k) => sessionStorage.removeItem(k));
    } catch (_) {}

    try {
      localStorage.removeItem(KEY.USER);
      localStorage.removeItem(KEY.ADMIN_UNLOCK);
      sessionStorage.removeItem("tg_active_tab_v1");
    } catch (_) {}

    setDeletingAccount(false);
    if (typeof setShowDeleteAccountConfirm === "function") {
      setShowDeleteAccountConfirm(false);
    }

    setUser(null);
    setShowAuth(false);
    setShowRegister(false);
    setShowSettings(false);
    setShowBizApply(false);

    setProfileOpen(false);
    setProfileTarget(null);

    setShowEditUser(false);
    setEditUserCtx(null);

    if (setShowDm) setShowDm(false);
    if (setDmTarget) setDmTarget(null);
    if (setDmText) setDmText("");

    if (setShowAppt) setShowAppt(false);
    if (setApptBizId) setApptBizId(null);
    if (setApptMsg) setApptMsg("");

    setActive("biz");
    try {
      sessionStorage.setItem("tg_active_tab_v1", "biz");
    } catch (_) {}

    try {
      window.history.replaceState({}, document.title, "/");
    } catch (_) {}

    void clearAllTgSupabasePreferences();

    try {
      window.location.replace("/");
    } catch (_) {
      window.location.href = "/";
    }
  }

  /**
   * Require authentication - shows auth modal if not logged in.
   * Terms kontrolü yalnızca options.requireTerms=true iken çalışır.
   */
  async function requireAuth(options = {}) {
    if (!user) {
      setShowAuth(true);
      return false;
    }
    if (user?.bannedAt) {
      alert("Hesabın askıya alındı. Destek için bize ulaş.");
      return false;
    }
    if (options.requireTerms && user?.id && !isAdminIdentity(user) && supabase?.from) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("accepted_terms_at")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!data?.accepted_terms_at) {
          // Eğer local state'te kabul var ama DB'de yoksa 1 kez self-heal dene
          if (user?.acceptedTermsAt) {
            const acceptedAt =
              typeof user.acceptedTermsAt === "number"
                ? new Date(user.acceptedTermsAt).toISOString()
                : String(user.acceptedTermsAt);
            const uname = normalizeUsername(
              String(user?.username || "").trim() || `user_${String(user.id).slice(0, 8)}`
            );
            const email = String(user?.email || "").trim() || `${user.id}@apple.placeholder`;
            const { error: upErr } = await supabase.from("profiles").upsert(
              { id: user.id, username: uname, email, accepted_terms_at: acceptedAt },
              { onConflict: "id" }
            );
            if (!upErr) return true;
          }
          alert("Devam etmek için Kullanım Şartları'nı kabul etmelisiniz.");
          return false;
        }
      } catch (_) {
        alert("Şartlar doğrulanamadı. Lütfen tekrar deneyin.");
        return false;
      }
    }
    if (options.requireVerified && user?.emailVerified === false) {
      alert("Email adresini doğrulamalısın. Mailine gelen bağlantıya tıkla.");
      return false;
    }
    return true;
  }

  /**
   * Login or Register
   */
  async function loginNow(provider = "email", mode = "login", options = {}) {
    if (!supabase?.auth) {
      alert("Bağlantı hazır değil. Sayfayı yenileyip tekrar deneyin.");
      return;
    }
    try {
      const email = String(authEmail || "").trim().toLowerCase();
      const pass = String(authPassword || "").trim();
      const username = String(authUsername || "").trim();
      const unameKey = normalizeUsername(username);

      // 2) REGISTER
      if (mode === "register") {
        if (options.termsAccepted !== true) {
          alert("Devam etmek için Kullanım Şartları ve Topluluk Kuralları'nı kabul etmelisiniz.");
          return;
        }
        if (!email || !pass || !username) {
          alert("Email, şifre ve kullanıcı adı zorunlu.");
          return;
        }

        // ✅ Email benzersiz mi? (RPC ile güvenli kontrol)
        if (supabase?.rpc) {
          const { data: emailAvailable, error: emailErr } = await supabase.rpc(
            "is_email_available",
            { p_email: email }
          );

          if (emailErr) {
            if (import.meta.env.DEV) console.warn("email availability check:", emailErr);
          } else if (emailAvailable === false) {
            alert("Bu email adresi daha önce kayıt edilmiş.");
            return;
          }
        }

        // ✅ Username benzersiz mi? (RPC ile güvenli kontrol)
        if (supabase?.rpc) {
          const { data: available, error } = await supabase.rpc(
            "is_username_available",
            { p_username: unameKey }
          );

          if (error) {
            if (import.meta.env.DEV) console.warn("username availability check:", error);
            alert("Kullanıcı adı kontrol edilemedi. Lütfen tekrar dene.");
            return;
          }

          if (available === false) {
            alert("Bu kullanıcı adı daha önce kayıt edilmiş.");
            return;
          }
        }

        let data;
        try {
          data = await authService.signUp(email, pass, username);
          if (import.meta.env.DEV) console.log("signUp ok");
        } catch (e) {
          const msg = String(e?.message || e?.error_description || "");
          if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already")) {
            alert("Bu email adresi daha önce kayıt edilmiş.");
            return;
          }
          throw e;
        }

        // Confirm email açıksa: session null gelir, bu normal
        if (!data?.session) {
          alert("Kayıt alındı. Email doğrulama linki gönderildi. Linke tıklayıp doğrula.");
          // ✅ Kayıt sonrası ana sayfa: İşletmeler
          setActive("biz");
          try {
            sessionStorage.setItem("tg_active_tab_v1", "biz");
          } catch (_) {}
          setShowAuth(true); // doğrulama için modal açık kalsın
        } else {
          const acceptedTermsAt = new Date().toISOString();
          const userId = data.user.id;
          for (let attempt = 0; attempt < 4; attempt++) {
            try {
              const { error } = await supabase.from("profiles").upsert(
                {
                  id: userId,
                  email,
                  username: unameKey,
                  accepted_terms_at: acceptedTermsAt,
                },
                { onConflict: "id" }
              );
              if (!error) break;
            } catch (_) {}
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          }
          alert("Kayıt alındı ve giriş yapıldı.");
          setUser((prev) => {
            const next = {
              id: data.user.id,
              email: data.user.email,
              username: data.user.user_metadata?.username || null,
              Tier: data.user.user_metadata?.tier ?? data.user.user_metadata?.Tier ?? null,
              XP: Number(data.user.user_metadata?.xp ?? data.user.user_metadata?.XP ?? 0),
              avatar: data.user.user_metadata?.avatar ?? "",
              createdAt: data.user.user_metadata?.createdAt ?? null,
              age: data.user.user_metadata?.age ?? "",
              city: data.user.user_metadata?.city ?? "",
              state: data.user.user_metadata?.state ?? "",
              bio: data.user.user_metadata?.bio ?? "",
              emailConfirmedAt: data.user.email_confirmed_at ?? data.user.confirmed_at ?? null,
              emailVerified:
                !!(data.user.email_confirmed_at ?? data.user.confirmed_at) && !data.user.new_email,
              newEmailPending: data.user.new_email ?? null,
              acceptedTermsAt,
            };
            if (prev?.id === data.user.id) {
              next.bannedAt = prev.bannedAt ?? null;
            }
            return next;
          });
          setActive("biz");
          try {
            sessionStorage.setItem("tg_active_tab_v1", "biz");
          } catch (_) {}
          setShowAuth(false);
        }

        setAuthPassword("");
        setShowRegister(false);
        return;
      }

      // 3) LOGIN
      if (mode === "login") {
        if (!email || !pass) {
          alert("Email ve şifre zorunlu.");
          return;
        }

        const data = await authService.signIn(email, pass);
        if (import.meta.env.DEV) console.log("login ok");

        setUser((prev) => {
          const next = {
            id: data.user.id,
            email: data.user.email,
            username: data.user.user_metadata?.username ?? (data.user.email ? data.user.email.split("@")[0] : null),
            Tier: data.user.user_metadata?.tier ?? data.user.user_metadata?.Tier ?? null,
            XP: Number(data.user.user_metadata?.xp ?? data.user.user_metadata?.XP ?? 0),
            avatar: data.user.user_metadata?.avatar ?? "",
            createdAt: data.user.user_metadata?.createdAt ?? null,
            age: data.user.user_metadata?.age ?? "",
            city: data.user.user_metadata?.city ?? "",
            state: data.user.user_metadata?.state ?? "",
            bio: data.user.user_metadata?.bio ?? "",
            emailConfirmedAt: data.user.email_confirmed_at ?? data.user.confirmed_at ?? null,
            emailVerified:
              !!(data.user.email_confirmed_at ?? data.user.confirmed_at) && !data.user.new_email,
            newEmailPending: data.user.new_email ?? null,
          };
          if (prev?.id === data.user.id) {
            next.bannedAt = prev.bannedAt ?? null;
          }
          return next;
        });

        // ✅ Login sonrası ana sayfa: İşletmeler
        setActive("biz");
        try {
          sessionStorage.setItem("tg_active_tab_v1", "biz");
        } catch (_) {}

        setShowAuth(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthUsername("");
        return;
      }

      alert("Geçersiz işlem.");
    } catch (e) {
      if (import.meta.env.DEV) console.error("loginNow error:", e);
      const msg = e?.message || e?.error_description || "";
      alert(msg || "Giriş veya kayıt başarısız. Lütfen tekrar deneyin.");
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("signOut timeout")), 800)
      );
      await Promise.race([authService.signOut(), timeout]);
    } catch (e) {
      if (import.meta.env.DEV) console.error("logout error:", e);
      alert("Çıkış sırasında bağlantı hatası. Yerel oturum temizlendi.");
    } finally {
      hardResetToHome();
    }
  }

  /**
   * OAuth login
   */
  async function oauthLogin(provider, options = {}) {
    if (!supabase?.auth) {
      alert("Bağlantı hazır değil. Sayfayı yenileyip tekrar deneyin.");
      return;
    }
    if (provider === "apple" && options.termsAccepted !== true) {
      alert("Apple ile devam etmek için önce Kullanım Şartları'nı kabul etmelisiniz.");
      return;
    }
    try {
      if (provider === "apple") {
        localStorage.setItem(OAUTH_TERMS_KEY, "1");
      }
      await authService.signInWithOAuth(provider);
    } catch (e) {
      if (provider === "apple") {
        localStorage.removeItem(OAUTH_TERMS_KEY);
      }
      if (import.meta.env.DEV) console.error("oauthLogin error:", e);
      alert(e?.message || "OAuth giriş hatası. Lütfen tekrar deneyin.");
    }
  }

  /**
   * Check if user exists (for registration)
   */
  function authUserExists(users, normalizeUsername) {
    const email = String(authEmail || "").trim().toLowerCase();
    const username = String(authUsername || "").trim();

    // Email girildiyse: email'e göre kontrol
    if (email) {
      return users.some((x) => String(x.email || "").trim().toLowerCase() === email);
    }

    // Email yok ama username girildiyse: username'e göre kontrol
    if (username) {
      const unameLower = normalizeUsername(username);
      return users.some((x) => normalizeUsername(x.username) === unameLower);
    }

    // Hiçbiri yoksa: false
    return false;
  }

  /**
   * Delete account via Edge Function (fetch). On success: hardResetToHome.
   * On failure: throws, loading cleared. Safety: loading off after 40s max.
   */
  async function deleteAccount() {
    if (!supabase?.auth) throw new Error("Bağlantı hazır değil.");
    setDeletingAccount(true);
    const safetyMs = 90000;
    const safetyTimer = setTimeout(() => setDeletingAccount(false), safetyMs);
    try {
      await authService.deleteAccount();
      clearTimeout(safetyTimer);
      // Sayfa yenilenmezse (WebView / aynı URL) UI kilitli kalmasın
      setDeletingAccount(false);
      // Kullanıcı sunucuda silindi; global signOut uzun sürebilir veya 401 — sadece yerel temizlik
      try {
        if (supabase?.auth?.signOut) {
          await supabase.auth.signOut({ scope: "local" });
        }
      } catch (_) {}
      await clearAllTgSupabasePreferences();
      hardResetToHome();
    } catch (e) {
      clearTimeout(safetyTimer);
      setDeletingAccount(false);
      throw e;
    }
  }

  return {
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authUsername,
    setAuthUsername,
    loginNow,
    logout,
    deleteAccount,
    deletingAccount,
    oauthLogin,
    requireAuth,
    authUserExists,
  };
}
