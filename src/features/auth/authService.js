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
   * Delete account via Edge Function (fetch + Authorization + apikey).
   * Yalnızca access token süresi dolmak üzereyse refreshSession; gereksiz 12s bekleme yok.
   */
  async deleteAccount() {
    const DBG = "[tg:deleteAccount]";
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
    const fnName = "";
    const timeoutMs = 75000;

    if (!supabase?.auth?.getSession) {
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
      console.log(DBG, { userId: s?.user?.id, hasToken: !!s?.access_token, expires_at: s?.expires_at, sessionErr: sessionErr?.message });
    }
    if (sessionErr || !sessionData?.session?.access_token) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    const validateToken = async (token) => {
      if (!token) return false;
      try {
        const { data, error } = await supabase.auth.getUser(token);
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
        console.log(DBG, { action: "refreshSession_preflight", exp, nowSec, reason: needsRefresh ? "expiring" : "invalid_token" });
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

    let token = await getValidatedToken();

    if (!supabaseUrl || !anonKey) {
      throw new Error("Hesap silme yapılandırması eksik (URL veya anon key).");
    }

    const url = `${supabaseUrl}/functions/v1/${fnName}`;

    const doFetch = (accessToken, signal) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
        body: JSON.stringify({}),
        signal,
      });

    const parseError = (res, body) => {
      const base = body?.error ?? body?.message ?? "Hesap silinirken sunucu hatası.";
      const parts = [base];
      if (body?.step) parts.push(`step=${body.step}`);
      if (body?.detail) parts.push(`detail=${body.detail}`);
      if (body?.code) parts.push(`code=${body.code}`);
      if (body?.authErrorName) parts.push(`authErrorName=${body.authErrorName}`);
      if (body?.hint) parts.push(`hint=${body.hint}`);
      parts.push(`http=${res.status}`);
      return parts.join(" · ");
    };

    const runOnce = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      let res;
      try {
        res = await doFetch(token, controller.signal);
      } catch (e) {
        clearTimeout(timeoutId);
        if (e?.name === "AbortError") {
          throw new Error("İstek zaman aşımına uğradı (75s). Ağ yavaş olabilir; tekrar deneyin.");
        }
        throw new Error("Bağlantı hatası: " + (e?.message || "tekrar deneyin."));
      }
      clearTimeout(timeoutId);
      const raw = await res.text().catch(() => "");
      let body = {};
      try {
        if (raw?.trim().startsWith("{")) body = JSON.parse(raw);
      } catch (_) {}

      if (import.meta.env.DEV && !res.ok) {
        console.warn(DBG, { status: res.status, body, rawPreview: raw?.slice?.(0, 400) });
      }

      return { res, body, raw };
    };

    let { res, body } = await runOnce();

    if (res.status === 401) {
      if (import.meta.env.DEV) console.log(DBG, { action: "refresh_after_401" });
      try {
        await raceRefresh(20000);
        const { data: d3 } = await supabase.auth.getSession();
        const t3 = String(d3?.session?.access_token || "").trim();
        if (t3 && (await validateToken(t3))) {
          token = t3;
          const second = await runOnce();
          res = second.res;
          body = second.body;
        }
      } catch (_) {}
    }

    if (!res.ok) {
      let msg = parseError(res, body);
      if (res.status === 401 && !body?.detail) {
        msg += " · Oturum yenilenemedi; bir kez daha deneyin.";
      }
      const err = new Error(msg);
      err.tgStep = body?.step;
      err.tgDetail = body?.detail;
      err.tgHttpStatus = res.status;
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
