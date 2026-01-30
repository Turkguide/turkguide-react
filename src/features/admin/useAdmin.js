import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { lsGet, lsSet } from "../../utils/localStorage";
import { KEY, DEFAULT_ADMINS, DEFAULT_ADMIN_EMAILS } from "../../constants";
import { isAdminUser, now, uid } from "../../utils/helpers";

/**
 * Hook for Admin operations
 */
export function useAdmin({ user, booted, isDev = false }) {
  const [adminLog, setAdminLog] = useState([]);
  const [adminConfig, setAdminConfig] = useState({ admins: DEFAULT_ADMINS });
  const [adminUnlocked, setAdminUnlocked] = useState(() => lsGet(KEY.ADMIN_UNLOCK, false));
  const [adminRole, setAdminRole] = useState(null);
  const [adminRoleLoading, setAdminRoleLoading] = useState(false);
  const [adminRoleError, setAdminRoleError] = useState("");

  // Restore from localStorage on boot
  useEffect(() => {
    if (!booted) return;
    setAdminLog(lsGet(KEY.ADMIN_LOG, []));
    setAdminConfig(lsGet(KEY.ADMIN_CONFIG, { admins: DEFAULT_ADMINS }));
    setAdminUnlocked(lsGet(KEY.ADMIN_UNLOCK, false));
  }, [booted]);

  // Persist to localStorage
  useEffect(() => {
    if (booted) lsSet(KEY.ADMIN_LOG, adminLog);
  }, [adminLog, booted]);

  useEffect(() => {
    if (booted) lsSet(KEY.ADMIN_CONFIG, adminConfig);
  }, [adminConfig, booted]);

  useEffect(() => {
    if (booted) lsSet(KEY.ADMIN_UNLOCK, adminUnlocked);
  }, [adminUnlocked, booted]);

  // Fetch admin role from profiles (server-side source of truth)
  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user?.id || !supabase?.from) {
        setAdminRole(null);
        return;
      }

      setAdminRoleLoading(true);
      setAdminRoleError("");
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        if (!cancelled) setAdminRole(data?.role || null);
      } catch (e) {
        if (!cancelled) {
          setAdminRole(null);
          setAdminRoleError(String(e?.message || e || ""));
        }
      } finally {
        if (!cancelled) setAdminRoleLoading(false);
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const allowDevAdmin = isDev && adminUnlocked && isAdminUser(user?.username, adminConfig.admins);
  const allowEmailAdmin = DEFAULT_ADMIN_EMAILS.includes(String(user?.email || "").trim().toLowerCase());
  const allowNameAdmin = isAdminUser(user?.username, adminConfig.admins);
  const allowFallbackAdmin = !!adminRoleError && (allowNameAdmin || allowEmailAdmin);

  const adminMode = useMemo(
    () => adminRole === "admin" || allowDevAdmin || allowFallbackAdmin,
    [adminRole, allowDevAdmin, allowFallbackAdmin]
  );
  const adminUnlockedEffective = isDev ? adminUnlocked : true;

  const refreshAdminLogs = useCallback(async () => {
    if (!adminMode || !supabase?.from) return;
    try {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const mapped = rows.map((r) => ({
        id: r.id || uid(),
        createdAt: r.created_at ? new Date(r.created_at).getTime() : now(),
        admin: r.admin_username || r.admin || "-",
        action: r.action || "-",
        payload: r.payload || {},
      }));
      setAdminLog(mapped);
    } catch (e) {
      console.warn("admin_logs fetch error:", e);
    }
  }, [adminMode]);

  useEffect(() => {
    if (!adminMode) return;
    refreshAdminLogs();
  }, [adminMode, refreshAdminLogs]);

  /**
   * Add log entry
   */
  function addLog(action, payload = {}) {
    if (!adminMode) return;
    const entry = { id: uid(), createdAt: now(), admin: user?.username || "-", action, payload };
    setAdminLog((prev) => [
      entry,
      ...prev,
    ]);

    // Best-effort persistent audit log
    if (supabase?.from && user?.id) {
      supabase
        .from("admin_logs")
        .insert({
          admin_id: user.id,
          admin_username: user.username || "",
          action,
          payload,
        })
        .then(({ error }) => {
          if (error) console.warn("admin_logs insert error:", error);
        })
        .catch((e) => console.warn("admin_logs insert exception:", e));
    }
  }

  return {
    // State
    adminLog,
    setAdminLog,
    adminConfig,
    setAdminConfig,
    adminUnlocked: adminUnlockedEffective,
    setAdminUnlocked,
    adminMode,
    adminRole,
    adminRoleLoading,
    adminRoleError,
    // Functions
    addLog,
    refreshAdminLogs,
  };
}
