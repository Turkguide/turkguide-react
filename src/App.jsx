import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

// Constants
import { KEY, DEFAULT_ADMINS } from "./constants";

// Utils
import { lsSet } from "./utils/localStorage";
import { now, fmt, normalizeUsername, openDirections, openCall, trackMetric, uuid } from "./utils/helpers";
import { hasAcceptedTermsEffective } from "./utils/termsEffective";

// Hooks
import { useSystemTheme } from "./hooks/useSystemTheme";
import { useFileToBase64 } from "./hooks/useFileToBase64";
import { useBoot } from "./hooks/useBoot";

// Theme
import { themeTokens } from "./theme/themeTokens";

// Services (not used directly in App.jsx)

// Components - UI
import { Card, Button, Chip, Modal, inputStyle, BizCta } from "./components/ui";

// Components - Layout
import { Seg } from "./components/layout/Seg";
import { LandingHero } from "./components/layout/LandingHero";
import { CategoryGrid } from "./components/layout/CategoryGrid";
import { TopBar } from "./components/layout/TopBar";

// Components - Tabs
import { BusinessTab, HubTab } from "./components/tabs";

// Components - Modals
import { AppointmentModal, EditUserModal, EditBizModal, ProfileModal } from "./components/modals";

// Features - Settings
import { SettingsModal } from "./features/settings";

// Features - Auth
import { useAuthState, useAuthCallback, useAuth, AuthModal } from "./features/auth";
import { setPendingAcceptedTerms } from "./features/auth/pendingProfileFlags";

// Features - Business
import { useBusiness, useBusinessEdit, BizApplyForm } from "./features/business";

// Features - HUB
import { useHub } from "./features/hub";

// Features - Profile
import { useProfile, useUserManagement } from "./features/profile";

// Features - Admin
import { useAdmin, AdminPanel } from "./features/admin";

// Features - Messages
import { useMessages, DMModal } from "./features/messages";

// Features - Settings
import { useSettings } from "./features/settings";

// Features - Appointments
import { useAppointment } from "./features/appointments";

// Features - Notifications
import { useNotifications } from "./features/notifications";

/**
 * TurkGuide MVP — Refactored App.jsx
 * ✅ Modüler yapı: constants, utils, hooks, components ayrıldı
 * ✅ Mevcut LocalStorage mantığı korunur: users/biz/hub/admin/dm/randevu
 */

