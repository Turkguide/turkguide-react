import { useEffect } from "react";
import { KEY } from "../constants";
import { lsSet } from "../utils/localStorage";

export function usePersistAppState({ booted, users, biz, bizApps, posts, dms, appts, themePref, user }) {
  useEffect(() => {
    if (!booted) return;
    lsSet(KEY.USERS, users);
  }, [booted, users]);

  useEffect(() => {
    if (!booted) return;
    lsSet(KEY.BIZ, biz);
  }, [booted, biz]);

  useEffect(() => {
    if (!booted) return;
    lsSet(KEY.BIZ_APPS, bizApps);
  }, [booted, bizApps]);

  useEffect(() => {
    if (!booted) return;
    lsSet(KEY.POSTS, posts);
  }, [booted, posts]);

  useEffect(() => {
    if (!booted) return;
    lsSet(KEY.DMS, dms);
  }, [booted, dms]);

  useEffect(() => {
    if (!booted) return;
    lsSet(KEY.APPTS, appts);
  }, [booted, appts]);

  useEffect(() => {
    if (!booted) return;
    lsSet(KEY.THEME, themePref);
  }, [booted, themePref]);

  useEffect(() => {
    if (!booted) return;
    if (user) lsSet(KEY.USER, user);
    else localStorage.removeItem(KEY.USER);
  }, [booted, user]);
}
