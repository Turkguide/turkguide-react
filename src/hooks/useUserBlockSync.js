import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useUserBlockSync({ userId, users, setBlockedUsernames, setBlockedByUsernames }) {
  useEffect(() => {
    if (!userId || !supabase?.from) return;
    let cancelled = false;

    async function fetchBlocks() {
      try {
        const { data, error } = await supabase
          .from("user_blocks")
          .select("blocker_id, blocked_id")
          .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
          .limit(500);
        if (error) throw error;
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : [];
        const blockedIds = rows.filter((r) => r.blocker_id === userId).map((r) => r.blocked_id);
        const blockedByIds = rows.filter((r) => r.blocked_id === userId).map((r) => r.blocker_id);
        const idToUsername = new Map((users || []).map((u) => [String(u.id), u.username]));
        setBlockedUsernames(blockedIds.map((id) => idToUsername.get(String(id)) || String(id)));
        setBlockedByUsernames(blockedByIds.map((id) => idToUsername.get(String(id)) || String(id)));
      } catch (e) {
        console.warn("fetchBlocks error:", e);
      }
    }

    fetchBlocks();
    return () => {
      cancelled = true;
    };
  }, [userId, users, setBlockedUsernames, setBlockedByUsernames]);
}
