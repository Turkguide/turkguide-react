import { useMemo } from "react";
import { normalizeUsername } from "../utils/helpers";

export function useUnreadCounts({ user, dms, biz }) {
  const unreadThreadsForMe = useMemo(() => {
    if (!user) return 0;
    const me = normalizeUsername(user.username);
    const senders = new Set();

    for (const m of dms) {
      const isToUser = m.toType === "user" && normalizeUsername(m.toUsername) === me;
      const isToBiz =
        m.toType === "biz" && biz.some((b) => b.id === m.toBizId && normalizeUsername(b.ownerUsername) === me);
      if (isToUser || isToBiz) {
        const readBy = Array.isArray(m.readBy) ? m.readBy : [];
        const isRead = readBy.some((u) => normalizeUsername(u) === me);
        if (!isRead) senders.add(normalizeUsername(m.from));
      }
    }

    return senders.size;
  }, [dms, biz, user]);

  return { unreadThreadsForMe };
}
