import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { normalizeUsername } from "../../utils/helpers";

/**
 * Hook for Notifications operations
 */
export function useNotifications({ user, booted }) {
  const isDev = import.meta.env.DEV;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);

  /**
   * Fetch notifications from Supabase
   */
  async function fetchNotifications() {
    if (!user || !booted) return;
    if (!supabase?.from) return;

    setLoading(true);
    try {
      const me = normalizeUsername(user.username);
      if (!me) {
        setLoading(false);
        return;
      }
      if (isDev) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0edbb5eb-9e7b-4f66-bfe6-5ae18010d80e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'useNotifications.js:27',message:'fetchNotifications start',data:{hasUser:!!user?.username,me},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .ilike("to_username", me)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("fetchNotifications error:", error);
        if (isDev) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0edbb5eb-9e7b-4f66-bfe6-5ae18010d80e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H4',location:'useNotifications.js:40',message:'fetchNotifications error',data:{msg:String(error?.message||''),status:error?.status||null,code:error?.code||null},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }
        return;
      }
      if (isDev) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0edbb5eb-9e7b-4f66-bfe6-5ae18010d80e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'useNotifications.js:46',message:'fetchNotifications ok',data:{count:(data||[]).length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }

      const mapped = (data || []).map((n) => ({
        id: n.id,
        type: n.type, // 'like', 'comment', 'comment_reply', 'repost'
        fromUsername: n.from_username || "",
        toUsername: n.to_username || "",
        postId: n.post_id || null,
        commentId: n.comment_id || null,
        read: n.read || false,
        createdAt: n.created_at ? new Date(n.created_at).getTime() : Date.now(),
        metadata: n.metadata || {},
      }));

      setNotifications(mapped);
    } catch (e) {
      console.error("fetchNotifications exception:", e);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a notification
   */
  async function createNotification({ type, fromUsername, toUsername, postId, commentId, metadata }) {
    if (!user || !booted) return;
    if (!supabase?.from) return;
    if (!fromUsername || !toUsername) return;

    // Don't notify yourself
    const me = normalizeUsername(user.username);
    const to = normalizeUsername(toUsername);
    if (me === to) return;

    // Normalize usernames for storage
    const normalizedFrom = normalizeUsername(fromUsername);
    const normalizedTo = normalizeUsername(toUsername);

    try {
      const { error } = await supabase.from("notifications").insert([
        {
          type,
          from_username: normalizedFrom,
          to_username: normalizedTo,
          post_id: postId || null,
          comment_id: commentId || null,
          read: false,
          metadata: metadata || {},
        },
      ]);

      if (error) {
        console.error("createNotification error:", error);
        return;
      }

      // Refresh notifications if we're viewing them
      await fetchNotifications();
    } catch (e) {
      console.error("createNotification exception:", e);
    }
  }

  /**
   * Mark notification as read
   */
  async function markAsRead(notificationId) {
    if (!user || !booted) return;
    if (!supabase?.from) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("markAsRead error:", error);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("markAsRead exception:", e);
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead() {
    if (!user || !booted) return;
    if (!supabase?.from) return;

    const me = normalizeUsername(user.username);
    const unreadIds = notifications.filter((n) => !n.read && normalizeUsername(n.toUsername) === me).map((n) => n.id);

    if (unreadIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      if (error) {
        console.error("markAllAsRead error:", error);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("markAllAsRead exception:", e);
    }
  }

  /**
   * Get unread count
   */
  const unreadCount = notifications.filter((n) => {
    if (!user) return false;
    const me = normalizeUsername(user.username);
    return normalizeUsername(n.toUsername) === me && !n.read;
  }).length;

  // Fetch notifications on mount and when user/booted changes
  useEffect(() => {
    if (booted && user) {
      fetchNotifications();
    }
  }, [booted, user?.username]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!booted || !user || !supabase?.channel) return;

    const me = normalizeUsername(user.username);
    if (!me) return;
    
    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `to_username=ilike.${me}`,
        },
        () => {
          // Refresh notifications when new ones arrive
          fetchNotifications();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      } catch (_) {}
    };
  }, [booted, user?.username]);

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
  };
}
