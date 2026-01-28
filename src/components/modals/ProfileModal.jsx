import { Modal, Avatar, Button, Divider } from "../ui";
import { fmt, normalizeUsername } from "../../utils/helpers";

export function ProfileModal({
  ui,
  open,
  onClose,
  profileData,
  user,
  profile,
  messages,
  openAppointment,
  openDirections,
  openCall,
  onEditUser,
}) {
  if (!open || !profileData) return null;

  if (profileData.type === "loading") {
    return (
      <Modal ui={ui} open={open} title="Profil" onClose={onClose}>
        <div style={{ color: ui.muted, fontSize: 14 }}>Profil yükleniyor...</div>
      </Modal>
    );
  }

  return (
    <Modal ui={ui} open={open} title="Profil" onClose={onClose}>
      {profileData.type === "user" && profileData.user ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Avatar ui={ui} src={profileData.user.avatar} size={72} label={profileData.user.username} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 950 }}>@{profileData.user.username}</div>
              <div style={{ color: ui.muted, marginTop: 4 }}>
                Hesap Durumu: <b style={{ color: ui.text }}>Onaylı</b>
                {" • "}Katkı Puanı: {profileData.user.xp || 0}
              </div>
              <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                Kayıt: {fmt(profileData.user.createdAt)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {normalizeUsername(user?.username) === normalizeUsername(profileData.user.username) ? (
              <Button
                ui={ui}
                variant="blue"
                onClick={() => {
                  onEditUser(profileData.user);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: "8px 12px",
                  fontWeight: 900,
                  color: ui.text,
                }}
              >
                ✏️ Profili Düzenle
              </Button>
            ) : (
              <Button
                ui={ui}
                variant="blue"
                onClick={() => messages.openDmToUser(profileData.user.username)}
                style={{
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: "8px 12px",
                  fontWeight: 900,
                  color: ui.text,
                }}
              >
                💬 Mesaj Gönder
              </Button>
            )}
          </div>

          <Divider ui={ui} />

          <div style={{ fontWeight: 950 }}>Sahip olduğu işletmeler</div>
          {profileData.owned?.length === 0 ? (
            <div style={{ color: ui.muted }}>İşletme yok.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {(profileData.owned || []).map((b) => (
                <div
                  key={b.id}
                  style={{
                    border: `1px solid ${ui.border}`,
                    borderRadius: 16,
                    padding: 12,
                    background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                  }}
                  onClick={() => profile.openProfileBiz(b.id)}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar ui={ui} src={b.avatar} size={44} label={b.name} />
                    <div>
                      <div style={{ fontWeight: 950 }}>{b.name}</div>
                      <div style={{ color: ui.muted, fontSize: 13 }}>{b.category}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : profileData.type === "biz" && profileData.biz ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Avatar ui={ui} src={profileData.biz.avatar} size={72} label={profileData.biz.name} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 950 }}>{profileData.biz.name}</div>
              <div style={{ color: ui.muted, marginTop: 4 }}>{profileData.biz.category}</div>
              <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                Onay: {fmt(profileData.biz.approvedAt)} • by @{profileData.biz.approvedBy}
              </div>
            </div>
          </div>

          <div style={{ color: ui.muted }}>📍 {profileData.biz.address || profileData.biz.city}</div>
          <div style={{ color: ui.muted }}>📞 {profileData.biz.phone || "-"}</div>

          <div style={{ color: ui.muted2 }}>
            Sahibi:{" "}
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => profile.openProfileByUsername(profileData.biz.ownerUsername || "")}
            >
              @{profileData.biz.ownerUsername || "-"}
            </span>
          </div>

          {/* actions — daha bütünleşik / çerçevesiz */}
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: 2,
            }}
          >
            {(() => {
              const act = {
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                color: ui.mode === "light" ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.72)",
                fontWeight: 850,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              };

              const icon = {
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: ui.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${ui.border}`,
                lineHeight: 1,
                fontSize: 14,
              };

              return (
                <>
                  <button type="button" style={act} onClick={() => openAppointment(profileData.biz.id)} title="Randevu Al">
                    <span style={icon}>🗓️</span>
                    <span style={{ fontSize: 13 }}>Randevu Al</span>
                  </button>

                  <button
                    type="button"
                    style={act}
                    onClick={() => openDirections(profileData.biz.address || profileData.biz.city || "")}
                    title="Yol Tarifi"
                  >
                    <span style={icon}>🧭</span>
                    <span style={{ fontSize: 13 }}>Yol Tarifi</span>
                  </button>

                  <button type="button" style={act} onClick={() => openCall(profileData.biz.phone)} title="Ara">
                    <span style={icon}>📞</span>
                    <span style={{ fontSize: 13 }}>Ara</span>
                  </button>

                  <button
                    type="button"
                    style={{ ...act, color: ui.blue }}
                    onClick={() => messages.openDmToBiz(profileData.biz.id)}
                    title="Mesaj"
                  >
                    <span style={icon}>💬</span>
                    <span style={{ fontSize: 13 }}>Mesaj</span>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <div style={{ color: ui.muted, fontSize: 14 }}>Profil bulunamadı.</div>
      )}
    </Modal>
  );
}
