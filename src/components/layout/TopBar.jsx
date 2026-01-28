import { IconBase, BellIcon, ChatIcon, LoginIcon } from "../ui";
import { fmt } from "../../utils/helpers";

export function TopBar({
  ui,
  user,
  admin,
  setActive,
  setShowAuth,
  setCategoryFilter,
  setLandingSearch,
  settingsHook,
  profile,
  unreadNotificationsForMe,
  unreadThreadsForMe,
  touchNotificationsSeen,
  notificationsList,
  showNotificationsMenu,
  onToggleNotificationsMenu,
  onCloseNotificationsMenu,
  onViewAllNotifications,
  renderNotificationText,
}) {
  const iconBtnStyle = {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: ui.text,
    padding: 0,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "none",
    WebkitTapHighlightColor: "transparent",
    overflow: "visible",
  };

  const isAuthed = !!user?.id;

  const closeTopOverlays = () => {
    try {
      settingsHook.setShowSettings(false);
      setShowAuth(false);
    } catch (_) {}

    try {
      profile.setProfileOpen(false);
      profile.setProfileTarget(null);
    } catch (_) {}

    try {
      onCloseNotificationsMenu?.();
    } catch (_) {}
  };

  const goMyProfile = () => {
    if (!user) return;
    closeTopOverlays();
    profile.openProfileByUsername(user.username);
  };

  const toggleNotifications = () => {
    try {
      settingsHook.setShowSettings(false);
      setShowAuth(false);
    } catch (_) {}

    try {
      profile.setProfileOpen(false);
      profile.setProfileTarget(null);
    } catch (_) {}

    onToggleNotificationsMenu?.();
  };

  const goMessages = () => {
    closeTopOverlays();
    setActive("messages");
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(14px)",
        background: ui.top,
        borderBottom: `1px solid ${ui.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "10px 12px",
          position: "relative",
          minHeight: 48,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* LOGO (centered; never pushes buttons) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            pointerEvents: "auto",
            paddingRight: "clamp(64px, 18vw, 140px)",
            paddingLeft: "clamp(64px, 18vw, 140px)",
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={() => {
              setActive("biz");
              setCategoryFilter("");
              setLandingSearch("");

              try {
                if (window.location.pathname !== "/") {
                  window.location.assign("/");
                  return;
                }
                window.history.replaceState({}, document.title, "/");
              } catch (_) {}

              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              transform: "translateY(1px)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                fontSize: "clamp(24px, 6.5vw, 44px)",
                fontWeight: 950,
                letterSpacing: -0.8,
                lineHeight: 1.05,
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              Turk<span style={{ color: ui.blue }}>G</span>uide
            </div>
          </div>
        </div>

        {/* RIGHT ACTIONS (always visible) */}
        <div
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
          }}
        >
          {isAuthed && (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                aria-label="Bildirimler"
                title="Bildirimler"
                onClick={toggleNotifications}
                style={{ ...iconBtnStyle, position: "relative" }}
              >
                <BellIcon size={22} />

                {unreadNotificationsForMe > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      padding: "0 6px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 950,
                      lineHeight: 1,
                      background: "#E53935",
                      color: "#fff",
                      border: `2px solid ${ui.top}`,
                      boxSizing: "border-box",
                      userSelect: "none",
                    }}
                  >
                    {unreadNotificationsForMe > 99 ? "99+" : unreadNotificationsForMe}
                  </span>
                ) : null}
              </button>

              {showNotificationsMenu ? (
                <div
                  style={{
                    position: "absolute",
                    top: 40,
                    right: 0,
                    width: 340,
                    maxHeight: 420,
                    overflowY: "auto",
                    background: ui.panel,
                    border: `1px solid ${ui.border}`,
                    borderRadius: 14,
                    padding: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                    zIndex: 60,
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Bildirimler</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {(notificationsList || []).slice(0, 9).length === 0 ? (
                      <div style={{ color: ui.muted, fontSize: 13 }}>Şu an hiç bildiriminiz yok.</div>
                    ) : (
                      (notificationsList || []).slice(0, 9).map((n) => (
                        <div
                          key={n.id}
                          style={{
                            paddingBottom: 8,
                            borderBottom: `1px solid ${
                              ui.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"
                            }`,
                          }}
                        >
                          <div style={{ fontWeight: n.read ? 700 : 900, fontSize: 13 }}>
                            {renderNotificationText ? renderNotificationText(n) : ""}
                          </div>
                          <div style={{ color: ui.muted2, fontSize: 11 }}>{fmt(n.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      touchNotificationsSeen();
                      onViewAllNotifications?.();
                    }}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      border: `1px solid ${ui.border}`,
                      background: ui.panel2,
                      color: ui.text,
                      padding: "8px 10px",
                      borderRadius: 10,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Tüm bildirimler
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {isAuthed ? (
            <>
              <button
                type="button"
                aria-label="Mesajlar"
                title="Mesajlar"
                onClick={goMessages}
                style={{ ...iconBtnStyle, position: "relative" }}
              >
                <ChatIcon size={22} />

                {settingsHook.settings?.msgNotifications && unreadThreadsForMe > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      padding: "0 6px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 950,
                      lineHeight: 1,
                      background: ui.blue,
                      color: "#fff",
                      border: `2px solid ${ui.top}`,
                      boxSizing: "border-box",
                      pointerEvents: "auto",
                      userSelect: "none",
                    }}
                  >
                    {unreadThreadsForMe > 99 ? "99+" : unreadThreadsForMe}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                aria-label="Profil"
                title="Profil"
                onClick={goMyProfile}
                style={iconBtnStyle}
              >
                <IconBase size={22}>
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </IconBase>
              </button>
            </>
          ) : null}

          {!isAuthed ? (
            <button
              type="button"
              aria-label="Giriş"
              title="Giriş"
              onClick={() => {
                closeTopOverlays();
                setShowAuth(true);
              }}
              style={iconBtnStyle}
            >
              <LoginIcon size={22} />
            </button>
          ) : null}

          {user && admin.adminMode && admin.adminUnlocked && (
            <button
              type="button"
              aria-label="Admin"
              title="Admin"
              onClick={() => setActive("admin")}
              style={iconBtnStyle}
            >
              <IconBase size={22}>
                <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
              </IconBase>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
