import { useEffect } from "react";
import { lsGet } from "../utils/localStorage";
import { KEY } from "../constants";

/**
 * Hook for booting the app: localStorage restore only
 * (Auth restore is handled by useAuthState hook)
 */
export function useBoot({
  setUsers,
  setBiz,
  setBizApps,
  setPosts,
  setDms,
  setAppts,
  setThemePref,
}) {
  // 📦 Local veriler restore
  useEffect(() => {
    setUsers(lsGet(KEY.USERS, []));
    setBiz(lsGet(KEY.BIZ, []));
    setBizApps(lsGet(KEY.BIZ_APPS, []));
    setPosts(lsGet(KEY.POSTS, []));
    setDms(lsGet(KEY.DMS, []));
    setAppts(lsGet(KEY.APPTS, []));
    setThemePref(lsGet(KEY.THEME, "system"));
  }, [setUsers, setBiz, setBizApps, setPosts, setDms, setAppts, setThemePref]);
}
