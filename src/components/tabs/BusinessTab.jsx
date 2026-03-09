import { Card, Button, Chip, Avatar, BizCta } from "../ui";
import { trackMetric } from "../../utils/helpers";
import { CategoryGrid } from "../layout/CategoryGrid";

export function BusinessTab({
  ui,
  categoryFilter,
  landingSearch,
  categoryCounts,
  pickCategory,
  approvedBiz,
  filteredBiz,
  clearFilters,
  openBizApply,
  profile,
  canEditBizAvatar,
  setBizAvatar,
  bizAvatarPicker,
  BizAvatarInput,
  openAppointment,
  openDirections,
  openCall,
  messages,
  apptsForBiz,
  onReportBiz,
}) {
  return (
    <>
      {/* ✅ Kategori seçilmediyse: SADECE KATEGORİLER GÖZÜKSÜN */}
      {!categoryFilter && !landingSearch ? (
        <div style={{ paddingTop: 26 }}>
          <CategoryGrid
            ui={ui}
            counts={categoryCounts}
            onPickCategory={pickCategory}
            biz={approvedBiz}
          />
        </div>
      ) : (
        /* ✅ Kategori seçildiyse veya arama varsa: SADECE FİLTRELİ İŞLETMELER */
        <div id="biz-list" style={{ display: "grid", gap: 14, paddingTop: 26 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Button ui={ui} onClick={clearFilters}>← Tüm Kategoriler</Button>
            {landingSearch ? <Chip ui={ui} active>Arama: {landingSearch}</Chip> : null}
          </div>

          {filteredBiz.length === 0 ? (
            <Card
              ui={ui}
              style={{
                background:
                  ui.mode === "light"
                    ? "rgba(0,0,0,0.02)"
                    : "rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 800,
                  padding: "16px 10px",
                }}
              >
                {categoryFilter ? `${categoryFilter} kategorisinde şu an işletme yok.` : "Bu kategoride henüz işletme yok."}
              </div>
            </Card>
          ) : null}
          {/* ORTA CTA — filtreler ile liste arası */}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: 1240,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <BizCta ui={ui} onClick={openBizApply} block />
          </div>

          {filteredBiz.length === 0 ? (
            <div style={{ color: ui.muted, padding: 10 }}>
              {categoryFilter ? `${categoryFilter} kategorisinde şu an işletme yok.` : "Bu filtrede işletme yok."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredBiz.map((b) => {
                const badge = null;
                const canEditAvatar = canEditBizAvatar(b);

                const openBizProfile = () => {
                  trackMetric("biz_view_total");
                  trackMetric(`biz_view:${b.id}`);
                  profile.openProfileBiz(b.id);
                };

                return (
                  <div
                    key={b.id}
                    style={{
                      border: `1px solid ${ui.border}`,
                      background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                      borderRadius: 18,
                      padding: 16,
                      boxShadow: `0 18px 40px ${ui.glow}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div onClick={openBizProfile} style={{ cursor: "pointer" }}>
                          <Avatar ui={ui} src={b.avatar} size={54} label={b.name} />
                        </div>

                        <div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <div
                              style={{ fontSize: 18, fontWeight: 950, cursor: "pointer" }}
                              onClick={openBizProfile}
                            >
                              {b.name}
                            </div>
                            {badge ? <Chip ui={ui}>{badge}</Chip> : null}
                            {apptsForBiz.get(b.id) ? <Chip ui={ui}>🗓️ {apptsForBiz.get(b.id)} yeni talep</Chip> : null}
                          </div>

                          <div style={{ marginTop: 6, color: ui.muted }}>
                            📍 {b.address || b.city || "-"}
                          </div>

                          <div style={{ marginTop: 6, color: ui.muted2, fontSize: 12 }}>
                            Sahibi:{" "}
                            <span
                              style={{ cursor: "pointer", textDecoration: "underline" }}
                              onClick={() => profile.openProfileByUsername(b.ownerUsername || "")}
                            >
                              @{b.ownerUsername || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {canEditAvatar ? (
                          <>
                            <BizAvatarInput onBase64={(b64) => setBizAvatar(b.id, b64)} />
                            <Button ui={ui} variant="blue" onClick={() => bizAvatarPicker.pick()}>
                              🖼️ İşletme Foto
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {b.desc ? <div style={{ marginTop: 12, color: ui.muted }}>{b.desc}</div> : null}

                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button
                        ui={ui}
                        variant="ok"
                        onClick={() => openAppointment(b.id)}
                        style={{ background: "transparent", boxShadow: "none" }}
                      >
                        🗓️ Randevu Al
                      </Button>
                      <Button
                        ui={ui}
                        onClick={() => {
                          trackMetric(`directions_click:${b.id}`);
                          openDirections(b.address || b.city || "");
                        }}
                        style={{ background: "transparent", boxShadow: "none" }}
                      >
                        🧭 Yol Tarifi
                      </Button>
                      <Button ui={ui} onClick={() => openCall(b.phone)} style={{ background: "transparent", boxShadow: "none" }}>
                        📞 Ara
                      </Button>
                      <Button
                        ui={ui}
                        onClick={() => messages.openDmToBiz(b.id)}
                        style={{ background: "transparent", boxShadow: "none" }}
                      >
                        💬 Mesaj Gönder
                      </Button>
                      {!canEditAvatar ? (
                        <Button
                          ui={ui}
                          onClick={() =>
                            onReportBiz?.({
                              type: "business",
                              targetId: b.id,
                              targetOwner: b.ownerUsername || "",
                              targetLabel: b.name || "",
                            })
                          }
                          style={{ background: "transparent", boxShadow: "none" }}
                        >
                          🚩 Bildir
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
