import { Modal, Button, inputStyle } from "../../components/ui";
import { fmt, normalizeUsername } from "../../utils/helpers";

/**
 * DM Modal Component
 */
export function DMModal({
  ui,
  showDm,
  setShowDm,
  dmTarget,
  setDmTarget,
  dmText,
  setDmText,
  dms,
  settings,
  profile,
  resolveUsernameAlias,
  sendDm,
  markThreadRead,
}) {
  return (
    <Modal ui={ui} open={showDm} title="Mesaj" onClose={() => setShowDm(false)} fullScreen>
      {!dmTarget ? null : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0, flex: 1 }}>
          <div style={{ color: ui.muted, fontSize: 13 }}>
            Kime? {dmTarget.type === "user" ? <b>@{dmTarget.username}</b> : <b>İşletme</b>}
          </div>

          <div
            style={{
              border: `1px solid ${ui.border}`,
              borderRadius: 16,
              padding: 12,
              background:
                ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)",
              flex: "1 1 auto",
              minHeight: 0,
              overflow: "auto",
            }}
          >
            {(() => {
              const list = dms
                .filter((m) => {
                  if (dmTarget.type === "user") {
                    return (
                      m.toType === "user" &&
                      (normalizeUsername(m.toUsername) === normalizeUsername(dmTarget.username) ||
                        normalizeUsername(m.from) === normalizeUsername(dmTarget.username))
                    );
                  }
                  return m.toType === "biz" && m.toBizId === dmTarget.bizId;
                })
                .slice()
                .reverse();

              return list.map((m, idx) => {
                const prev = list[idx - 1];
                const showHeader =
                  idx === 0 ||
                  normalizeUsername(prev?.from) !== normalizeUsername(m.from);

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: `1px solid ${
                        ui.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"
                      }`,
                    }}
                  >
                    {showHeader ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 900,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                          onClick={() => profile.openProfileByUsername(resolveUsernameAlias(m.from))}
                        >
                          @{resolveUsernameAlias(m.from)}
                        </span>

                        <span style={{ color: ui.muted2, fontSize: 11 }}>{fmt(m.createdAt)}</span>
                      </div>
                    ) : null}

                    <div style={{ marginTop: showHeader ? 6 : 0, fontSize: 13 }}>{m.text}</div>
                  </div>
                );
              });
            })()}

            {dms.filter((m) =>
              dmTarget.type === "user"
                ? m.toType === "user" &&
                  (normalizeUsername(m.toUsername) === normalizeUsername(dmTarget.username) ||
                    normalizeUsername(m.from) === normalizeUsername(dmTarget.username))
                : m.toType === "biz" && m.toBizId === dmTarget.bizId
            ).length === 0 && <div style={{ color: ui.muted }}>Şu an hiç mesajınız yok.</div>}
          </div>

          <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
            <textarea
              value={dmText}
              onChange={(e) => setDmText(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "0px";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Mesaj..."
              rows={1}
              style={inputStyle(ui, { minHeight: 0, height: 34, resize: "none", overflow: "hidden" })}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                ui={ui}
                variant="solidBlue"
                onClick={() => {
                  sendDm();
                  if (settings.readReceipts) markThreadRead(dmTarget);
                }}
              >
                Gönder
              </Button>
              <Button
                ui={ui}
                onClick={() => {
                  setShowDm(false);
                  setDmTarget?.(null);
                }}
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
