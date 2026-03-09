import { supabase } from "../../supabaseClient";

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
        emailRedirectTo: "https://www.turkguide.net/auth/callback",
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

    const redirectTo = `${window.location.origin}/auth/callback`;
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
   * Uses direct fetch() with Authorization + apikey so it works reliably (invoke was timing out).
   * Apple requires working account deletion.
   */
  async deleteAccount() {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
    const fnName = "delete-my-account";
    const timeoutMs = 35000;

    if (!supabase?.auth?.getSession) {
      throw new Error("Hesap silme şu an kullanılamıyor.");
    }
    const { data: sessionData } = await supabase.auth.getSession();
    let token = sessionData?.session?.access_token;
    if (!token) {
      await supabase.auth.refreshSession();
      const { data: after } = await supabase.auth.getSession();
      token = after?.session?.access_token;
    }
    if (!token || typeof token !== "string") {
      throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
    }
    if (!supabaseUrl || !anonKey) {
      throw new Error("Hesap silme yapılandırması eksik.");
    }

    const url = `${supabaseUrl}/functions/v1/${fnName}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
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
      const msg = body?.error ?? body?.message ?? "Hesap silinirken sunucu hatası.";
      const step = body?.step ? " (" + body.step + ")" : "";
      throw new Error(String(msg) + step);
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
