import { useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { DEFAULT_ADMINS, DEFAULT_ADMIN_EMAILS } from "../../constants";
import { normalizeUsername } from "../../utils/helpers";

/**
 * Hook for handling auth callbacks (OAuth, email verification)
 */
export function useAuthCallback({ setUser, setShowAuth, setActive, setLandingSearch, setCategoryFilter }) {
  useEffect(() => {
    const OAUTH_TERMS_KEY = "tg_oauth_terms_accepted_v1";

    const isAdminIdentity = (u) => {
      const email = String(u?.email || "").trim().toLowerCase();
      const uname = normalizeUsername(String(u?.user_metadata?.username || ""));
      return DEFAULT_ADMIN_EMAILS.includes(email) || DEFAULT_ADMINS.includes(uname);
    };

    async function persistOrValidateTerms(session) {
      const uid = session?.user?.id;
      if (!uid || !supabase?.from) return true;
      if (isAdminIdentity(session.user)) return true;
      const marker = localStorage.getItem(OAUTH_TERMS_KEY);
      if (marker === "1") {
        const acceptedAt = new Date().toISOString();
        const email = String(session.user.email || "").trim() || `${uid}@apple.placeholder`;
        const uname = normalizeUsername(
          String(session.user.user_metadata?.username || "").trim() || `user_${String(uid).slice(0, 8)}`
        );
        const { error } = await supabase.from("profiles").upsert(
          { id: uid, email, username: uname, accepted_terms_at: acceptedAt },
          { onConflict: "id" }
        );
        localStorage.removeItem(OAUTH_TERMS_KEY);
        if (error) {
          alert("Kullanım şartı kaydı tamamlanamadı. Lütfen tekrar giriş yapın.");
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          return false;
        }
        return true;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("accepted_terms_at")
        .eq("id", uid)
        .maybeSingle();
      if (error || !data?.accepted_terms_at) {
        alert("Kullanım Şartları kabul edilmeden Apple girişi tamamlanamaz.");
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        return false;
      }
      return true;
    }

    const run = async () => {
      try {
        if (!supabase?.auth) return;

        // 0) OAuth errors can arrive via querystring (e.g. /auth/callback?error=...)
        const qs = new URLSearchParams(window.location.search || "");
        const qErr = qs.get("error");
        const qCode = qs.get("error_code");
        const qDesc = qs.get("error_description");

        if (qErr || qCode || qDesc) {
          const msg = decodeURIComponent(
            qDesc ||
              (qCode === "unexpected_failure"
                ? "OAuth girişinde beklenmeyen bir hata oluştu. (Unable to exchange external code)"
                : "OAuth girişinde hata oluştu.")
          );

          alert(msg);

          // Clean URL (remove query + hash) to avoid stuck half-state
          window.history.replaceState({}, document.title, window.location.pathname);

          // Reset UI to home
          setShowAuth(true);
          setActive("biz");
          setLandingSearch("");
          setCategoryFilter("");
          try {
            sessionStorage.setItem("tg_active_tab_v1", "biz");
          } catch (_) {}
          window.scrollTo({ top: 0, behavior: "auto" });
          return;
        }

        // ✅ Hash normalize: "#auth%23access_token" / "#auth#access_token" -> "#access_token"
        const rawHash = window.location.hash || "";
        const normalizedHash = rawHash.replace("#auth%23", "#").replace("#auth#", "#");

        // 1) HASH (#access_token / #error / otp_expired vs)
        const hash = normalizedHash.startsWith("#") ? normalizedHash.slice(1) : normalizedHash;
        const hp = new URLSearchParams(hash);

        // Hash error handling
        const codeErr = hp.get("error_code");
        const descErr = hp.get("error_description");
        const hasErr = hp.get("error") || descErr || codeErr;

        if (hasErr) {
          const msg =
            descErr ||
            (codeErr === "otp_expired"
              ? "Email doğrulama linki süresi dolmuş veya daha önce kullanılmış."
              : "Email doğrulama sırasında hata oluştu.");

          alert(decodeURIComponent(msg));

          // hash'i temizle ama path'i koru
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          return;
        }

        // Hash session handling
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });

          if (error) {
            console.error("❌ setSession error:", error);
            alert(error.message || "Email doğrulama sırasında hata oluştu.");
            return;
          }

          // hash'i temizle
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

          const { data: sData } = await supabase.auth.getSession();
          if (sData?.session) {
            const ok = await persistOrValidateTerms(sData.session);
            if (!ok) return;
          }

        }

        // 2) ?code=... (PKCE / OAuth)
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("❌ exchangeCodeForSession error:", error);
            alert(error.message || "Giriş tamamlanamadı. Lütfen tekrar deneyin.");
            return;
          }

          // ✅ URL temizle: code/state kalksın ama PATH kalsın
          url.searchParams.delete("code");
          url.searchParams.delete("state");

          window.history.replaceState(
            {},
            document.title,
            url.pathname + (url.search ? `?${url.searchParams.toString()}` : "") + url.hash
          );

          // ✅ UI state: login modal kapansın (beyaz ekranda kalma hissini keser)
          setShowAuth(false);

          // ✅ Session'ı okuyup user state'i tetikle (listener bazen geç kalıyor)
          const session = data?.session || (await supabase.auth.getSession()).data.session;
          if (session?.user) {
            const ok = await persistOrValidateTerms(session);
            if (!ok) return;
            const md = session.user.user_metadata || {};
            setUser((prev) => ({
              ...(prev || {}),
              id: session.user.id,
              email: session.user.email,
              username: md.username ?? prev?.username ?? null,
              avatar: md.avatar ?? prev?.avatar ?? "",
              Tier: md.Tier ?? prev?.Tier ?? "Onaylı",
              XP: Number(md.XP ?? md.xp ?? prev?.XP ?? 0),
              createdAt: md.createdAt ?? prev?.createdAt ?? null,
              age: md.age ?? prev?.age ?? "",
              city: md.city ?? prev?.city ?? "",
              state: md.state ?? prev?.state ?? "",
              bio: md.bio ?? prev?.bio ?? "",
              bannedAt: prev?.bannedAt ?? null,
            }));
          }
        }
      } catch (e) {
        console.error("❌ auth callback error:", e);
      }
    };

    run();
  }, [setUser, setShowAuth, setActive, setLandingSearch, setCategoryFilter]);
}
