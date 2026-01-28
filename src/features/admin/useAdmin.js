import { useState, useMemo, useEffect } from "react";
import { lsGet, lsSet } from "../../utils/localStorage";
import { KEY, DEFAULT_ADMINS } from "../../constants";
import { isAdminUser } from "../../utils/helpers";
import { now, uid } from "../../utils/helpers";

/**
 * Hook for Admin operations
 */
export function useAdmin({ user, booted }) {
  const [adminLog, setAdminLog] = useState([]);
  const [adminConfig, setAdminConfig] = useState({ admins: DEFAULT_ADMINS });
  const [adminUnlocked, setAdminUnlocked] = useState(() => lsGet(KEY.ADMIN_UNLOCK, false));

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

  // Compute admin mode
  const adminMode = useMemo(
    () => adminUnlocked && isAdminUser(user?.username, adminConfig.admins),
    [user, adminConfig, adminUnlocked]
  );

  /**
   * Add log entry
   */
  function addLog(action, payload = {}) {
    if (!adminMode) return;
    setAdminLog((prev) => [
      { id: uid(), createdAt: now(), admin: user?.username || "-", action, payload },
      ...prev,
    ]);
  }

  return {
    // State
    adminLog,
    setAdminLog,
    adminConfig,
    setAdminConfig,
    adminUnlocked,
    setAdminUnlocked,
    adminMode,
    // Functions
    addLog,
  };
}
