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
   * Delete account via Edge Function.
   * Gateway 401 önlemek için fetch ile Authorization + apikey açıkça gönderiliyor (invoke bazen header iletmiyor).
   */
  async deleteAccount() {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
    const fnName = "delete-my-account";
    /** Edge Function çok adımlı silme yapıyor; 35s sık yetmez */
    const timeoutMs = 90000;

    if (!supabase?.auth?.getSession) {
      throw new Error("Hesap silme şu an kullanılamıyor.");
    }

    let { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData?.session?.access_token) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    // Apple / OAuth: süresi dolmuş veya stale JWT Edge Function'da "Invalid JWT" verir.
    // Hesap silmeden önce her zaman yenile (tek istek, güvenli token).
    try {
      await Promise.race([
        supabase.auth.refreshSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("refresh_timeout")), 12000)),
      ]);
      const after = await supabase.auth.getSession();
      if (after?.data?.session?.access_token) {
        sessionData = after.data;
      }
    } catch (_) {
      /* Eski oturumla devam; aşağıda süre kontrolü */
    }

    const exp = sessionData?.session?.expires_at;
    const nowSec = Math.floor(Date.now() / 1000);
    if (exp != null && exp <= nowSec + 120) {
      try {
        await Promise.race([
          supabase.auth.refreshSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("refresh_timeout")), 8000)),
        ]);
        const { data: d2 } = await supabase.auth.getSession();
        if (d2?.session) sessionData = d2;
      } catch (_) {}
    }

    let token = String(sessionData?.session?.access_token || "").trim();
    if (!token) {
      throw new Error("Oturum token'ı alınamadı. Lütfen tekrar giriş yapın.");
    }

    if (!supabaseUrl || !anonKey) {
      throw new Error("Hesap silme yapılandırması eksik (URL veya anon key).");
    }

    const url = `${supabaseUrl}/functions/v1/${fnName}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const doFetch = (accessToken) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

    let res;
    try {
      res = await doFetch(token);
      // 401 Invalid JWT → bir kez daha yenile ve tekrar dene (OAuth / race)
      if (res.status === 401) {
        try {
          await Promise.race([
            supabase.auth.refreshSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("refresh_timeout")), 12000)),
          ]);
          const { data: d3 } = await supabase.auth.getSession();
          const t3 = String(d3?.session?.access_token || "").trim();
          if (t3) {
            token = t3;
            res = await doFetch(token);
          }
        } catch (_) {}
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e?.name === "AbortError") {
        throw new Error("İstek zaman aşımına uğradı. Lütfen tekrar deneyin.");
      }
      throw new Error("Bağlantı hatası: " + (e?.message || "tekrar deneyin."));
    }
    clearTimeout(timeoutId);

    const raw = await res.text().catch(() => "");
    let body = {};
    try {
      if (raw?.trim().startsWith("{")) body = JSON.parse(raw);
    } catch (_) {}

    if (!res.ok) {
      let msg = body?.error ?? body?.message ?? "Hesap silinirken sunucu hatası.";
      if (body?.step) msg += " [" + body.step + "]";
      if (res.status === 401 && /invalid|expired|jwt|token|missing|authorization/i.test(msg)) {
        msg += " Çıkış yapıp tekrar giriş yapın, ardından hesap silmeyi tekrar deneyin.";
      }
      throw new Error(msg);
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
