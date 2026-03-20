import { useEffect } from "react";
import { supabase } from "../../supabaseClient";

/**
 * Hook for handling auth callbacks (OAuth, email verification)
 */
export function useAuthCallback({ setUser, setShowAuth, setActive, setLandingSearch, setCategoryFilter }) {
  useEffect(() => {
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
              acceptedTermsAt: prev?.acceptedTermsAt ?? null,
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
