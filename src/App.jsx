import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

// Constants
import { KEY, DEFAULT_ADMINS } from "./constants";

// Utils
import { lsGet, lsSet } from "./utils/localStorage";
import { now, uid, fmt, normalizeUsername, isAdminUser, openDirections, openCall } from "./utils/helpers";
import { ensureSeed } from "./utils/seed";

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

// Features - Auth
import { useAuthState, useAuthCallback, useAuth } from "./features/auth";

// Features - Business
import { useBusiness, useBusinessEdit } from "./features/business";

// Features - HUB
import { useHub } from "./features/hub";

// Features - Profile
import { useProfile, useUserManagement } from "./features/profile";

// Features - Admin
import { useAdmin } from "./features/admin";

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
export default function App() {
  console.log("🔥 App.jsx yüklendi");
  console.log("🔥 SUPABASE INSTANCE:", supabase);
  console.log("🧪 ENV URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("🧪 ENV KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Auth state
  const { user, setUser, booted } = useAuthState();

  const systemTheme = useSystemTheme();
  const [themePref, setThemePref] = useState("system");
  const resolvedTheme = themePref === "system" ? systemTheme : themePref;
  const ui = useMemo(() => themeTokens(resolvedTheme), [resolvedTheme]);

  // Tabs
const [active, setActive] = useState(() => {
  try {
    return localStorage.getItem("tg_active_tab_v1") || "biz";
  } catch (_) {
    return "biz";
  }
});

// 🧪 DEBUG
useEffect(() => {
  console.log("🧪 ACTIVE CHANGED ->", active);
}, [active]);

// ✅ KALDIĞI YERİ HATIRLA
useEffect(() => {
  try {
    localStorage.setItem("tg_active_tab_v1", active);
  } catch (_) {}
}, [active]);

  // Data
  const [users, setUsers] = useState([]);
  const [biz, setBiz] = useState([]);
  const [bizApps, setBizApps] = useState([]);
  const [posts, setPosts] = useState([]);

  // 🧪 DEBUG: posts state gerçekten güncelleniyor mu?
  useEffect(() => {
    try {
      console.log("🧪 POSTS STATE CHANGED -> len=", (posts || []).length, "first=", (posts || [])[0]);
    } catch (_) {}
  }, [posts]);
  const [dms, setDms] = useState([]);
  const [appts, setAppts] = useState([]);
  
  const [infoPage, setInfoPage] = useState(null);
// infoPage: "about" | "help" | "privacy" | "terms" | "contact" | null


  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // HUB



  // HUB comment input refs ("Yorum" tıklayınca input'a focus)








  

  // Landing search (UI)
  const [landingSearch, setLandingSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // ✅ Username değişince eski username'lerden profile açabilmek için alias map
  const [usernameAliases, setUsernameAliases] = useState({});
  // örn: { "oldname": "newname" } (hepsi normalize edilmiş tutulacak)

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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/0edbb5eb-9e7b-4f66-bfe6-5ae18010d80e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:158',message:'useProfile - checking resolveUsernameAlias',data:{resolveUsernameAliasExists:typeof resolveUsernameAlias!=='undefined',resolveUsernameAliasType:typeof resolveUsernameAlias},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [resolveUsernameAlias]);
  // #endregion

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

  // Admin hook (must be before auth hook for userManagement)
  const admin = useAdmin({
    user,
    booted,
  });

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
  });

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/0edbb5eb-9e7b-4f66-bfe6-5ae18010d80e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:236',message:'useAuth - checking dependencies',data:{setShowBizApplyRefExists:setShowBizApplyRef.current!==null,userManagementExists:typeof userManagement!=='undefined',userManagementType:typeof userManagement},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
  }, [userManagement]);
  // #endregion

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
  });

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
  const deletedBiz = useMemo(() => biz.filter((x) => x.status === "deleted"), [biz]);
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

  // Auth functions from hook
  const { loginNow, logout, deleteAccount, oauthLogin, requireAuth, authUserExists } = auth;

  // Business functions from hook
  const business = useBusiness({
    user,
    setBiz,
    setBizApps,
    setUsers,
    addLog: admin.addLog,
    requireAuth,
    adminMode: admin.adminMode,
  });

  // Set setShowBizApply ref after business hook is initialized
  useEffect(() => {
    setShowBizApplyRef.current = business.setShowBizApply;
  }, [business.setShowBizApply]);

  // HUB functions from hook
  const hub = useHub({
    user,
    setPosts,
    posts,
    requireAuth,
    createNotification: notifications.createNotification,
  });

  // 🔄 Fetch + Realtime subscribe when HUB tab becomes active
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0edbb5eb-9e7b-4f66-bfe6-5ae18010d80e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:375',message:'hub useEffect - checking hub variable',data:{hubExists:typeof hub!=='undefined',hubType:typeof hub,hubFetchHubPostsExists:typeof hub?.fetchHubPosts!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!hub || !hub.fetchHubPosts) return;
    let channel = null;

    if (active === "hub") {
      console.log("🟣 HUB tab active -> hub.fetchHubPosts() running");
      // initial load
      hub.fetchHubPosts();

      // realtime: any insert/update/delete on hub_posts refreshes the list
      if (supabase?.channel) {
        channel = supabase
          .channel("realtime:hub_posts")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "hub_posts" },
            () => {
              // keep it simple: re-fetch latest
              hub.fetchHubPosts();
            }
          )
          .subscribe();
      }
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (_) {}
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
// - unreadDmForMe: unread message count (legacy)
// - unreadThreadsForMe: unread "thread" count = farklı gönderen sayısı (badge bunu gösterecek)
const unreadDmForMe = useMemo(() => {
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

function landingDoSearch() {
  // şu an sadece filtre input'u kullanıyoruz; buton UX için
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

if (!booted) return null;

// #region agent log
useEffect(() => {
  try {
    fetch('http://127.0.0.1:7242/ingest/0edbb5eb-9e7b-4f66-bfe6-5ae18010d80e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:487',message:'App render - checking all hooks',data:{hubExists:typeof hub!=='undefined',businessExists:typeof business!=='undefined',authExists:typeof auth!=='undefined',profileExists:typeof profile!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  } catch (e) {
    console.error('Debug log error:', e);
  }
}, [hub, business, auth, profile]);
// #endregion

return (
  <div
    style={{
      minHeight: "100vh",
      width: "100%",
      background: ui.bg,
      color: ui.text,
      // ✅ Sticky Bottom CTA alanı içerikle çakışmasın
      paddingBottom: active === "biz" ? 96 : 0,
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
    {active === "biz" ? (
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
  />
)}

        {/* NEWS */}
        {active === "news" && (
          <div style={{ paddingTop: 26 }}>
            <Card ui={ui}>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Haberler</div>
              <div style={{ color: ui.muted, marginTop: 8 }}>
                MVP demo. (Sonraki adım: haber kaynağı + detay sayfası)
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
            posts={posts}
            setPosts={setPosts}
            setShowAuth={setShowAuth}
            profile={profile}
            admin={admin}
            users={users}
            pickHubMedia={hub.pickHubMedia}
            hubShare={hub.hubShare}
          />
        )}

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
        openAppointment={appointment.openAppointment}
        openDirections={openDirections}
        openCall={openCall}
        onEditUser={userManagement.openEditUser}
      />
  </div>
  </div>
  );
}