/* ========= APP ========= */
function MisconfigurationScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
      background: "#1a1a1a",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Yapılandırma hatası</p>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          Bağlantı ayarları eksik. Lütfen yönetici ile iletişime geçin.
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const isDev = import.meta.env.DEV;

  // Auth state
  const { user, setUser, booted } = useAuthState();

  const systemTheme = useSystemTheme();
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.innerWidth < 720;
    } catch (_ignored) {
      return false;
    }
  });
  const [themePref, setThemePref] = useState("system");
  const scrollLockRef = useRef(0);
  const resolvedTheme = themePref === "system" ? systemTheme : themePref;
  const ui = useMemo(() => themeTokens(resolvedTheme), [resolvedTheme]);

  // Data
  const [users, setUsers] = useState([]);
  const [biz, setBiz] = useState([]);
  const [bizApps, setBizApps] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (import.meta.env.DEV && posts?.length != null) {
      try { console.log("posts len", posts.length); } catch (_ignored) { /* noop */ }
    }
  }, [posts]);
  const [dms, setDms] = useState([]);
  const [appts, setAppts] = useState([]);
  const [reports, setReports] = useState([]);
  const [hubPostsTodayCount, setHubPostsTodayCount] = useState(0);
  const [blockedUsernames, setBlockedUsernames] = useState([]);
  const [blockedByUsernames, setBlockedByUsernames] = useState([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Report modal (Apple Guideline 1.2 – UGC safety)
  const [reportCtx, setReportCtx] = useState(null);
  const [reportReasonCode, setReportReasonCode] = useState("");
  const [reportReasonDetail, setReportReasonDetail] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Terms of Service gate (Apple Guideline 1.2)
  const [showTermsGate, setShowTermsGate] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  const [_infoPage, _setInfoPage] = useState(null);
  // reserved: "about" | "help" | "privacy" | "terms" | "contact" | null

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  // Landing search (UI)
  const [landingSearch, setLandingSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // ✅ Username değişince eski username'lerden profile açabilmek için alias map
  const [usernameAliases, setUsernameAliases] = useState({});
  // örn: { "oldname": "newname" } (hepsi normalize edilmiş tutulacak)

  // Admin hook (must be before auth hook for userManagement)
  const admin = useAdmin({
    user,
    booted,
    isDev,
  });

  // Tabs
  const [active, setActive] = useState(() => {
    try {
      const saved = sessionStorage.getItem("tg_active_tab_v1");
      if (window.location.pathname === "/admin") return "admin";
      return saved || "biz";
    } catch (_ignored) {
      return window.location.pathname === "/admin" ? "admin" : "biz";
    }
  });

  const lastMainTabRef = useRef("biz");
  useEffect(() => {
    if (["biz", "news", "hub"].includes(active)) {
      lastMainTabRef.current = active;
    }
  }, [active]);

  function goBackToMainTab() {
    setActive(lastMainTabRef.current || "biz");
  }

useEffect(() => {
  if (active === "admin") {
    if (window.location.pathname !== "/admin") {
      window.history.pushState({}, document.title, "/admin");
    }
  } else if (window.location.pathname === "/admin") {
    window.history.replaceState({}, document.title, "/");
  }
}, [active]);

useEffect(() => {
  const onResize = () => {
    setIsMobile(window.innerWidth < 720);
  };
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);


useEffect(() => {
  const onPopState = () => {
    if (window.location.pathname === "/admin") setActive("admin");
    else if (active === "admin") setActive("biz");
  };
  window.addEventListener("popstate", onPopState);
  return () => window.removeEventListener("popstate", onPopState);
}, [active]);

useEffect(() => {
  const handler = () => {
    setTermsChecked(false);
    setShowTermsGate(true);
  };
  window.addEventListener("tg:requestTermsGate", handler);
  return () => window.removeEventListener("tg:requestTermsGate", handler);
}, []);

useEffect(() => {
  if (showTermsGate && user && hasAcceptedTermsEffective(user)) setShowTermsGate(false);
}, [user, showTermsGate]);

useEffect(() => {
  if (import.meta.env.DEV) try { console.log("active", active); } catch (_ignored) { /* noop */ }
}, [active]);

// ✅ KALDIĞI YERİ HATIRLA
useEffect(() => {
  try {
    sessionStorage.setItem("tg_active_tab_v1", active);
  } catch (_ignored) {}
}, [active]);

useEffect(() => {
  if (active !== "admin" || !admin.adminMode || !supabase?.from) return;
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
          console.warn("Admin fetch: oturum yok, veri çekilmedi.");
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
        const mapped = apptRes.data.map(mapAppointmentRow);
        setAppts(mapped);
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
          acceptedTermsAt: r.accepted_terms_at ? new Date(r.accepted_terms_at).getTime() : null,
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

      // Today's HUB posts count for admin dashboard
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (cancelled) return;
          const row = payload?.new || payload?.old;
          if (!row) return;
          const mapped = mapAppointmentRow(row);
          setAppts((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const idx = list.findIndex((x) => x.id === mapped.id);
            if (payload.eventType === "DELETE") {
              return idx >= 0 ? list.filter((x) => x.id !== mapped.id) : list;
            }
            if (idx >= 0) {
              const copy = [...list];
              copy[idx] = { ...copy[idx], ...mapped };
              return copy;
            }
            return [mapped, ...list];
          });
        }
      )
      .subscribe();
  }

  return () => {
    cancelled = true;
    try {
      if (channel) supabase.removeChannel(channel);
    } catch (_ignored) {}
  };
}, [admin.adminMode, active]);

useEffect(() => {
  if (active !== "admin" || !admin.adminMode || !supabase?.from) return;
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
}, [active, admin.adminMode]);

  // HUB



  // HUB comment input refs ("Yorum" tıklayınca input'a focus)

  

useEffect(() => {
  if (!user?.id || !supabase?.from) return;
  let cancelled = false;

  async function fetchBlocks() {
    try {
      const { data, error } = await supabase
        .from("user_blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
        .limit(500);
      if (error) throw error;
      if (cancelled) return;
      const rows = Array.isArray(data) ? data : [];
      const blockedIds = rows.filter((r) => r.blocker_id === user.id).map((r) => r.blocked_id);
      const blockedByIds = rows.filter((r) => r.blocked_id === user.id).map((r) => r.blocker_id);
      const idToUsername = new Map((users || []).map((u) => [String(u.id), u.username]));
      setBlockedUsernames(blockedIds.map((id) => idToUsername.get(String(id)) || String(id)));
      setBlockedByUsernames(blockedByIds.map((id) => idToUsername.get(String(id)) || String(id)));
    } catch (e) {
      console.warn("fetchBlocks error:", e);
    }
  }

  fetchBlocks();

  return () => {
    cancelled = true;
  };
}, [user?.id, users]);

  function resolveUsernameAlias(uname) {
    const key = normalizeUsername(uname);
    return usernameAliases[key] || uname;
  }

  // Profile hook (must be before auth hook)
  const profile = useProfile({
    user,
    users,
    biz,
    resolveUsernameAlias,
  });

  // Settings hook (must be before auth hook)
  const settingsHook = useSettings({
    booted,
  });

  // Boot hook (handles localStorage restore only - auth restore is in useAuthState)
  useBoot({
    setUsers,
    setBiz,
    setBizApps,
    setPosts,
    setDms,
    setAppts,
    setThemePref,
  });

  // Admin hook defined above

  // User management hook (needs admin, must be before auth hook)
  const userManagement = useUserManagement({
    user,
    setUser,
    users,
    setUsers,
    biz,
    setBiz,
    posts,
    setPosts,
    dms,
    setDms,
    appts,
    setAppts,
    bizApps,
    setBizApps,
    admin,
    profile,
    usernameAliases,
    setUsernameAliases,
  });

  // setShowBizApply ref - will be set after business hook is initialized
  const setShowBizApplyRef = useRef(null);

  // Auth hook
  const auth = useAuth({
    user,
    setUser,
    setShowAuth,
    setShowRegister,
    setShowTermsGate,
    setTermsChecked,
    setActive,
    setShowSettings: settingsHook.setShowSettings,
    setShowBizApply: (value) => {
      if (setShowBizApplyRef.current) setShowBizApplyRef.current(value);
    },
    setProfileOpen: profile.setProfileOpen,
    setProfileTarget: profile.setProfileTarget,
    setShowEditUser: userManagement.setShowEditUser,
    setEditUserCtx: userManagement.setEditUserCtx,
    setShowDm: null, // Will be set after messages hook
    setDmTarget: null, // Will be set after messages hook
    setDmText: null, // Will be set after messages hook
    setShowAppt: null, // Will be set after appointment hook
    setApptBizId: null, // Will be set after appointment hook
    setApptMsg: null, // Will be set after appointment hook
    setShowDeleteAccountConfirm,
  });

  // Auth callback handling
  useAuthCallback({
    setUser,
    setShowAuth,
    setActive,
    setLandingSearch,
    setCategoryFilter,
  });

  // Messages hook (must be after auth hook)
  const messages = useMessages({
    user,
    dms,
    setDms,
    settings: settingsHook.settings,
    requireAuth: auth.requireAuth,
    blockedIds: blockedUsernames,
    blockedByIds: blockedByUsernames,
  });

  // 🔄 Fetch DMs from Supabase when user is ready
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

      let query = supabase
        .from("dms")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const orParts = [`from_username.ilike.${me}`, `to_username.ilike.${me}`];
      if (ownedBizIds.length > 0) {
        orParts.push(`to_biz_id.in.(${ownedBizIds.join(",")})`);
      }

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
  }, [booted, user, user?.username, biz]);

  // 🔔 Realtime: DMs insert/update
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
      const isToUser =
        m.to_type === "user" && normalizeUsername(m.to_username) === me;
      const isFromUser = normalizeUsername(m.from_username) === me;
      const isToBiz =
        m.to_type === "biz" && ownedBizIds.includes(String(m.to_biz_id));
      return isToUser || isFromUser || isToBiz;
    };

    const channel = supabase
      .channel("realtime:dms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dms" },
        (payload) => {
          const m = payload?.new;
          if (!m || !isRelevant(m)) return;
          const mapped = mapRow(m);
          setDms((prev) => {
            if ((prev || []).some((x) => String(x.id) === String(mapped.id))) {
              return prev;
            }
            return [mapped, ...(prev || [])];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "dms" },
        (payload) => {
          const m = payload?.new;
          if (!m || !isRelevant(m)) return;
          const mapped = mapRow(m);
          setDms((prev) =>
            (prev || []).map((x) =>
              String(x.id) === String(mapped.id) ? mapped : x
            )
          );
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_ignored) {}
    };
  }, [booted, user, user?.username, biz]);

  // Appointment hook (must be after auth hook and business hook)
  const appointment = useAppointment({
    user,
    appts,
    setAppts,
    biz,
    requireAuth: auth.requireAuth,
  });


    // File upload helpers
  const bizAvatarPicker = useFileToBase64();
  const BizAvatarInput = bizAvatarPicker.Input;

  // Business avatar update function
  function setBizAvatar(bizId, base64) {
    setBiz((prev) => prev.map((b) => (b.id === bizId ? { ...b, avatar: base64 } : b)));
  }
  // Persist
  useEffect(() => { if (booted) lsSet(KEY.USERS, users); }, [users, booted]);
  useEffect(() => { if (booted) lsSet(KEY.BIZ, biz); }, [biz, booted]);
  useEffect(() => { if (booted) lsSet(KEY.BIZ_APPS, bizApps); }, [bizApps, booted]);
  useEffect(() => { if (booted) lsSet(KEY.POSTS, posts); }, [posts, booted]);
  useEffect(() => { if (booted) lsSet(KEY.DMS, dms); }, [dms, booted]);
  useEffect(() => { if (booted) lsSet(KEY.APPTS, appts); }, [appts, booted]);
  useEffect(() => { if (booted) lsSet(KEY.THEME, themePref); }, [themePref, booted]);

  useEffect(() => {
    if (!booted) return;
    if (user) lsSet(KEY.USER, user);
    else localStorage.removeItem(KEY.USER);
  }, [user, booted]);

  // Business edit hook (needs admin)
  const businessEdit = useBusinessEdit({
    user,
    admin,
    biz,
    setBiz,
  });

  // Notifications hook
  const notifications = useNotifications({
    user,
    booted,
  });

  const approvedBiz = useMemo(() => biz.filter((x) => x.status === "approved"), [biz]);
  const _deletedBiz = useMemo(() => biz.filter((x) => x.status === "deleted"), [biz]);
  const pendingApps = useMemo(() => bizApps.filter((x) => x.status === "pending"), [bizApps]);

  const categoryCounts = useMemo(() => {
    const map = {};
    for (const b of approvedBiz) {
      const cat = String(b.category || "").trim();
      if (cat) map[cat] = (map[cat] || 0) + 1;
    }
    return map;
  }, [approvedBiz]);

  const filteredBiz = useMemo(() => {
    let filtered = approvedBiz;
    if (categoryFilter) {
      filtered = filtered.filter((b) => String(b.category || "").trim() === categoryFilter);
    }
    if (landingSearch) {
      const search = String(landingSearch || "").trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          String(b.name || "").toLowerCase().includes(search) ||
          String(b.category || "").toLowerCase().includes(search) ||
          String(b.address || "").toLowerCase().includes(search) ||
          String(b.city || "").toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [approvedBiz, categoryFilter, landingSearch]);

  const apptsForBiz = useMemo(() => {
    const map = new Map();
    for (const a of appts) {
      if (!a?.bizId) continue;
      map.set(a.bizId, (map.get(a.bizId) || 0) + (a.status === "pending" ? 1 : 0));
    }
    return map;
  }, [appts]);

  const filteredPosts = useMemo(() => {
    if (!posts || posts.length === 0) return posts;
    const blockedSet = new Set((blockedUsernames || []).map(normalizeUsername));
    const blockedBySet = new Set((blockedByUsernames || []).map(normalizeUsername));
    return posts.filter((p) => {
      const owner = normalizeUsername(p?.byUsername || "");
      if (!owner) return true;
      if (blockedSet.has(owner)) return false;
      if (blockedBySet.has(owner)) return false;
      return true;
    });
  }, [posts, blockedUsernames, blockedByUsernames]);

  // Auth functions from hook
  const { requireAuth } = auth;

  // Business functions from hook
  const business = useBusiness({
    user,
    setBiz,
    setBizApps,
    setUsers,
    addLog: admin.addLog,
    requireAuth,
    adminMode: admin.adminMode,
    users,
    createNotification: notifications.createNotification,
    setReports,
    setPosts,
  });

  // Set setShowBizApply ref after business hook is initialized
  useEffect(() => {
    setShowBizApplyRef.current = business.setShowBizApply;
  }, [business.setShowBizApply]);

  useEffect(() => {
    if (!isMobile || !business?.showBizApply) return;

    try {
      scrollLockRef.current = window.scrollY || 0;
      const body = document.body;
      body.style.position = "fixed";
      body.style.top = `-${scrollLockRef.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    } catch (_ignored) {}

    return () => {
      try {
        const body = document.body;
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        body.style.overflow = "";
        window.scrollTo(0, scrollLockRef.current || 0);
      } catch (_ignored) {}
    };
  }, [isMobile, business?.showBizApply]);

  // HUB functions from hook
  const hub = useHub({
    user,
    setPosts,
    posts,
    requireAuth,
    createNotification: notifications.createNotification,
    blockedUsernames,
    blockedByUsernames,
  });

  // 🔄 Sekme tekrar görünür olduğunda session yenile + HUB verisini tazele (arka planda kalınca JWT süresi dolmasın)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!supabase?.auth?.refreshSession) return;
      Promise.resolve(supabase.auth.refreshSession())
        .then(() => {
          if (active === "hub" && hub?.fetchHubPosts) hub.fetchHubPosts();
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, hub]);

  // 🔄 Fetch + Realtime subscribe when HUB tab becomes active
  useEffect(() => {
    if (!hub || !hub.fetchHubPosts) return;
    let channel = null;

    if (active === "hub") {
      console.log("🟣 HUB tab active -> hub.fetchHubPosts() running");
      // initial load
      Promise.resolve(hub.fetchHubPosts()).catch((e) =>
        console.error("fetchHubPosts error:", e)
      );

      // realtime: any insert/update/delete on hub_posts refreshes the list
      if (supabase?.channel) {
        channel = supabase
          .channel("realtime:hub_posts")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "hub_posts" },
            () => {
              // keep it simple: re-fetch latest
              Promise.resolve(hub.fetchHubPosts()).catch((e) =>
                console.error("fetchHubPosts error:", e)
              );
            }
          )
          .subscribe();
      }
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (_ignored) {}
    };
  }, [active, hub]);

// ✅ Public avatar resolver (reads from auth user -> local users[] -> cached public.profiles)
// NOTE: Must be sync because it is used inside render. We fetch missing avatars in the background
// and cache them so the UI re-renders when the avatar arrives.

// ✅ Public profile cache (id/username/avatar/fields) — profile modal can use this when users[] doesn't have the user








  // openBizApply is now in business hook

  // Business functions from hook (above)





// Appointment functions moved to useAppointment hook
// User management functions moved to useUserManagement hook


// ✅ Unread counters
// - unreadDmForMe: unread message count (legacy, kept for future use)
// - unreadThreadsForMe: unread "thread" count = farklı gönderen sayısı (badge bunu gösterecek)
const _unreadDmForMe = useMemo(() => {
  if (!user) return 0;
  const me = normalizeUsername(user.username);

  return dms.filter((m) => {
    const isToUser = m.toType === "user" && normalizeUsername(m.toUsername) === me;
    const isToBiz =
      m.toType === "biz" &&
      biz.some((b) => b.id === m.toBizId && normalizeUsername(b.ownerUsername) === me);
    if (!(isToUser || isToBiz)) return false;
    // Check if message is read by current user
    const readBy = Array.isArray(m.readBy) ? m.readBy : [];
    return !readBy.some((u) => normalizeUsername(u) === me);
  });
}, [dms, biz, user]);

const unreadThreadsForMe = useMemo(() => {
  if (!user) return 0;
  const me = normalizeUsername(user.username);
  const senders = new Set();

  for (const m of dms) {
    const isToUser = m.toType === "user" && normalizeUsername(m.toUsername) === me;
    const isToBiz =
      m.toType === "biz" &&
      biz.some((b) => b.id === m.toBizId && normalizeUsername(b.ownerUsername) === me);

    if (isToUser || isToBiz) {
      const readBy = Array.isArray(m.readBy) ? m.readBy : [];
      const isRead = readBy.some((u) => normalizeUsername(u) === me);
      if (!isRead) {
        senders.add(normalizeUsername(m.from));
      }
    }
  }

  return senders.size;
}, [dms, biz, user]);

// Notifications
const unreadNotificationsForMe = notifications.unreadCount;
const touchNotificationsSeen = () => {
  notifications.markAllAsRead();
};

const openNotificationsMenu = () => {
  setShowNotificationsMenu((prev) => !prev);
};

const closeNotificationsMenu = () => {
  setShowNotificationsMenu(false);
};

const viewAllNotifications = () => {
  closeNotificationsMenu();
  setActive("notifications");
};

useEffect(() => {
  if (!showNotificationsMenu) return;
  const handleDocPress = () => {
    closeNotificationsMenu();
  };
  document.addEventListener("mousedown", handleDocPress);
  document.addEventListener("touchstart", handleDocPress);
  return () => {
    document.removeEventListener("mousedown", handleDocPress);
    document.removeEventListener("touchstart", handleDocPress);
  };
}, [showNotificationsMenu]);

function landingDoSearch() {
  // şu an sadece filtre input'u kullanıyoruz; buton UX için
  trackMetric("search_click_total");
}

function pickCategory(key) {
  setCategoryFilter(key);
  setTimeout(() => {
    const el = document.getElementById("biz-list");
    el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, 50);
}

function clearFilters() {
  setLandingSearch("");
  setCategoryFilter("");
}

  function renderNotificationText(n) {
  const from = n.fromUsername ? `@${n.fromUsername}` : "Bir kullanıcı";
  switch (n.type) {
    case "like":
      return `${from} paylaşımınızı beğendi.`;
    case "comment":
      return `${from} paylaşımınıza yorum yaptı.`;
    case "comment_reply":
      return `${from} yorumunuza cevap verdi.`;
    case "repost":
      return `${from} paylaşımınızı HUB'da yeniden paylaştı.`;
    case "report":
      return `${from} bir içerik raporladı.`;
      case "biz_approved":
        return `Tebrikler! Isletmeniz onaylandi. ${n.metadata?.bizName ? `(${n.metadata.bizName})` : ""}`.trim();
      case "biz_rejected":
        return `Uzgunuz, isletmeniz onaylanamadi. ${
          n.metadata?.reason ? `Sebep: ${n.metadata.reason}` : ""
        }`.trim();
    default:
      return `${from} size bir bildirim gönderdi.`;
  }
}

// Report reasons for Apple Guideline 1.2 (UGC safety)
const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Taciz / Zorbalık" },
  { value: "inappropriate_content", label: "Uygunsuz içerik" },
  { value: "hate_speech", label: "Nefret söylemi" },
  { value: "violence", label: "Şiddet veya tehdit" },
  { value: "other", label: "Diğer" },
];

async function openReport(ctx) {
  if (!ctx) return;
  try {
    if (!(await requireAuth({ requireTerms: true }))) return;
    setReportCtx(ctx);
    setReportReasonCode("");
    setReportReasonDetail("");
  } catch (e) {
    if (import.meta.env.DEV) console.error("openReport error:", e);
    alert("Şikayet ekranı açılamadı. Lütfen tekrar deneyin.");
  }
}

async function submitReport() {
  if (!reportCtx || !user?.id) return;
  const reasonCode = String(reportReasonCode || "").trim();
  if (!reasonCode) {
    alert("Lütfen bir şikayet sebebi seçin.");
    return;
  }
  if (submittingReport) return;
  setSubmittingReport(true);

  const reporterUsername = user?.username ?? user?.email ?? "user";
  const detail = String(reportReasonDetail || "").trim();
  const reasonText = REPORT_REASONS.find((r) => r.value === reasonCode)?.label || reasonCode;
  const reason = detail ? `${reasonText}: ${detail}` : reasonText;

  const callRpc = () =>
    supabase.rpc("insert_report", {
      p_reporter_username: reporterUsername,
      p_target_type: reportCtx.type || "",
      p_target_id: String(reportCtx.targetId || ""),
      p_target_owner: reportCtx.targetOwner || "",
      p_target_label: reportCtx.targetLabel || "",
      p_reason: reason,
    });

  const REPORT_TIMEOUT_MS = 25000;
  const run = async () => {
    if (!supabase?.rpc) throw new Error("Şikayet özelliği şu an kullanılamıyor.");
    let result = await callRpc();
    if (result?.error && /jwt|session|unauthorized|PGRST301|row-level security/i.test(String(result.error?.message || ""))) {
      try {
        await Promise.race([
          supabase.auth.refreshSession(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("refresh_timeout")), 18000)),
        ]);
      } catch (_) {}
      result = await callRpc();
    }
    return result;
  };

  try {
    const result = await Promise.race([
      run(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("report_timeout")), REPORT_TIMEOUT_MS)),
    ]);
    const err = result?.error;
    if (err) throw err;
    const insertedId = result?.data ?? uuid();
    setReports((prev) => [
      {
        id: insertedId,
        createdAt: Date.now(),
        reporterId: user.id,
        reporterUsername,
        targetType: reportCtx.type,
        targetId: String(reportCtx.targetId || ""),
        targetLabel: reportCtx.targetLabel || "",
        reason,
        status: "open",
      },
      ...(prev || []),
    ]);
    if (reportCtx.type === "hub_post") {
      setPosts((prev) => (prev || []).filter((p) => String(p.id) !== String(reportCtx.targetId)));
    }
    if (reportCtx.type === "hub_comment") {
      setPosts((prev) =>
        (prev || []).map((p) => ({
          ...p,
          comments:
            String(p.id) === String(reportCtx.targetParentId)
              ? (p.comments || []).filter((c) => String(c.id) !== String(reportCtx.targetId))
              : p.comments,
        }))
      );
    }
    alert("Şikayetiniz alındı. İnceleme için yönlendirildi.");
    setReportCtx(null);
    setReportReasonCode("");
    setReportReasonDetail("");
  } catch (e) {
    if (import.meta.env.DEV) console.warn("submitReport error:", e);
    const msg = String(e?.message || "").toLowerCase();
    if (/report_timeout|refresh_timeout|timeout|timed out|fetch|network|bağlantı/i.test(msg)) {
      alert("İşlem uzadı veya bağlantı kurulamadı. Lütfen ağ bağlantınızı kontrol edip tekrar deneyin.");
    } else if (/row-level security|violates.*policy/i.test(msg)) {
      alert("Şikayet gönderilemedi. Oturum sunucuda tanınmıyor olabilir. Lütfen çıkış yapıp tekrar giriş yapın.");
    } else {
      alert("Şikayet gönderilemedi. " + (e?.message ? String(e.message) : "Lütfen tekrar deneyin."));
    }
  } finally {
    setSubmittingReport(false);
  }
}

