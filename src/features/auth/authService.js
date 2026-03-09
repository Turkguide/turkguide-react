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
   * Uses supabase.functions.invoke() with explicit Authorization header so the gateway receives the Bearer token.
   */
  async deleteAccount() {
    const fnName = "delete-my-account";
    const timeoutMs = 35000;

    if (!supabase?.auth?.getSession) {
      throw new Error("Hesap silme şu an kullanılamıyor.");
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }
    await supabase.auth.refreshSession();
    const { data: afterRefresh } = await supabase.auth.getSession();
    if (!afterRefresh?.session?.access_token) {
      throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
    }
    const token = afterRefresh.session.access_token;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("İstek zaman aşımına uğradı. Lütfen tekrar deneyin.")), timeoutMs)
    );
    const invokePromise = supabase.functions.invoke(fnName, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let result;
    try {
      result = await Promise.race([invokePromise, timeoutPromise]);
    } catch (e) {
      if (e?.message?.includes("zaman aşımı")) throw e;
      throw new Error("Bağlantı hatası: " + (e?.message || "tekrar deneyin."));
    }

    const { data, error } = result ?? {};
    if (error) {
      let msg = error?.message ?? "Hesap silinirken sunucu hatası.";
      try {
        const ctx = error.context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) msg = String(body.error);
          if (body?.step) msg += " [" + body.step + "]";
        } else if (ctx && typeof ctx.text === "function") {
          const raw = await ctx.text();
          const body = raw?.trim().startsWith("{") ? JSON.parse(raw) : {};
          if (body?.error) msg = String(body.error);
          if (body?.step) msg += " [" + body.step + "]";
        }
      } catch (_) {}
      if (/invalid|expired|jwt|token|missing|authorization/i.test(msg)) {
        msg += " Çıkış yapıp tekrar giriş yapın, ardından hesap silmeyi tekrar deneyin.";
      }
      throw new Error(msg);
    }
    if (data && data.ok !== true && (data?.error || data?.message)) {
      throw new Error(data.error || data.message || "Hesap silinirken hata oluştu.");
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
