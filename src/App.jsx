import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

// Constants
import { KEY, DEFAULT_ADMINS } from "./constants";

// Utils
import { now, fmt, normalizeUsername, openDirections, openCall } from "./utils/helpers";

// Hooks
import { useSystemTheme } from "./hooks/useSystemTheme";
import { useFileToBase64 } from "./hooks/useFileToBase64";
import { useBoot } from "./hooks/useBoot";
import { useAppShellState } from "./hooks/useAppShellState";
import { useNotificationMenu } from "./hooks/useNotificationMenu";
import { useBizApplyScrollLock } from "./hooks/useBizApplyScrollLock";
import { useHubLifecycle } from "./hooks/useHubLifecycle";
import { useDmSync } from "./hooks/useDmSync";
import { useUserBlockSync } from "./hooks/useUserBlockSync";
import { useAdminDataSync } from "./hooks/useAdminDataSync";
import { usePersistAppState } from "./hooks/usePersistAppState";
import { useLandingFilters } from "./hooks/useLandingFilters";
import { useUnreadCounts } from "./hooks/useUnreadCounts";

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
import { useReportActions } from "./features/reporting/useReportActions";
import { renderNotificationText } from "./features/notifications/notificationText";
import { useUserBlocks } from "./features/blocks/useUserBlocks";

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
  const { isMobile, active, setActive, goBackToMainTab } = useAppShellState();
  const [themePref, setThemePref] = useState("system");
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


useEffect(() => {
  if (import.meta.env.DEV) try { console.log("active", active); } catch (_ignored) { /* noop */ }
}, [active]);

  useAdminDataSync({
    active,
    adminMode: admin.adminMode,
    setBizApps,
    setBiz,
    setAppts,
    setUsers,
    setReports,
    setHubPostsTodayCount,
  });

  // HUB



  // HUB comment input refs ("Yorum" tıklayınca input'a focus)

  

  useUserBlockSync({
    userId: user?.id,
    users,
    setBlockedUsernames,
    setBlockedByUsernames,
  });

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
    setShowTermsGate: null,
    setTermsChecked: null,
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
  useDmSync({ booted, user, biz, setDms });

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
  usePersistAppState({ booted, users, biz, bizApps, posts, dms, appts, themePref, user });

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
  const notificationMenu = useNotificationMenu({
    markAllAsRead: notifications.markAllAsRead,
    setActive,
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
  const reportActions = useReportActions({
    user,
    requireAuth,
    setReports,
    setPosts,
  });
  const userBlocks = useUserBlocks({
    user,
    requireAuth,
    setBlockedUsernames,
  });

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

  useBizApplyScrollLock({ isMobile, showBizApply: business?.showBizApply });

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

  useHubLifecycle({ active, hub });

// ✅ Public avatar resolver (reads from auth user -> local users[] -> cached public.profiles)
// NOTE: Must be sync because it is used inside render. We fetch missing avatars in the background
// and cache them so the UI re-renders when the avatar arrives.

// ✅ Public profile cache (id/username/avatar/fields) — profile modal can use this when users[] doesn't have the user








  // openBizApply is now in business hook

  // Business functions from hook (above)





// Appointment functions moved to useAppointment hook
// User management functions moved to useUserManagement hook


  const { unreadThreadsForMe } = useUnreadCounts({ user, dms, biz });

// Notifications
const unreadNotificationsForMe = notifications.unreadCount;
const {
  showNotificationsMenu,
  touchNotificationsSeen,
  openNotificationsMenu,
  closeNotificationsMenu,
  viewAllNotifications,
} = notificationMenu;

  const { landingDoSearch, pickCategory, clearFilters } = useLandingFilters({
    setLandingSearch,
    setCategoryFilter,
  });

const {
  REPORT_REASONS,
  reportCtx,
  setReportCtx,
  reportReasonCode,
  setReportReasonCode,
  reportReasonDetail,
  setReportReasonDetail,
  submittingReport,
  openReport,
  submitReport,
} = reportActions;
const { blockUser, unblockUser } = userBlocks;

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