async function acceptTerms() {
  if (!supabase?.from || !supabase?.auth?.getSession) {
    alert("Bağlantı hazır değil. Sayfayı yenileyip tekrar deneyin.");
    return false;
  }
  let userId = user?.id || null;
  const TIMEOUT_MS = 15000;
  const run = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError && import.meta.env.DEV) console.error("acceptTerms session error:", sessionError);
    userId = userId || sessionData?.session?.user?.id || null;
    if (!userId) {
      alert("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return false;
    }
    const acceptedAt = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ accepted_terms_at: acceptedAt }).eq("id", userId);
    if (error) {
      if (import.meta.env.DEV) console.warn("acceptTerms profiles update error:", error);
      alert("Kabul kaydedilemedi. Sayfayı yenileyip tekrar deneyin.");
      return false;
    }
    setPendingAcceptedTerms(userId, acceptedAt);
    setUser((prev) => (prev ? { ...prev, acceptedTermsAt: acceptedAt } : prev));
    return true;
  };
  try {
    const ok = await Promise.race([run(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), TIMEOUT_MS))]);
    return ok === true;
  } catch (e) {
    if (String(e?.message) === "timeout") {
      alert("Kayıt zaman aşımına uğradı. Lütfen tekrar deneyin.");
    } else {
      if (import.meta.env.DEV) console.error("acceptTerms error:", e);
      alert("Kabul işlemi başarısız oldu. Lütfen tekrar deneyin.");
    }
    return false;
  }
}

