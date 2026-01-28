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

        {/* Misafir ise mesaj ayarları + hesap sil görünmesin */}
        {!!user?.id && (
          <>
            <div style={{ fontWeight: 950, fontSize: 14 }}>Mesaj Ayarları</div>

            <ToggleRow
              ui={ui}
              label="Sohbeti Aç/Kapat"
              desc="Kapalıysa gelen/giden mesajlar sessizce engellenir."
              value={!!settings.chatEnabled}
              onToggle={() => setSettings((p) => ({ ...p, chatEnabled: !p.chatEnabled }))}
            />

            <ToggleRow
              ui={ui}
              label="Görüldü Özelliği"
              desc="Açıkken mesajlar 'okundu' olarak işaretlenebilir (MVP)."
              value={!!settings.readReceipts}
              onToggle={() => setSettings((p) => ({ ...p, readReceipts: !p.readReceipts }))}
            />

            <ToggleRow
              ui={ui}
              label="Mesaj Bildirimleri"
              desc="Açıkken rozet/okunmamış sayısı güncel tutulur (MVP)."
              value={!!settings.msgNotifications}
              onToggle={() => setSettings((p) => ({ ...p, msgNotifications: !p.msgNotifications }))}
            />

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
                🗑️ Hesabımı Sil
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
