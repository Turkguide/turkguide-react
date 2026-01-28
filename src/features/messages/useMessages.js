import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { now, uid, normalizeUsername } from "../../utils/helpers";

/**
 * Hook for Messages/DM operations
 */
export function useMessages({ user, dms, setDms, settings, requireAuth }) {
  const [showDm, setShowDm] = useState(false);
  const [dmTarget, setDmTarget] = useState(null);
  const [dmText, setDmText] = useState("");

  /**
   * Open DM to user
   */
  function openDmToUser(username) {
    if (!requireAuth({ requireVerified: true })) return false;
    if (!settings.chatEnabled) {
      alert("Mesajlar şu anda kapalı.");
      return false;
    }
    setDmTarget({ type: "user", username });
    setDmText("");
    setShowDm(true);
    return true;
  }

  /**
   * Open DM to business
   */
  function openDmToBiz(bizId) {
    if (!requireAuth({ requireVerified: true })) return false;
    if (!settings.chatEnabled) {
      alert("Mesajlar şu anda kapalı.");
      return false;
    }
    setDmTarget({ type: "biz", bizId });
    setDmText("");
    setShowDm(true);
    return true;
  }

  /**
   * Send DM
   */
  async function sendDm() {
    if (!requireAuth({ requireVerified: true })) return;
    if (!settings.chatEnabled) {
      alert("Mesajlar şu anda kapalı.");
      return;
    }

    const text = String(dmText || "").trim();
    if (!text) return;

    const msg = {
      id: uid(),
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
  function markThreadRead(target) {
    if (!user || !target) return;
    const me = normalizeUsername(user.username);
    setDms((prev) =>
      prev.map((m) => {
        const isToUser =
          target.type === "user" &&
          m.toType === "user" &&
          normalizeUsername(m.toUsername) === normalizeUsername(target.username);
        const isToBiz = target.type === "biz" && m.toType === "biz" && m.toBizId === target.bizId;
        if (!(isToUser || isToBiz)) return m;
        const readBy = new Set((m.readBy || []).map(normalizeUsername));
        readBy.add(me);
        return { ...m, readBy: Array.from(readBy) };
      })
    );
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
