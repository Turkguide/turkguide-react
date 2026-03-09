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
   * Delete account via Edge Function (service role deletes all user data + auth user).
   * Caller must clear session / redirect on success; on failure throws with server message when available.
   * Uses invoke first; if "Failed to send" (CORS/network), retries via fetch with session.
   */
  async deleteAccount() {
    if (!supabase?.functions?.invoke) {
      throw new Error("Hesap silme şu an kullanılamıyor.");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
    const fnName = "delete-my-account";
    if (import.meta.env.DEV) {
      console.log("[deleteAccount] before invoke", { fnName, hasUrl: !!supabaseUrl, urlOrigin: supabaseUrl ? new URL(supabaseUrl).origin : null });
    }

    let data = null;
    let error = null;

    try {
      const result = await supabase.functions.invoke(fnName, { method: "POST" });
      data = result?.data ?? null;
      error = result?.error ?? null;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("[deleteAccount] invoke threw", e?.message, e);
      }
      throw e;
    }

    if (import.meta.env.DEV && (data || error)) {
      console.log("[deleteAccount] after invoke", { hasData: !!data, dataError: data?.error, errorMessage: error?.message });
    }

    if (data?.error) {
      const step = data.step ? ` [${data.step}]` : "";
      throw new Error(String(data.error) + step);
    }
    if (error) {
      const msg = error?.message || "";
      if (msg.includes("Failed to send") && supabaseUrl) {
        try {
          const session = (await supabase.auth.getSession())?.data?.session;
          if (session?.access_token) {
            const fnUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${fnName}`;
            if (import.meta.env.DEV) console.log("[deleteAccount] retry via fetch", fnUrl);
            const res = await fetch(fnUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({}),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(body?.error ? String(body.error) + (body.step ? ` [${body.step}]` : "") : `HTTP ${res.status}`);
            }
            return;
          }
        } catch (fetchErr) {
          if (import.meta.env.DEV) console.error("[deleteAccount] fetch fallback failed", fetchErr);
          throw fetchErr?.message ? new Error(fetchErr.message) : fetchErr;
        }
      }
      if (error?.context && typeof error.context?.json === "function") {
        try {
          const body = await error.context.json();
          if (body?.error) {
            const step = body.step ? ` [${body.step}]` : "";
            throw new Error(String(body.error) + step);
          }
        } catch (e) {
          if (e?.message && e.message !== error.message) throw e;
        }
      }
      throw error;
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
