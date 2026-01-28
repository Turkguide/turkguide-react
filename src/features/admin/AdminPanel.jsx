import { Card, Button, Avatar, Chip } from "../../components/ui";
import { fmt, normalizeUsername } from "../../utils/helpers";

/**
 * Admin Panel Component
 */
export function AdminPanel({
  ui,
  adminMode,
  adminLog,
  pendingApps,
  approvedBiz,
  users,
  appts,
  user: currentUser,
  business,
  profile,
  openEditBiz,
  openEditUser,
}) {
  if (!adminMode) return null;

  return (
    <div style={{ display: "grid", gap: 14, paddingTop: 26 }}>
      <Card ui={ui}>
        <div style={{ fontSize: 18, fontWeight: 950 }}>Admin Dashboard</div>
        <div style={{ color: ui.muted, marginTop: 6 }}>Bu ekranı sadece adminler görür.</div>
      </Card>

      <Card ui={ui}>
        <div style={{ fontSize: 16, fontWeight: 950 }}>Bekleyen İşletme Başvuruları</div>
        {pendingApps.length === 0 ? (
          <div style={{ color: ui.muted, marginTop: 10 }}>Bekleyen başvuru yok.</div>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {pendingApps.map((a) => (
              <div
                key={a.id}
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: 16,
                  padding: 12,
                  background:
                    ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>{a.name}</div>
                    <div style={{ color: ui.muted, marginTop: 4 }}>
                      {a.city} • {a.category} • Durum: Beklemede • Başvuran: @{a.applicant}
                    </div>
                    <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                      {fmt(a.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button ui={ui} variant="ok" onClick={() => business.adminApprove(a)}>
                      Onayla
                    </Button>
                    <Button ui={ui} variant="danger" onClick={() => business.openReject(a)}>
                      Reddet
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card ui={ui}>
        <div style={{ fontSize: 16, fontWeight: 950 }}>İşletme Yönetimi</div>
        <div style={{ color: ui.muted, marginTop: 6 }}>Düzenle / Sil (sebep zorunlu)</div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {approvedBiz.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                border: `1px solid ${ui.border}`,
                borderRadius: 16,
                padding: 12,
                background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar ui={ui} src={b.avatar} size={44} label={b.name} />
                <div>
                  <div style={{ fontWeight: 950 }}>{b.name}</div>
                  <div style={{ color: ui.muted, fontSize: 13 }}>
                    {b.category} • owner: @{b.ownerUsername || "-"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Button ui={ui} variant="blue" onClick={() => openEditBiz(b)}>
                  Yönet / Düzenle
                </Button>
                <Button ui={ui} variant="danger" onClick={() => business.openDelete("biz", b)}>
                  Sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card ui={ui}>
        <div style={{ fontSize: 16, fontWeight: 950 }}>Randevu Talepleri</div>
        <div style={{ color: ui.muted, marginTop: 6 }}>
          Bu talepler işletmeye iletilmiş kabul edilir (MVP).
        </div>

        {appts.length === 0 ? (
          <div style={{ color: ui.muted, marginTop: 10 }}>Henüz randevu yok.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {appts.slice(0, 30).map((a) => (
              <div
                key={a.id}
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: 16,
                  padding: 12,
                  background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 950 }}>
                    {a.bizName} <span style={{ color: ui.muted }}>({a.status})</span>
                  </div>
                  <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(a.createdAt)}</div>
                </div>
                <div style={{ marginTop: 6, color: ui.muted }}>
                  Talep eden:{" "}
                  <span
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                    onClick={() => profile.openProfileByUsername(a.fromUsername)}
                  >
                    @{a.fromUsername}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>{a.note}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card ui={ui}>
        <div style={{ fontSize: 16, fontWeight: 950 }}>Kullanıcı Yönetimi</div>
        <div style={{ color: ui.muted, marginTop: 6 }}>Düzenle / Sil (sebep zorunlu)</div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                border: `1px solid ${ui.border}`,
                borderRadius: 16,
                padding: 12,
                background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar ui={ui} src={u.avatar} size={44} label={u.username} />
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip ui={ui} onClick={() => profile.openProfileByUsername(u.username)}>
                      @{u.username}
                    </Chip>
                    <span style={{ color: ui.muted }}>Durum: {u.Tier || "Onaylı"}</span>
                    <span style={{ color: ui.muted }}>Katkı: {u.xp || 0}</span>
                  </div>
                  <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(u.createdAt)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Button ui={ui} variant="blue" onClick={() => openEditUser(u)}>
                  Yönet / Düzenle
                </Button>
                <Button
                  ui={ui}
                  variant="danger"
                  onClick={() => business.openDelete("user", u)}
                  disabled={normalizeUsername(u.username) === normalizeUsername(currentUser?.username)}
                  title="Kendini silemezsin"
                >
                  Sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card ui={ui}>
        <div style={{ fontSize: 16, fontWeight: 950 }}>Admin Log</div>
        <div style={{ color: ui.muted, marginTop: 6 }}>
          Tüm admin işlemleri burada kayıtlı tutulur.
        </div>

        {adminLog.length === 0 ? (
          <div style={{ color: ui.muted, marginTop: 10 }}>Henüz log yok.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {adminLog.slice(0, 50).map((l) => (
              <div
                key={l.id}
                style={{
                  border: `1px solid ${ui.border}`,
                  borderRadius: 16,
                  padding: 12,
                  background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 950 }}>{l.action}</div>
                  <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(l.createdAt)}</div>
                </div>
                <div style={{ marginTop: 6, color: ui.muted }}>Admin: @{l.admin}</div>
                <div style={{ marginTop: 6, color: ui.muted2, fontSize: 12 }}>
                  {JSON.stringify(l.payload)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
