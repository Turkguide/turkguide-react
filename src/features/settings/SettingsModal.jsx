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
  logout,
  onRequestDeleteAccount,
}) {
  return (
    <Modal
      ui={ui}
      open={showSettings}
      title="Ayarlar"
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
            Sistem / Açık / Koyu seçimi buradan.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <Chip ui={ui} active={themePref === "system"} onClick={() => setThemePref("system")}>
              Sistem
            </Chip>
            <Chip ui={ui} active={themePref === "light"} onClick={() => setThemePref("light")}>
              Açık
            </Chip>
            <Chip ui={ui} active={themePref === "dark"} onClick={() => setThemePref("dark")}>
              Koyu
            </Chip>
          </div>
        </Card>

        {/* Hide message/account controls for guests */}
        {!!user?.id && (
          <>
            <div style={{ fontWeight: 950, fontSize: 14 }}>Mesajlaşma</div>

            <ToggleRow
              ui={ui}
              label="Sohbeti etkinleştir"
              desc="Kapalıyken gelen/giden mesajlar engellenir."
              value={!!settings.chatEnabled}
              onToggle={() => setSettings((p) => ({ ...p, chatEnabled: !p.chatEnabled }))}
            />

            <ToggleRow
              ui={ui}
              label="Okundu bilgisi"
              desc="Açıkken mesajlar okundu olarak işaretlenebilir (MVP)."
              value={!!settings.readReceipts}
              onToggle={() => setSettings((p) => ({ ...p, readReceipts: !p.readReceipts }))}
            />

            <ToggleRow
              ui={ui}
              label="Mesaj bildirimleri"
              desc="Açıkken okunmamış rozetleri görünür (MVP)."
              value={!!settings.msgNotifications}
              onToggle={() => setSettings((p) => ({ ...p, msgNotifications: !p.msgNotifications }))}
            />

            <div style={{ fontWeight: 950, fontSize: 14, marginTop: 18 }}>Bildirimler</div>

            <ToggleRow
              ui={ui}
              label="Bildirimleri etkinleştir"
              desc="Açıkken beğeni/yorum/yanıt bildirimleri görünür."
              value={!!settings.notificationsEnabled}
              onToggle={() =>
                setSettings((p) => ({ ...p, notificationsEnabled: !p.notificationsEnabled }))
              }
            />

            <div style={{ fontWeight: 950, fontSize: 14, marginTop: 18 }}>Legal</div>
            <div style={{ color: ui.muted, marginTop: 6, fontSize: 12 }}>
              Kullanım şartları, topluluk kuralları ve diğer politikaları buradan görüntüleyebilirsiniz.
            </div>
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
                Terms of Service
              </Button>
              <Button
                ui={ui}
                onClick={() => window.open("/community-guidelines.html", "_blank", "noopener,noreferrer")}
                size="sm"
              >
                Community Guidelines
              </Button>
              <Button
                ui={ui}
                onClick={() => window.open("/report-abuse.html", "_blank", "noopener,noreferrer")}
                size="sm"
              >
                Report Abuse / Content Policy
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
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button ui={ui} onClick={logout} size="sm">
                Çıkış Yap
              </Button>
            </div>

            {onRequestDeleteAccount ? (
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  paddingBottom: 8,
                  borderTop: `2px solid ${ui.mode === "light" ? "rgba(200,60,60,0.25)" : "rgba(255,100,100,0.2)"}`,
                  background: ui.mode === "light" ? "rgba(200,60,60,0.06)" : "rgba(255,80,80,0.06)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 950, fontSize: 13, color: ui.muted, marginBottom: 8 }}>
                  Tehlikeli bölge
                </div>
                <Button
                  ui={ui}
                  variant="danger"
                  size="sm"
                  onClick={onRequestDeleteAccount}
                  style={{ marginTop: 4 }}
                >
                  🗑️ Hesabı Sil
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
