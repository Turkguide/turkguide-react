import { useState } from "react";
import { authService } from "./authService";
import { KEY } from "../../constants";

/**
 * Hook for authentication operations
 */
export function useAuth({ user, setUser, setShowAuth, setShowRegister, setActive, setShowSettings, setShowBizApply, setProfileOpen, setProfileTarget, setShowEditUser, setEditUserCtx, setShowDm, setDmTarget, setDmText, setShowAppt, setApptBizId, setApptMsg }) {
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");

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
      localStorage.removeItem("tg_active_tab_v1");
    } catch (_) {}

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
      localStorage.setItem("tg_active_tab_v1", "biz");
    } catch (_) {}

    try {
      window.history.replaceState({}, document.title, "/");
    } catch (_) {}

    try {
      window.location.replace("/");
    } catch (_) {
      window.location.href = "/";
    }
  }

  /**
   * Require authentication - shows auth modal if not logged in
   */
  function requireAuth(options = {}) {
    if (!user) {
      setShowAuth(true);
      return false;
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
  async function loginNow(provider = "email", mode = "login") {
    try {
      const email = String(authEmail || "").trim().toLowerCase();
      const pass = String(authPassword || "").trim();
      const username = String(authUsername || "").trim();

      // 2) REGISTER
      if (mode === "register") {
        if (!email || !pass || !username) {
          alert("Email, şifre ve kullanıcı adı zorunlu.");
          return;
        }

        const data = await authService.signUp(email, pass, username);
        console.log("✅ signUp ok:", data);

        // Confirm email açıksa: session null gelir, bu normal
        if (!data?.session) {
          alert("Kayıt alındı. Email doğrulama linki gönderildi. Linke tıklayıp doğrula.");
          // ✅ Kayıt sonrası ana sayfa: İşletmeler
          setActive("biz");
          try {
            localStorage.setItem("tg_active_tab_v1", "biz");
          } catch (_) {}
          setShowAuth(true); // doğrulama için modal açık kalsın
        } else {
          alert("Kayıt alındı ve giriş yapıldı.");
          setUser({
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
          });
          // ✅ Login olduysa da ana sayfa: İşletmeler
          setActive("biz");
          try {
            localStorage.setItem("tg_active_tab_v1", "biz");
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
        console.log("✅ login ok:", data);

        setUser({
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
        });

        // ✅ Login sonrası ana sayfa: İşletmeler
        setActive("biz");
        try {
          localStorage.setItem("tg_active_tab_v1", "biz");
        } catch (_) {}

        setShowAuth(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthUsername("");
        return;
      }

      alert("Geçersiz işlem.");
    } catch (e) {
      console.error("💥 loginNow crash:", e);
      alert(e?.message || "Load failed");
    }
  }

  /**
   * Logout
   */
  async function logout() {
    console.log("✅ logout() clicked");
    try {
      await authService.signOut();
    } catch (e) {
      console.log("❌ logout() catch", e);
      console.error("logout error:", e);
    } finally {
      hardResetToHome();
    }
  }

  /**
   * Delete account
   */
  async function deleteAccount() {
    console.log("✅ deleteAccount() clicked", { user });
    const ok = confirm("Hesabın kalıcı olarak silinecek. Emin misin?");
    console.log("✅ deleteAccount() confirm result:", ok);
    if (!ok) return;

    try {
      await authService.deleteAccount();
      alert("Hesabın silindi.");
      hardResetToHome();
      return;
    } catch (e) {
      console.log("❌ deleteAccount() catch", e);
      console.error("delete account error:", e);
      const detail = e?.message || e?.error_description || "";
      alert(`Hesap silinirken hata oluştu.${detail ? `\n${detail}` : ""}`);
      hardResetToHome();
    }
  }

  /**
   * OAuth login
   */
  async function oauthLogin(provider) {
    try {
      await authService.signInWithOAuth(provider);
    } catch (e) {
      console.error("💥 oauthLogin crash:", e);
      alert(e?.message || "OAuth giriş hatası");
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
    oauthLogin,
    requireAuth,
    authUserExists,
  };
}
