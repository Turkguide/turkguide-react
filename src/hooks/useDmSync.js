import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { normalizeUsername } from "../utils/helpers";

export function useDmSync({ booted, user, biz, setDms }) {
  useEffect(() => {
    if (!booted || !user || !supabase?.from) return;
    let cancelled = false;

    async function fetchDms() {
      const me = normalizeUsername(user.username);
      if (!me) return;

      if (supabase?.auth?.getSession) {
        try {
          const { data: sData } = await supabase.auth.getSession();
          if (!sData?.session && supabase.auth.refreshSession) {
            await supabase.auth.refreshSession();
          }
          const { data: sData2 } = await supabase.auth.getSession();
          if (!sData2?.session) return;
        } catch (_ignored) {
          return;
        }
      }

      const ownedBizIds = (biz || [])
        .filter((b) => normalizeUsername(b.ownerUsername) === me)
        .map((b) => b.id)
        .filter(Boolean);

      let query = supabase.from("dms").select("*").order("created_at", { ascending: false }).limit(200);

      const orParts = [`from_username.ilike.${me}`, `to_username.ilike.${me}`];
      if (ownedBizIds.length > 0) orParts.push(`to_biz_id.in.(${ownedBizIds.join(",")})`);
      query = query.or(orParts.join(","));

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        const msg = String(error?.message || "");
        const looksAuth =
          error?.status === 401 ||
          error?.status === 403 ||
          msg.toLowerCase().includes("jwt") ||
          msg.toLowerCase().includes("auth");
        if (looksAuth && supabase?.auth?.refreshSession) {
          try {
            await supabase.auth.refreshSession();
            const retry = await query;
            if (cancelled) return;
            if (retry?.error) {
              console.error("fetchDms error:", retry.error);
              return;
            }
            const mapped = (retry.data || []).map((m) => ({
              id: m.id,
              createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
              from: m.from_username,
              toType: m.to_type,
              toUsername: m.to_username,
              toBizId: m.to_biz_id,
              text: m.text || "",
              readBy: Array.isArray(m.read_by) ? m.read_by : [],
            }));
            setDms(mapped);
            return;
          } catch (_ignored) {}
        }
        console.error("fetchDms error:", error);
        return;
      }

      const mapped = (data || []).map((m) => ({
        id: m.id,
        createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
        from: m.from_username,
        toType: m.to_type,
        toUsername: m.to_username,
        toBizId: m.to_biz_id,
        text: m.text || "",
        readBy: Array.isArray(m.read_by) ? m.read_by : [],
      }));

      setDms(mapped);
    }

    fetchDms();

    return () => {
      cancelled = true;
    };
  }, [booted, user, user?.username, biz, setDms]);

  useEffect(() => {
    if (!booted || !user || !supabase?.channel) return;
    const me = normalizeUsername(user.username);
    if (!me) return;

    const ownedBizIds = (biz || [])
      .filter((b) => normalizeUsername(b.ownerUsername) === me)
      .map((b) => String(b.id))
      .filter(Boolean);

    const mapRow = (m) => ({
      id: m.id,
      createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
      from: m.from_username,
      toType: m.to_type,
      toUsername: m.to_username,
      toBizId: m.to_biz_id,
      text: m.text || "",
      readBy: Array.isArray(m.read_by) ? m.read_by : [],
    });

    const isRelevant = (m) => {
      const isToUser = m.to_type === "user" && normalizeUsername(m.to_username) === me;
      const isFromUser = normalizeUsername(m.from_username) === me;
      const isToBiz = m.to_type === "biz" && ownedBizIds.includes(String(m.to_biz_id));
      return isToUser || isFromUser || isToBiz;
    };

    const channel = supabase
      .channel("realtime:dms")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dms" }, (payload) => {
        const m = payload?.new;
        if (!m || !isRelevant(m)) return;
        const mapped = mapRow(m);
        setDms((prev) => {
          if ((prev || []).some((x) => String(x.id) === String(mapped.id))) return prev;
          return [mapped, ...(prev || [])];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dms" }, (payload) => {
        const m = payload?.new;
        if (!m || !isRelevant(m)) return;
        const mapped = mapRow(m);
        setDms((prev) => (prev || []).map((x) => (String(x.id) === String(mapped.id) ? mapped : x)));
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_ignored) {}
    };
  }, [booted, user, user?.username, biz, setDms]);
}
