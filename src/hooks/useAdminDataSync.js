import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { now } from "../utils/helpers";

export function useAdminDataSync({
  active,
  adminMode,
  setBizApps,
  setBiz,
  setAppts,
  setUsers,
  setReports,
  setHubPostsTodayCount,
}) {
  useEffect(() => {
    if (active !== "admin" || !adminMode || !supabase?.from) return;
    let cancelled = false;

    const mapAppointmentRow = (r) => ({
      id: r.id,
      createdAt: r.created_at ? new Date(r.created_at).getTime() : now(),
      status: r.status || "pending",
      bizId: r.biz_id || r.bizId,
      bizName: r.biz_name || r.bizName || "",
      fromUsername: r.from_username || r.fromUsername || "",
      requestedAt: r.requested_at || r.requestedAt || null,
      note: r.note || "",
    });

    async function fetchAdminData() {
      try {
        if (supabase?.auth?.getSession) {
          const { data: sData } = await supabase.auth.getSession();
          if (!sData?.session && supabase.auth.refreshSession) {
            await supabase.auth.refreshSession();
          }
          const { data: sData2 } = await supabase.auth.getSession();
          if (!sData2?.session) {
            console.warn("Admin fetch: oturum yok, veri cekilmedi.");
            return;
          }
        }

        const [appsRes, bizRes, apptRes, profilesRes, reportsRes] = await Promise.all([
          supabase.from("biz_apps").select("*").order("created_at", { ascending: false }).limit(200),
          supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(200),
          supabase.from("appointments").select("*").order("created_at", { ascending: false }).limit(200),
          supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
          supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200),
        ]);

        if (cancelled) return;

        if (!appsRes.error && Array.isArray(appsRes.data)) {
          const mapped = appsRes.data.map((r) => ({
            id: r.id,
            createdAt: r.created_at ? new Date(r.created_at).getTime() : now(),
            status: r.status || "pending",
            applicant: r.applicant || r.applicant_username || "",
            ownerUsername: r.owner_username || r.ownerUsername || r.applicant || "",
            name: r.name || "",
            category: r.category || "",
            desc: r.desc || "",
            country: r.country || "",
            state: r.state || "",
            zip: r.zip || "",
            apt: r.apt || "",
            address1: r.address1 || r.address_1 || "",
            address: r.address || "",
            city: r.city || "",
            phoneDial: r.phone_dial || r.phoneDial || "",
            phoneLocal: r.phone_local || r.phoneLocal || "",
            phone: r.phone || "",
            avatar: r.avatar || "",
            approvedAt: r.approved_at ? new Date(r.approved_at).getTime() : null,
            approvedBy: r.approved_by || "",
            rejectedAt: r.rejected_at ? new Date(r.rejected_at).getTime() : null,
            rejectedBy: r.rejected_by || "",
            rejectReason: r.reject_reason || "",
          }));
          setBizApps(mapped);
        }

        if (!bizRes.error && Array.isArray(bizRes.data)) {
          const mapped = bizRes.data.map((r) => ({
            id: r.id,
            createdAt: r.created_at ? new Date(r.created_at).getTime() : now(),
            status: r.status || "approved",
            name: r.name || "",
            city: r.city || "",
            address: r.address || "",
            phone: r.phone || "",
            category: r.category || "",
            desc: r.desc || "",
            avatar: r.avatar || "",
            ownerUsername: r.owner_username || r.ownerUsername || "",
            applicant: r.applicant || "",
            approvedAt: r.approved_at ? new Date(r.approved_at).getTime() : null,
            approvedBy: r.approved_by || "",
          }));
          setBiz(mapped);
        }

        if (!apptRes.error && Array.isArray(apptRes.data)) {
          setAppts(apptRes.data.map(mapAppointmentRow));
        }

        if (!profilesRes.error && Array.isArray(profilesRes.data)) {
          const mapped = profilesRes.data.map((r) => ({
            id: r.id,
            username: r.username || r.user_name || "",
            email: r.email || "",
            avatar: r.avatar || "",
            createdAt: r.created_at ? new Date(r.created_at).getTime() : now(),
            updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : null,
            Tier: r.tier || r.Tier || "Onaylı",
            xp: r.xp || r.XP || 0,
            role: r.role || null,
            age: r.age != null ? r.age : null,
            city: r.city || "",
            state: r.state || "",
            country: r.country || "",
            bio: r.bio || "",
            bannedAt: r.banned_at ? new Date(r.banned_at).getTime() : null,
          }));
          setUsers(mapped);
        }

        if (!reportsRes?.error && Array.isArray(reportsRes.data)) {
          const mapped = reportsRes.data.map((r) => ({
            id: r.id,
            createdAt: r.created_at ? new Date(r.created_at).getTime() : now(),
            reporterId: r.reporter_id || null,
            reporterUsername: r.reporter_username || "",
            targetType: r.target_type || "",
            targetId: r.target_id || "",
            targetParentId: r.target_parent_id || "",
            targetOwner: r.target_owner || "",
            targetOwnerId: r.target_owner_id || "",
            targetLabel: r.target_label || "",
            reason: r.reason || "",
            status: r.status || "open",
          }));
          setReports(mapped);
        }

        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("hub_posts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfToday.toISOString());
        if (!cancelled && typeof count === "number") setHubPostsTodayCount(count);
      } catch (e) {
        console.warn("admin data fetch error:", e);
      }
    }

    fetchAdminData();

    let channel = null;
    if (supabase?.channel) {
      channel = supabase
        .channel("realtime:appointments")
        .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
          if (cancelled) return;
          const row = payload?.new || payload?.old;
          if (!row) return;
          const mapped = mapAppointmentRow(row);
          setAppts((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const idx = list.findIndex((x) => x.id === mapped.id);
            if (payload.eventType === "DELETE") return idx >= 0 ? list.filter((x) => x.id !== mapped.id) : list;
            if (idx >= 0) {
              const copy = [...list];
              copy[idx] = { ...copy[idx], ...mapped };
              return copy;
            }
            return [mapped, ...list];
          });
        })
        .subscribe();
    }

    return () => {
      cancelled = true;
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (_ignored) {}
    };
  }, [active, adminMode, setAppts, setBiz, setBizApps, setHubPostsTodayCount, setReports, setUsers]);

  useEffect(() => {
    if (active !== "admin" || !adminMode || !supabase?.from) return;
    let cancelled = false;

    supabase
      .from("biz_apps")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("admin biz_apps fetch error:", error);
          alert("Basvurular yuklenemedi: " + (error.message || ""));
          return;
        }

        const mapped = (data || []).map((r) => ({
          id: r.id,
          createdAt: r.created_at ? new Date(r.created_at).getTime() : now(),
          status: r.status || "pending",
          applicant: r.applicant || r.applicant_username || "",
          ownerUsername: r.owner_username || r.ownerUsername || r.applicant || "",
          name: r.name || "",
          category: r.category || "",
          desc: r.desc || "",
          country: r.country || "",
          state: r.state || "",
          zip: r.zip || "",
          apt: r.apt || "",
          address1: r.address1 || r.address_1 || "",
          address: r.address || "",
          city: r.city || "",
          phoneDial: r.phone_dial || r.phoneDial || "",
          phoneLocal: r.phone_local || r.phoneLocal || "",
          phone: r.phone || "",
          avatar: r.avatar || "",
          approvedAt: r.approved_at ? new Date(r.approved_at).getTime() : null,
          approvedBy: r.approved_by || "",
          rejectedAt: r.rejected_at ? new Date(r.rejected_at).getTime() : null,
          rejectedBy: r.rejected_by || "",
          rejectReason: r.reject_reason || "",
        }));
        setBizApps(mapped);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("admin biz_apps fetch crash:", e);
        alert("Basvurular yuklenemedi.");
      });

    return () => {
      cancelled = true;
    };
  }, [active, adminMode, setBizApps]);
}
