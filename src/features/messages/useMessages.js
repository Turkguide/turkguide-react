import { useState } from "react";
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
    if (!requireAuth()) return;
    if (!settings.chatEnabled) return;
    setDmTarget({ type: "user", username });
    setDmText("");
    setShowDm(true);
  }

  /**
   * Open DM to business
   */
  function openDmToBiz(bizId) {
    if (!requireAuth()) return;
    if (!settings.chatEnabled) return;
    setDmTarget({ type: "biz", bizId });
    setDmText("");
    setShowDm(true);
  }

  /**
   * Send DM
   */
  function sendDm() {
    if (!requireAuth()) return;
    if (!settings.chatEnabled) return;

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

    setDms((prev) => [msg, ...prev]);
    setDmText("");
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
