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
   * Delete account via Edge Function. Uses fetch + timeout so we get the real error from the server.
   */
  async deleteAccount() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
    const fnName = "delete-my-account";
    const timeoutMs = 25000;
    if (!supabase?.auth?.getSession) {
      throw new Error("Hesap silme şu an kullanılamıyor.");
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
    }
    if (!supabaseUrl) {
      throw new Error("Hesap silme yapılandırması eksik.");
    }
    const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${fnName}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e?.name === "AbortError") {
        throw new Error("İstek zaman aşımına uğradı. Lütfen tekrar deneyin.");
      }
      throw new Error(e?.message || "Bağlantı hatası. Lütfen ağınızı kontrol edip tekrar deneyin.");
    }
    clearTimeout(timeoutId);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body?.error ? String(body.error) : "Hesap silinirken sunucu hatası oluştu.";
      const step = body?.step ? ` (${body.step})` : "";
      throw new Error(msg + step);
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