async function blockUser(targetUser) {
  if (!(await requireAuth())) return;
  if (!user?.id || !targetUser?.id) return;
  try {
    if (!supabase?.from) return;
    const { error } = await supabase.from("user_blocks").insert({
      blocker_id: user.id,
      blocked_id: targetUser.id,
    });
    if (error) throw error;
    setBlockedUsernames((prev) => Array.from(new Set([...(prev || []), targetUser.username])));
    alert("Kullanıcı engellendi.");
  } catch (e) {
    console.warn("blockUser error:", e);
    alert("Engelleme başarısız oldu.");
  }
}

async function unblockUser(targetUser) {
  if (!(await requireAuth())) return;
  if (!user?.id || !targetUser?.id) return;
  try {
    if (!supabase?.from) return;
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetUser.id);
    if (error) throw error;
    setBlockedUsernames((prev) => (prev || []).filter((u) => u !== targetUser.username));
    alert("Engel kaldırıldı.");
  } catch (e) {
    console.warn("unblockUser error:", e);
    alert("Engel kaldırma başarısız oldu.");
  }
}

function getDmOtherUsername(message, me) {
  if (!message) return "";
  const from = normalizeUsername(message.from);
  if (from === me) return message.toUsername || "";
  return message.from || "";
}

if (!booted) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: ui.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: ui.muted,
        fontSize: 15,
      }}
    >
      Yükleniyor…
    </div>
  );
}

