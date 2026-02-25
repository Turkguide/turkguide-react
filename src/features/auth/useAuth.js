import { useState } from "react";
import { authService } from "./authService";
import { KEY } from "../../constants";
import { supabase } from "../../supabaseClient";
import { normalizeUsername } from "../../utils/helpers";

/**
 * Hook for authentication operations
 */
export function useAuth({ user, setUser, setShowAuth, setShowRegister, setShowTermsGate, setTermsChecked, setActive, setShowSettings, setShowBizApply, setProfileOpen, setProfileTarget, setShowEditUser, setEditUserCtx, setShowDm, setDmTarget, setDmText, setShowAppt, setApptBizId, setApptMsg }) {
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
      sessionStorage.removeItem("tg_active_tab_v1");
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
      sessionStorage.setItem("tg_active_tab_v1", "biz");
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
    if (user?.bannedAt) {
      alert("Hesabın askıya alındı. Destek için bize ulaş.");
      return false;
    }
    if (options.requireTerms && !user?.acceptedTermsAt) {
      if (setShowTermsGate) setShowTermsGate(true);
      if (setTermsChecked) setTermsChecked(false);
      try {
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("tg:requestTermsGate"));
        }
      } catch (_) {}
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
  async function loginNow(provider = "email", mode = "login", options = {}) {
    try {
      const email = String(authEmail || "").trim().toLowerCase();
      const pass = String(authPassword || "").trim();
      const username = String(authUsername || "").trim();
      const unameKey = normalizeUsername(username);

      // 2) REGISTER
      if (mode === "register") {
        if (options.termsAccepted !== true) {
          alert("Devam etmek için Kullanım Şartları ve Gizlilik Politikası'nı kabul etmelisiniz.");
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
            console.warn("email availability check error:", emailErr);
            // Fallback to Supabase Auth unique email check
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
            console.warn("username availability check error:", error);
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
          console.log("✅ signUp ok:", data);
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
          const userId = data.user.id;
          let acceptedTermsAt = null;
          if (options.termsAccepted === true) {
            acceptedTermsAt = new Date().toISOString();
            try {
              await supabase.from("profiles").update({ accepted_terms_at: acceptedTermsAt }).eq("id", userId);
              try {
                await supabase.from("users").update({ termsAccepted: true, accepted_terms_at: acceptedTermsAt }).eq("id", userId);
              } catch (_) {}
            } catch (_) {}
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
              acceptedTermsAt: acceptedTermsAt ?? prev?.acceptedTermsAt ?? null,
            };
            if (prev?.id === data.user.id) {
              next.bannedAt = prev.bannedAt ?? null;
            }
            return next;
          });
          if (setTermsChecked) setTermsChecked(true);
          // ✅ Login olduysa da ana sayfa: İşletmeler
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
        console.log("✅ login ok:", data);

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
            next.acceptedTermsAt = prev.acceptedTermsAt ?? null;
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
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("signOut timeout")), 800)
      );
      await Promise.race([authService.signOut(), timeout]);
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
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("deleteAccount timeout")), 1500)
      );
      await Promise.race([authService.deleteAccount(), timeout]);
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
