import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { now, uid, normalizeUsername } from "../../utils/helpers";

/**
 * Hook for Messages/DM operations
 */
export function useMessages({ user, dms, setDms, settings, requireAuth, blockedIds = [], blockedByIds = [] }) {
  const [showDm, setShowDm] = useState(false);
  const [dmTarget, setDmTarget] = useState(null);
  const [dmText, setDmText] = useState("");

  /**
   * Open DM to user
   */
  function openDmToUser(username) {
    if (!requireAuth({ requireVerified: true, requireTerms: true })) return false;
    if (Array.isArray(blockedByIds) && blockedByIds.length > 0) {
      const blockedMe = blockedByIds.includes(username);
      if (blockedMe) {
        alert("Bu kullanıcı size mesaj göndermeyi engelledi.");
        return false;
      }
    }
    if (Array.isArray(blockedIds) && blockedIds.length > 0) {
      const iBlocked = blockedIds.includes(username);
      if (iBlocked) {
        alert("Engellediğin kullanıcılara mesaj gönderemezsin.");
        return false;
      }
    }
    if (!settings.chatEnabled) {
      alert("Mesajlar şu anda kapalı.");
      return false;
    }
    setDmTarget({ type: "user", username });
    setDmText("");
    setShowDm(true);
    markThreadRead({ type: "user", username });
    return true;
  }

  /**
   * Open DM to business
   */
  function openDmToBiz(bizId) {
    if (!requireAuth({ requireVerified: true, requireTerms: true })) return false;
    if (!settings.chatEnabled) {
      alert("Mesajlar şu anda kapalı.");
      return false;
    }
    setDmTarget({ type: "biz", bizId });
    setDmText("");
    setShowDm(true);
    markThreadRead({ type: "biz", bizId });
    return true;
  }

  /**
   * Send DM
   */
  async function sendDm() {
    if (!requireAuth({ requireVerified: true, requireTerms: true })) return;
    if (dmTarget?.type === "user") {
      if (Array.isArray(blockedByIds) && blockedByIds.includes(dmTarget.username)) {
        alert("Bu kullanıcı size mesaj göndermeyi engelledi.");
        return;
      }
      if (Array.isArray(blockedIds) && blockedIds.includes(dmTarget.username)) {
        alert("Engellediğin kullanıcılara mesaj gönderemezsin.");
        return;
      }
    }
    if (!settings.chatEnabled) {
      alert("Mesajlar şu anda kapalı.");
      return;
    }

    const text = String(dmText || "").trim();
    if (!text) return;

    let msgId = uid();
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        msgId = crypto.randomUUID();
      }
    } catch (_) {}
    const msg = {
      id: msgId,
      createdAt: now(),
      from: user.username,
      toType: dmTarget?.type,
      toUsername: dmTarget?.type === "user" ? dmTarget.username : null,
      toBizId: dmTarget?.type === "biz" ? dmTarget.bizId : null,
      text,
      readBy: [],
    };

    // Optimistic UI update
    setDms((prev) => [msg, ...prev]);
    setDmText("");

    // Save to Supabase
    try {
      if (supabase?.from) {
        const fullPayload = {
          id: msg.id,
          created_at: new Date(msg.createdAt).toISOString(),
          from_username: msg.from,
          to_type: msg.toType,
          to_username: msg.toUsername,
          to_biz_id: msg.toBizId,
          text: msg.text,
          read_by: msg.readBy,
        };

        const { error } = await supabase.from("dms").insert([fullPayload]);
        if (error) {
          const isColumnMismatch =
            String(error.message || "").includes("column") ||
            String(error.message || "").includes("does not exist") ||
            String(error.code || "") === "42703";

          if (isColumnMismatch) {
            const minimalPayload = {
              id: msg.id,
              created_at: new Date(msg.createdAt).toISOString(),
              from_username: msg.from,
              to_username: msg.toUsername,
              text: msg.text,
            };
            const { error: retryError } = await supabase.from("dms").insert([minimalPayload]);
            if (!retryError) return;
            console.error("sendDm retry error:", retryError);
          } else {
            console.error("sendDm DB error:", error);
          }

          // Revert optimistic update on error
          setDms((prev) => prev.filter((m) => m.id !== msg.id));
          alert("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
          return;
        }
      }
    } catch (e) {
      console.error("sendDm exception:", e);
      // Revert optimistic update on error
      setDms((prev) => prev.filter((m) => m.id !== msg.id));
      alert("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    }
  }

  /**
   * Mark thread as read
   */
  async function markThreadRead(target) {
    if (!user || !target) return;
    const me = normalizeUsername(user.username);
    setDms((prev) =>
      prev.map((m) => {
        const isToUser =
          target.type === "user" &&
          m.toType === "user" &&
          (normalizeUsername(m.toUsername) === normalizeUsername(target.username) ||
            normalizeUsername(m.from) === normalizeUsername(target.username));
        const isToBiz = target.type === "biz" && m.toType === "biz" && m.toBizId === target.bizId;
        if (!(isToUser || isToBiz)) return m;
        const readBy = new Set((m.readBy || []).map(normalizeUsername));
        readBy.add(me);
        return { ...m, readBy: Array.from(readBy) };
      })
    );

    if (!supabase?.from || !me) return;

    try {
      let query = supabase.from("dms").select("id, read_by");

      if (target.type === "user") {
        const other = normalizeUsername(target.username);
        if (!other) return;
        query = query
          .eq("to_type", "user")
          .or(
            `and(from_username.ilike.${me},to_username.ilike.${other}),and(from_username.ilike.${other},to_username.ilike.${me})`
          );
      } else {
        query = query.eq("to_type", "biz").eq("to_biz_id", target.bizId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("markThreadRead fetch error:", error);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      for (const row of rows) {
        const readBy = new Set((row.read_by || []).map(normalizeUsername));
        if (readBy.has(me)) continue;
        readBy.add(me);
        const { error: updErr } = await supabase
          .from("dms")
          .update({ read_by: Array.from(readBy) })
          .eq("id", row.id);
        if (updErr) {
          console.error("markThreadRead update error:", updErr);
        }
      }
    } catch (e) {
      console.error("markThreadRead exception:", e);
    }
  }

  return {
    // State
    showDm,
    setShowDm,
    dmTarget,
    setDmTarget,
    dmText,
    setDmText,
    // Functions
    openDmToUser,
    openDmToBiz,
    sendDm,
    markThreadRead,
  };
}
