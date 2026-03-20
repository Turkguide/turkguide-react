import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useHubLifecycle({ active, hub }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!supabase?.auth?.refreshSession) return;
      Promise.resolve(supabase.auth.refreshSession())
        .then(() => {
          if (active === "hub" && hub?.fetchHubPosts) hub.fetchHubPosts();
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, hub]);

  useEffect(() => {
    if (!hub || !hub.fetchHubPosts) return;
    let channel = null;

    if (active === "hub") {
      Promise.resolve(hub.fetchHubPosts()).catch((e) => console.error("fetchHubPosts error:", e));
      if (supabase?.channel) {
        channel = supabase
          .channel("realtime:hub_posts")
          .on("postgres_changes", { event: "*", schema: "public", table: "hub_posts" }, () => {
            Promise.resolve(hub.fetchHubPosts()).catch((e) => console.error("fetchHubPosts error:", e));
          })
          .subscribe();
      }
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (_ignored) {}
    };
  }, [active, hub]);
}