return (
  <div
  style={{
    minHeight: "100vh",
    width: "100%",
    background: ui.bg,
      color: ui.text,
      paddingTop: 64,
      // ✅ Sticky Bottom CTA alanı içerikle çakışmasın
      paddingBottom: active === "biz" && !business.showBizApply ? 96 : 0,
    }}
  >
        <style>{`
      .tg-cta { transform: translateZ(0); }
      .tg-cta:hover { filter: brightness(1.03); }
      .tg-cta:active { transform: scale(0.99); }
      @keyframes tgCtaPulse {
        0% { box-shadow: 0 18px 60px rgba(47,102,255,0.22); }
        50% { box-shadow: 0 26px 90px rgba(255,79,216,0.26); }
        100% { box-shadow: 0 18px 60px rgba(47,102,255,0.22); }
      }
      .tg-cta { animation: tgCtaPulse 2.2s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .tg-cta { animation: none; }
      }
    `}</style>

    {/* TOP BAR */}
    <TopBar
      ui={ui}
      user={user}
      admin={admin}
      setActive={setActive}
      setShowAuth={setShowAuth}
      setCategoryFilter={setCategoryFilter}
      setLandingSearch={setLandingSearch}
      settingsHook={settingsHook}
      profile={profile}
      unreadNotificationsForMe={unreadNotificationsForMe}
      unreadThreadsForMe={unreadThreadsForMe}
      touchNotificationsSeen={touchNotificationsSeen}
      notificationsList={notifications.notifications}
      showNotificationsMenu={showNotificationsMenu}
      onToggleNotificationsMenu={openNotificationsMenu}
      onCloseNotificationsMenu={closeNotificationsMenu}
      onViewAllNotifications={viewAllNotifications}
      renderNotificationText={renderNotificationText}
    />
    
    {/* HUB Media hidden input (single occurrence) */}
    {hub?.hubMediaPickRef && (
      <input
        ref={hub.hubMediaPickRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={hub.onPickHubMediaFile}
      />
    )}

    {/* ✅ STICKY BOTTOM CTA (sadece BUSINESS sekmesi) */}
    {active === "biz" && !business.showBizApply ? (
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          padding: "12px 16px",
          background: ui.mode === "light" ? "rgba(246,247,251,0.88)" : "rgba(7,8,12,0.78)",
          backdropFilter: "blur(14px)",
          borderTop: `1px solid ${ui.border}`,
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <BizCta ui={ui} onClick={business.openBizApply} block />
        </div>
      </div>
    ) : null}

      {/* CONTENT */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 16px 16px" }}>
        {/* LANDING — sadece biz/news/hub ekranlarında üstte görünür (2. görsel) */}
        {(active === "biz" || active === "news" || active === "hub") && (
          <>
            <LandingHero
              ui={ui}
              active={active}
              setActive={(id) => setActive(id)}
              searchText={landingSearch}
              setSearchText={setLandingSearch}
              onSearch={landingDoSearch}
            />


          </>
        )}

 {/* BUSINESS */}
{active === "biz" && (
  <BusinessTab
    ui={ui}
    categoryFilter={categoryFilter}
    landingSearch={landingSearch}
    categoryCounts={categoryCounts}
    pickCategory={pickCategory}
    approvedBiz={approvedBiz}
    filteredBiz={filteredBiz}
    clearFilters={clearFilters}
    openBizApply={business.openBizApply}
    profile={profile}
    canEditBizAvatar={businessEdit.canEditBizAvatar}
    setBizAvatar={setBizAvatar}
    bizAvatarPicker={bizAvatarPicker}
    BizAvatarInput={BizAvatarInput}
    openAppointment={appointment.openAppointment}
    openDirections={openDirections}
    openCall={openCall}
    messages={messages}
    apptsForBiz={apptsForBiz}
    onReportBiz={openReport}
  />
)}

        {/* ADMIN */}
        {active === "admin" && (
          <div style={{ paddingTop: 26 }}>
            {admin.adminRoleLoading ? (
              <Card ui={ui}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>Yetki kontrol ediliyor</div>
                <div style={{ color: ui.muted, marginTop: 8 }}>
                  Lütfen birkaç saniye bekleyin.
                </div>
              </Card>
            ) : !admin.adminMode ? (
              <Card ui={ui}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>Admin erişimi yok</div>
                <div style={{ color: ui.muted, marginTop: 8 }}>
                  Bu sayfayı görmek için admin yetkisi gerekiyor.
                </div>
                {admin.adminRoleError ? (
                  <div style={{ color: ui.muted2, marginTop: 8, fontSize: 12 }}>
                    Yetki kontrol hatası: {admin.adminRoleError}
                  </div>
                ) : null}
                <div style={{ marginTop: 12 }}>
                  <Button ui={ui} onClick={goBackToMainTab}>
                    Geri
                  </Button>
                </div>
              </Card>
            ) : (
              <AdminPanel
                ui={ui}
                adminMode={admin.adminMode}
                adminLog={admin.adminLog}
                pendingApps={pendingApps}
                allApps={bizApps}
                approvedBiz={approvedBiz}
                users={users}
                appts={appts}
                reports={reports}
                user={user}
                business={business}
                profile={profile}
                openEditBiz={businessEdit.openEditBiz}
                openEditUser={userManagement.openEditUser}
                hubPostsTodayCount={hubPostsTodayCount}
              />
            )}
          </div>
        )}

        {/* NEWS */}
        {active === "news" && (
          <div style={{ paddingTop: 26 }}>
            <Card ui={ui}>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Haberler</div>
              <div style={{ color: ui.muted, marginTop: 8 }}>
                TurkGuide deneyimi genişliyor.
                <br />
                Yakında haber kaynağı entegrasyonu ve detaylı içerik sayfaları eklenecek.
              </div>
            </Card>
          </div>
        )}

        {/* HUB */}
        {active === "hub" && hub && (
          <HubTab
            ui={ui}
            user={user}
            hub={hub}
            posts={filteredPosts}
            setPosts={setPosts}
            setShowAuth={setShowAuth}
            profile={profile}
            admin={admin}
            users={users}
            pickHubMedia={hub.pickHubMedia}
            hubShare={hub.hubShare}
            onReportPost={openReport}
          />
        )}

        {/* NOTIFICATIONS */}
        {active === "notifications" && (
          <div style={{ paddingTop: 26 }}>
            <Card ui={ui}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>Bildirimler</div>
                <Button ui={ui} onClick={goBackToMainTab}>Geri</Button>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {notifications.notifications.length === 0 ? (
                  <div style={{ color: ui.muted }}>Şu an hiç bildiriminiz yok.</div>
                ) : (
                  notifications.notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "10px 0",
                        borderBottom: `1px solid ${
                          ui.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"
                        }`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: n.read ? 700 : 900 }}>{renderNotificationText(n)}</div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(n.createdAt)}</div>
                      </div>
                      {!n.read ? (
                        <Button
                          ui={ui}
                          onClick={() => notifications.markAsRead(n.id)}
                          style={{ marginTop: 6 }}
                        >
                          Okundu
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* MESSAGES */}
        {active === "messages" && (
          <div style={{ paddingTop: 26 }}>
            <Card ui={ui}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>Mesajlar</div>
                <Button ui={ui} onClick={goBackToMainTab}>Geri</Button>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {(() => {
                  if (!user) return <div style={{ color: ui.muted }}>Giriş yapmanız gerekiyor.</div>;
                  const me = normalizeUsername(user.username);
                  const ownedBizIds = (biz || [])
                    .filter((b) => normalizeUsername(b.ownerUsername) === me)
                    .map((b) => b.id)
                    .filter(Boolean);

                  const threads = (dms || [])
                    .filter((m) => {
                      const isUserThread =
                        m.toType === "user" &&
                        (normalizeUsername(m.from) === me ||
                          normalizeUsername(m.toUsername) === me);
                      const isBizThread = m.toType === "biz" && ownedBizIds.includes(m.toBizId);
                      return isUserThread || isBizThread;
                    })
                    .reduce((acc, m) => {
                      if (m.toType === "biz") {
                        const key = `biz:${m.toBizId}`;
                        const prev = acc.get(key);
                        const next = !prev || (m.createdAt || 0) > (prev.createdAt || 0) ? m : prev;
                        acc.set(key, next);
                        return acc;
                      }

                      const other =
                        normalizeUsername(m.from) === me ? m.toUsername : m.from;
                      const key = `user:${normalizeUsername(other)}`;
                      const prev = acc.get(key);
                      const next = !prev || (m.createdAt || 0) > (prev.createdAt || 0) ? m : prev;
                      acc.set(key, next);
                      return acc;
                    }, new Map());

                  const visible = Array.from(threads.values())
                    .slice()
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                  if (visible.length === 0) {
                    return <div style={{ color: ui.muted }}>Şu an hiç mesajınız yok.</div>;
                  }

                  return visible.slice(0, 50).map((m) => {
                    const isBiz = m.toType === "biz";
                    const other = getDmOtherUsername(m, me);
                    return (
                      <div
                        key={m.id}
                        style={{
                          padding: "10px 0",
                          borderBottom: `1px solid ${
                            ui.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"
                          }`,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (isBiz) messages.openDmToBiz(m.toBizId);
                          else if (other) messages.openDmToUser(other);
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 900 }}>
                            {isBiz ? "İşletme mesajı" : `@${other || "kullanıcı"}`}
                          </div>
                          <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(m.createdAt)}</div>
                        </div>
                        <div style={{ marginTop: 6, color: ui.muted }}>{m.text || ""}</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>
          </div>
        )}

      {/* FOOTER (bottom of page) */}
      <div
        style={{
          marginTop: 30,
          padding: "18px 0 10px",
          borderTop: `1px solid ${ui.border}`,
          display: "flex",
          justifyContent: "center",
          gap: 12,
          fontSize: 12,
          color: ui.muted2,
          flexWrap: "wrap",
        }}
      >
        <a href="/privacy.html" style={{ color: "inherit", textDecoration: "none" }}>
          Privacy Policy
        </a>
        <span style={{ opacity: 0.6 }}>•</span>
        <a href="/terms.html" style={{ color: "inherit", textDecoration: "none" }}>
          Terms of Use
        </a>
        <span style={{ opacity: 0.6 }}>•</span>
        <a href="/community-guidelines.html" style={{ color: "inherit", textDecoration: "none" }}>
          Community Guidelines
        </a>
        <span style={{ opacity: 0.6 }}>•</span>
        <a href="/report-abuse.html" style={{ color: "inherit", textDecoration: "none" }}>
          Report Abuse / Content Policy
        </a>
        <span style={{ opacity: 0.6 }}>•</span>
        <a href="/contact.html" style={{ color: "inherit", textDecoration: "none" }}>
          Contact
        </a>
      </div>

      {/* BUSINESS APPLY MODAL */}
      <Modal
        ui={ui}
        open={business.showBizApply}
        title="İşletme Başvurusu"
        onClose={() => business.setShowBizApply(false)}
        fullScreen={isMobile}
        zIndex={40}
      >
        <BizApplyForm
          ui={ui}
          biz={biz}
          onSubmit={business.submitBizApplication}
          onCancel={() => business.setShowBizApply(false)}
        />
      </Modal>

      {/* REJECT MODAL */}
      <Modal ui={ui} open={business.showRejectReason} title="Reddetme Sebebi" onClose={() => business.setShowRejectReason(false)}>
        <div style={{ color: ui.muted, marginBottom: 8 }}>Reddetme sebebi zorunlu.</div>
        <textarea value={business.rejectText} onChange={(e) => business.setRejectText(e.target.value)} placeholder="Sebep yaz..." style={inputStyle(ui, { minHeight: 90 })} />
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button ui={ui} variant="danger" onClick={business.adminReject}>Reddet</Button>
          <Button ui={ui} onClick={() => business.setShowRejectReason(false)}>İptal</Button>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal ui={ui} open={business.showDeleteReason} title="Silme Sebebi" onClose={() => business.setShowDeleteReason(false)}>
        <div style={{ color: ui.muted, marginBottom: 8 }}>Silme sebebi zorunlu. Log’a admin kullanıcı adı + sebep kaydedilir.</div>
        <textarea value={business.reasonText} onChange={(e) => business.setReasonText(e.target.value)} placeholder="Sebep yaz..." style={inputStyle(ui, { minHeight: 90 })} />
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button ui={ui} variant="danger" onClick={business.confirmDelete}>Sil</Button>
          <Button ui={ui} onClick={() => business.setShowDeleteReason(false)}>İptal</Button>
        </div>
      </Modal>

      {/* EDIT USER MODAL */}
      <EditUserModal
        ui={ui}
        open={userManagement.showEditUser}
        onClose={() => {
          userManagement.setShowEditUser(false);
          userManagement.setEditUserCtx(null);
        }}
        editUserCtx={userManagement.editUserCtx}
        setEditUserCtx={userManagement.setEditUserCtx}
        pickedAvatarName={userManagement.pickedAvatarName}
        setPickedAvatarName={userManagement.setPickedAvatarName}
        savingEditUser={userManagement.savingEditUser}
        editUserError={userManagement.editUserError}
        onSave={userManagement.saveEditUser}
      />

      {/* EDIT BIZ MODAL */}
      <EditBizModal
        ui={ui}
        open={businessEdit.showEditBiz}
        onClose={() => {
          businessEdit.setShowEditBiz(false);
          businessEdit.setEditBizCtx(null);
        }}
        editBizCtx={businessEdit.editBizCtx}
        setEditBizCtx={businessEdit.setEditBizCtx}
        onSave={() => businessEdit.saveEditBiz(admin.addLog)}
      />

      {/* DM MODAL */}
      <DMModal
        ui={ui}
        showDm={messages.showDm}
        setShowDm={messages.setShowDm}
        dmTarget={messages.dmTarget}
        setDmTarget={messages.setDmTarget}
        dmText={messages.dmText}
        setDmText={messages.setDmText}
        dms={dms}
        settings={settingsHook.settings}
        profile={profile}
        resolveUsernameAlias={resolveUsernameAlias}
        sendDm={messages.sendDm}
        markThreadRead={messages.markThreadRead}
      />
            {/* APPOINTMENT MODAL */}
      <AppointmentModal
        ui={ui}
        showAppt={appointment.showAppt}
        setShowAppt={appointment.setShowAppt}
        apptMsg={appointment.apptMsg}
        setApptMsg={appointment.setApptMsg}
        apptDateTime={appointment.apptDateTime}
        setApptDateTime={appointment.setApptDateTime}
        submitAppointment={appointment.submitAppointment}
      />

      {/* PROFILE MODAL */}
      <ProfileModal
        ui={ui}
        open={profile.profileOpen}
        onClose={() => {
          profile.setProfileOpen(false);
          profile.setProfileTarget(null);
        }}
        profileData={profile.profileData}
        user={user}
        profile={profile}
        messages={messages}
        onOpenSettings={() => settingsHook.setShowSettings(true)}
        openAppointment={appointment.openAppointment}
        openDirections={openDirections}
        openCall={openCall}
        onEditUser={userManagement.openEditUser}
        onReport={openReport}
        onBlockUser={blockUser}
        onUnblockUser={unblockUser}
        blockedUsernames={blockedUsernames}
      />

      {/* REPORT MODAL (Apple Guideline 1.2 – UGC) */}
      <Modal
        ui={ui}
        open={!!reportCtx}
        title="Şikayet Et"
        onClose={() => {
          setReportCtx(null);
          setReportReasonCode("");
          setReportReasonDetail("");
        }}
        width={520}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: ui.muted, fontSize: 13 }}>
            Raporlanan: <b style={{ color: ui.text }}>{reportCtx?.targetLabel || reportCtx?.targetOwner || reportCtx?.targetId || "—"}</b>
          </div>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Sebep (zorunlu)</label>
          <select
            value={reportReasonCode}
            onChange={(e) => setReportReasonCode(e.target.value)}
            style={{
              ...inputStyle(ui),
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${ui.border}`,
            }}
          >
            <option value="">— Sebep seçin —</option>
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <label style={{ fontSize: 13, color: ui.muted }}>Ek detay (isteğe bağlı)</label>
          <textarea
            value={reportReasonDetail}
            onChange={(e) => setReportReasonDetail(e.target.value)}
            placeholder="Ek bilgi yazabilirsiniz..."
            style={inputStyle(ui, { minHeight: 80, resize: "vertical" })}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button
              ui={ui}
              onClick={() => {
                setReportCtx(null);
                setReportReasonCode("");
                setReportReasonDetail("");
              }}
              disabled={submittingReport}
            >
              Vazgeç
            </Button>
            <Button ui={ui} variant="danger" onClick={submitReport} disabled={submittingReport}>
              {submittingReport ? "Gönderiliyor…" : "Gönder"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* TERMS OF SERVICE GATE (Apple Guideline 1.2) */}
      <Modal ui={ui} open={showTermsGate} title="Kullanım Şartları" onClose={() => setShowTermsGate(false)} width={640}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ color: ui.muted }}>
            Devam etmek için Kullanım Şartları ve Topluluk Kuralları'nı kabul etmelisiniz.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button ui={ui} onClick={() => window.open("/terms.html", "_blank", "noopener,noreferrer")}>
              Kullanım Şartları
            </Button>
            <Button ui={ui} onClick={() => window.open("/community-guidelines.html", "_blank", "noopener,noreferrer")}>
              Topluluk Kuralları
            </Button>
            <Button ui={ui} onClick={() => window.open("/privacy.html", "_blank", "noopener,noreferrer")}>
              Gizlilik Politikası
            </Button>
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
            />
            <span>Kullanım Şartları ve Topluluk Kuralları'nı okudum ve kabul ediyorum.</span>
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button ui={ui} onClick={() => setShowTermsGate(false)}>İptal</Button>
            <Button
              ui={ui}
              variant="ok"
              disabled={!termsChecked || acceptingTerms}
              onClick={async () => {
                setAcceptingTerms(true);
                try {
                  const ok = await acceptTerms();
                  if (ok) setShowTermsGate(false);
                } finally {
                  setAcceptingTerms(false);
                }
              }}
            >
              {acceptingTerms ? "Kaydediliyor…" : "Kabul Et"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE ACCOUNT CONFIRMATION */}
      <Modal
        ui={ui}
        open={showDeleteAccountConfirm}
        title="Hesabı kalıcı olarak sil"
        onClose={() => !auth.deletingAccount && setShowDeleteAccountConfirm(false)}
        width={480}
        zIndex={5600}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ color: ui.muted, fontSize: 14 }}>
            Hesabınız ve ilişkili tüm verileriniz (profil, paylaşımlar, yorumlar, mesajlar, randevular)
            kalıcı olarak silinecektir. Bu işlem geri alınamaz.
          </div>
          {auth.deletingAccount ? (
            <div style={{ color: ui.muted, fontSize: 13, fontWeight: 700 }}>
              Hesap siliniyor… Lütfen bekleyin (birkaç saniye sürebilir).
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button
              ui={ui}
              onClick={() => setShowDeleteAccountConfirm(false)}
              disabled={auth.deletingAccount}
            >
              İptal
            </Button>
            <Button
              ui={ui}
              variant="danger"
              onClick={async () => {
                try {
                  await auth.deleteAccount();
                } catch (e) {
                  setShowDeleteAccountConfirm(false);
                  const msg = String(e?.message || e || "").toLowerCase();
                  if (/zaman aşımı|timeout/i.test(msg)) {
                    alert("İstek zaman aşımına uğradı. Lütfen ağ bağlantınızı kontrol edip tekrar deneyin.");
                  } else {
                    alert(e?.message || "Hesap silinirken hata oluştu.");
                  }
                }
              }}
              disabled={auth.deletingAccount}
            >
              {auth.deletingAccount ? "Siliniyor…" : "Evet, hesabımı kalıcı olarak sil"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* SETTINGS MODAL */}
      <SettingsModal
        ui={ui}
        showSettings={settingsHook.showSettings}
        setShowSettings={settingsHook.setShowSettings}
        settings={settingsHook.settings}
        setSettings={settingsHook.setSettings}
        themePref={themePref}
        setThemePref={setThemePref}
        user={user}
        logout={auth.logout}
        onAcceptTerms={acceptTerms}
        onRequestDeleteAccount={() => {
          settingsHook.setShowSettings(false);
          // Ayarlar modalı kapanırken onayı aynı tıkta açmak bazı cihazlarda ikinci pencerenin görünmemesine yol açabiliyor
          window.setTimeout(() => setShowDeleteAccountConfirm(true), 0);
        }}
      />

      {/* AUTH MODAL */}
      <AuthModal
        ui={ui}
        showAuth={showAuth}
        showRegister={showRegister}
        setShowAuth={setShowAuth}
        setShowRegister={setShowRegister}
        authEmail={auth.authEmail}
        setAuthEmail={auth.setAuthEmail}
        authPassword={auth.authPassword}
        setAuthPassword={auth.setAuthPassword}
        authUsername={auth.authUsername}
        setAuthUsername={auth.setAuthUsername}
        loginNow={auth.loginNow}
        oauthLogin={auth.oauthLogin}
      />
  </div>
  </div>
  );
}

export default function App() {
  if (!supabase) return <MisconfigurationScreen />;
  return <AppContent />;
}
