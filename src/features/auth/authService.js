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
   * Uses supabase.functions.invoke() so the client attaches the session (Authorization) automatically.
   * Logs session and full invoke result for debugging. Surfaces exact server error when available.
   */
  async deleteAccount() {
    const fnName = "delete-my-account";
    const timeoutMs = 25000;
    const log = (label, obj) => {
      console.log("[deleteAccount] " + label, obj);
    };

    if (!supabase?.auth?.getSession) {
      throw new Error("Hesap silme şu an kullanılamıyor.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    log("1 getSession result", {
      hasSession: !!sessionData?.session,
      sessionExists: !!sessionData?.session,
      userId: sessionData?.session?.user?.id ?? null,
      accessTokenLength: sessionData?.session?.access_token?.length ?? 0,
      sessionError: sessionError?.message ?? null,
    });
    if (!sessionData?.session) {
      throw new Error("Oturum yok. getSession() session boş. Lütfen tekrar giriş yapın.");
    }
    if (!sessionData.session.access_token) {
      throw new Error("Oturum var ama access_token yok. Lütfen çıkış yapıp tekrar giriş yapın.");
    }

    await supabase.auth.refreshSession();
    const { data: afterRefresh } = await supabase.auth.getSession();
    if (!afterRefresh?.session?.access_token) {
      throw new Error("Refresh sonrası oturum/token yok. Lütfen tekrar giriş yapın.");
    }
    log("2 before invoke", {
      sessionAvailableAtInvoke: true,
      userId: afterRefresh.session?.user?.id,
      aboutToInvoke: fnName,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("İstek zaman aşımına uğradı. Lütfen tekrar deneyin.")), timeoutMs)
    );
    const invokePromise = supabase.functions.invoke(fnName, { method: "POST" });

    let result;
    try {
      result = await Promise.race([invokePromise, timeoutPromise]);
    } catch (e) {
      log("3 invoke threw (transport/timeout)", { message: e?.message, name: e?.name });
      if (e?.message?.includes("zaman aşımı")) throw e;
      throw new Error("İstek hatası (ağ/zaman aşımı): " + (e?.message || String(e)));
    }

    log("4 invoke full result", {
      hasData: !!result?.data,
      hasError: !!result?.error,
      dataKeys: result?.data ? Object.keys(result.data) : [],
      errorMessage: result?.error?.message ?? null,
      errorName: result?.error?.name ?? null,
      errorContextType: result?.error?.context ? typeof result.error.context : null,
    });

    const { data, error } = result ?? {};
    if (error) {
      let serverBody = null;
      try {
        const ctx = error.context;
        if (ctx && typeof ctx.json === "function") {
          serverBody = await ctx.json();
          log("5 error.context.json()", serverBody);
        } else if (ctx && typeof ctx.text === "function") {
          const raw = await ctx.text();
          log("5 error.context.text() raw", raw?.slice(0, 500));
          serverBody = raw?.trim().startsWith("{") ? JSON.parse(raw) : null;
        }
      } catch (parseErr) {
        log("5 error.context parse failed", parseErr?.message);
      }

      const msg = serverBody?.error != null ? String(serverBody.error) : (serverBody?.message != null ? String(serverBody.message) : (error?.message || "Hesap silinirken sunucu hatası oluştu."));
      const step = serverBody?.step ? " [Adım: " + serverBody.step + "]" : "";
      const fullMsg = msg + step;
      throw new Error(fullMsg);
    }
    if (data && data.ok !== true && (data.error || data.message)) {
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
