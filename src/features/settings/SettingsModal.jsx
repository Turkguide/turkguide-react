import { Modal, Card, Chip, ToggleRow, Button } from "../../components/ui";

/**
 * Settings Modal Component
 */
export function SettingsModal({
  ui,
  showSettings,
  setShowSettings,
  settings,
  setSettings,
  themePref,
  setThemePref,
  user,
  deleteAccount,
}) {
  return (
    <Modal
      ui={ui}
      open={showSettings}
      title="Settings"
      onClose={() => setShowSettings(false)}
      width={760}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <Card
          ui={ui}
          style={{
            padding: 14,
            background: ui.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 950, fontSize: 14 }}>Tema</div>
          <div style={{ color: ui.muted, marginTop: 6, fontSize: 13 }}>
            Sistem / Light / Dark seçimi buradan.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <Chip ui={ui} active={themePref === "system"} onClick={() => setThemePref("system")}>
              Sistem
            </Chip>
            <Chip ui={ui} active={themePref === "light"} onClick={() => setThemePref("light")}>
              Light
            </Chip>
            <Chip ui={ui} active={themePref === "dark"} onClick={() => setThemePref("dark")}>
              Dark
            </Chip>
          </div>
        </Card>

        {/* Hide message/account controls for guests */}
        {!!user?.id && (
          <>
            <div style={{ fontWeight: 950, fontSize: 14 }}>Messaging</div>

            <ToggleRow
              ui={ui}
              label="Enable chat"
              desc="When off, incoming/outgoing messages are blocked."
              value={!!settings.chatEnabled}
              onToggle={() => setSettings((p) => ({ ...p, chatEnabled: !p.chatEnabled }))}
            />

            <ToggleRow
              ui={ui}
              label="Read receipts"
              desc="When on, messages can be marked as read (MVP)."
              value={!!settings.readReceipts}
              onToggle={() => setSettings((p) => ({ ...p, readReceipts: !p.readReceipts }))}
            />

            <ToggleRow
              ui={ui}
              label="Message notifications"
              desc="When on, unread badges are shown (MVP)."
              value={!!settings.msgNotifications}
              onToggle={() => setSettings((p) => ({ ...p, msgNotifications: !p.msgNotifications }))}
            />

            <div style={{ fontWeight: 950, fontSize: 14, marginTop: 18 }}>Notifications</div>

            <ToggleRow
              ui={ui}
              label="Enable notifications"
              desc="When on, like/comment/reply alerts are shown."
              value={!!settings.notificationsEnabled}
              onToggle={() =>
                setSettings((p) => ({ ...p, notificationsEnabled: !p.notificationsEnabled }))
              }
            />

            <div style={{ fontWeight: 950, fontSize: 14, marginTop: 18 }}>Legal</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                ui={ui}
                onClick={() => window.open("/privacy.html", "_blank", "noopener,noreferrer")}
                size="sm"
              >
                Privacy Policy
              </Button>
              <Button
                ui={ui}
                onClick={() => window.open("/terms.html", "_blank", "noopener,noreferrer")}
                size="sm"
              >
                Terms of Use
              </Button>
              <Button
                ui={ui}
                onClick={() => window.open("/contact.html", "_blank", "noopener,noreferrer")}
                size="sm"
              >
                Contact
              </Button>
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: `1px solid ${ui.border}`,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button ui={ui} onClick={deleteAccount} variant="danger" size="sm">
                🗑️ Delete Account
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
