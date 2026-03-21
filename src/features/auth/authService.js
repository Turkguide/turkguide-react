import { supabase } from "../../supabaseClient";
import { getAuthRedirectUrl } from "../../utils/authRedirect";

/**
 * Auth Service - Supabase authentication operations
 */
export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email, password, username) {
    if (!supabase?.auth) {
      throw new Error("Supabase client hazır değil.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: {
        data: { username: username.trim() },
        emailRedirectTo: getAuthRedirectUrl() || "https://www.turkguide.net/auth/callback",
      },
    });

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    if (!supabase?.auth) {
      throw new Error("Supabase client hazır değil.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    if (!supabase?.auth) {
      return;
    }
    await supabase.auth.signOut();
  },

  /**
   * OAuth login
   */
  async signInWithOAuth(provider) {
    if (!supabase?.auth) {
      throw new Error("Supabase hazır değil.");
    }

    const redirectTo = getAuthRedirectUrl() || `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Delete account via Edge Function (supabase.functions.invoke only — same client as auth).
   * Explicit Authorization header + token refresh preflight to avoid 401 / Load failed (e.g. Apple).
   */
  async deleteAccount() {
    const DBG = "[tg:deleteAccount]";
    const timeoutMs = 75000;

    if (!supabase?.auth?.getSession || !supabase?.functions?.invoke) {
      throw new Error("Hesap silme şu an kullanılamıyor.");
    }

    const raceRefresh = (ms) =>
      Promise.race([
        supabase.auth.refreshSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("refresh_timeout")), ms)),
      ]);

    let { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (import.meta.env.DEV) {
      const s = sessionData?.session;
      console.log(DBG, {
        userId: s?.user?.id,
        hasToken: !!s?.access_token,
        expires_at: s?.expires_at,
        sessionErr: sessionErr?.message,
      });
    }
    if (sessionErr || !sessionData?.session?.access_token) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    const validateToken = async (tok) => {
      if (!tok) return false;
      try {
        const { data, error } = await supabase.auth.getUser(tok);
        return !error && !!data?.user?.id;
      } catch (_) {
        return false;
      }
    };

    const getValidatedToken = async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = sessionData?.session?.expires_at;
      const current = String(sessionData?.session?.access_token || "").trim();
      const needsRefresh = exp == null || exp <= nowSec + 150;

      if (!needsRefresh && (await validateToken(current))) return current;

      if (import.meta.env.DEV) {
        console.log(DBG, {
          action: "refreshSession_preflight",
          exp,
          nowSec,
          reason: needsRefresh ? "expiring" : "invalid_token",
        });
      }
      await raceRefresh(20000);
      const { data: refreshed } = await supabase.auth.getSession();
      const next = String(refreshed?.session?.access_token || "").trim();
      if (!next) throw new Error("Oturum yenilenemedi. Lütfen tekrar giriş yapın.");
      if (!(await validateToken(next))) {
        throw new Error("Oturum geçersiz (Invalid JWT). Lütfen çıkış yapıp tekrar giriş yapın.");
      }
      sessionData = refreshed;
      return next;
    };

    await getValidatedToken();

    const parseInvokeFailure = (invokeError, responseData, httpStatus) => {
      const body = responseData && typeof responseData === "object" ? responseData : {};
      const base =
        body?.error ??
        body?.message ??
        invokeError?.message ??
        "Hesap silinirken sunucu hatası.";
      const parts = [String(base)];
      if (body?.step) parts.push(`step=${body.step}`);
      if (body?.detail) parts.push(`detail=${body.detail}`);
      if (body?.code) parts.push(`code=${body.code}`);
      if (body?.authErrorName) parts.push(`authErrorName=${body.authErrorName}`);
      if (body?.hint) parts.push(`hint=${body.hint}`);
      if (httpStatus != null) parts.push(`http=${httpStatus}`);
      return parts.join(" · ");
    };

    const callDeleteFunction = async () => {
      console.log("Calling function: delete-my-account");
      return Promise.race([
        supabase.functions.invoke("delete-my-account"),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("İstek zaman aşımına uğradı (75s). Ağ yavaş olabilir; tekrar deneyin.")),
            timeoutMs
          )
        ),
      ]);
    };

    let { data, error } = await callDeleteFunction();

    let httpStatus =
      error?.context?.response?.status ??
      error?.status ??
      (typeof error?.context?.status === "number" ? error.context.status : undefined);

    if (import.meta.env.DEV && error) {
      console.warn(DBG, { invokeError: error, data, httpStatus });
    }

    if (httpStatus === 401 || String(error?.message || "").toLowerCase().includes("jwt")) {
      if (import.meta.env.DEV) console.log(DBG, { action: "refresh_after_401" });
      try {
        await raceRefresh(20000);
        const { data: d3 } = await supabase.auth.getSession();
        const t3 = String(d3?.session?.access_token || "").trim();
        if (t3 && (await validateToken(t3))) {
          const second = await callDeleteFunction();
          data = second.data;
          error = second.error;
          httpStatus =
            error?.context?.response?.status ??
            error?.status ??
            (typeof error?.context?.status === "number" ? error.context.status : undefined);
        }
      } catch (_) {}
    }

    if (error) {
      const errBody =
        data && typeof data === "object" && (data.error || data.step)
          ? data
          : error?.context?.body
            ? (() => {
                try {
                  return typeof error.context.body === "string" ? JSON.parse(error.context.body) : error.context.body;
                } catch (_) {
                  return {};
                }
              })()
            : data;
      const msg = parseInvokeFailure(error, errBody, httpStatus);
      const err = new Error(msg);
      err.tgStep = errBody?.step;
      err.tgDetail = errBody?.detail;
      err.tgHttpStatus = httpStatus;
      throw err;
    }

    if (data && typeof data === "object" && data.error) {
      const msg = parseInvokeFailure(null, data, data?.status);
      const err = new Error(msg);
      err.tgStep = data?.step;
      err.tgDetail = data?.detail;
      throw err;
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    if (!supabase?.auth) {
      return { session: null };
    }
    return await supabase.auth.getSession();
  },

  /**
   * Set session from tokens
   */
  async setSession(accessToken, refreshToken) {
    if (!supabase?.auth) {
      throw new Error("Supabase hazır değil.");
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Exchange code for session (OAuth PKCE)
   */
  async exchangeCodeForSession(code) {
    if (!supabase?.auth) {
      throw new Error("Supabase hazır değil.");
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    if (!supabase?.auth) {
      return { data: { subscription: null } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default authService;
