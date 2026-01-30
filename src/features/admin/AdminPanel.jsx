import { useMemo, useState } from "react";
import { Card, Button, Avatar, Chip, inputStyle } from "../../components/ui";
import { fmt, normalizeUsername, getMetric } from "../../utils/helpers";

const PAGE_SIZE = 8;

function paginate(list, page) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), pages);
  const start = (safePage - 1) * PAGE_SIZE;
  return {
    items: list.slice(start, start + PAGE_SIZE),
    pages,
    page: safePage,
    total,
  };
}

function Pagination({ ui, page, pages, onPrev, onNext }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
      <Button ui={ui} onClick={onPrev} disabled={page <= 1}>
        ← Önceki
      </Button>
      <div style={{ color: ui.muted2, fontSize: 12 }}>
        Sayfa {page} / {pages}
      </div>
      <Button ui={ui} onClick={onNext} disabled={page >= pages}>
        Sonraki →
      </Button>
    </div>
  );
}

/**
 * Admin Panel Component
 */
export function AdminPanel({
  ui,
  adminMode,
  adminLog,
  pendingApps,
  allApps,
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

  const safePending = Array.isArray(pendingApps) ? pendingApps : [];
  const safeApps = Array.isArray(allApps) ? allApps : safePending;
  const safeBiz = Array.isArray(approvedBiz) ? approvedBiz : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeAppts = Array.isArray(appts) ? appts : [];
  const safeLogs = Array.isArray(adminLog) ? adminLog : [];

  const [activeSection, setActiveSection] = useState("dashboard");
  const [appQuery, setAppQuery] = useState("");
  const [bizQuery, setBizQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [apptQuery, setApptQuery] = useState("");
  const [logQuery, setLogQuery] = useState("");

  const [appsPage, setAppsPage] = useState(1);
  const [bizPage, setBizPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [apptsPage, setApptsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);

  const appsFiltered = useMemo(() => {
    const q = appQuery.trim().toLowerCase();
    if (!q) return safeApps;
    return safeApps.filter(
      (a) =>
        String(a.name || "").toLowerCase().includes(q) ||
        String(a.category || "").toLowerCase().includes(q) ||
        String(a.city || "").toLowerCase().includes(q) ||
        String(a.applicant || "").toLowerCase().includes(q)
    );
  }, [safeApps, appQuery]);

  const bizFiltered = useMemo(() => {
    const q = bizQuery.trim().toLowerCase();
    if (!q) return safeBiz;
    return safeBiz.filter(
      (b) =>
        String(b.name || "").toLowerCase().includes(q) ||
        String(b.category || "").toLowerCase().includes(q) ||
        String(b.ownerUsername || "").toLowerCase().includes(q)
    );
  }, [safeBiz, bizQuery]);

  const usersFiltered = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return safeUsers;
    return safeUsers.filter(
      (u) =>
        String(u.username || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q)
    );
  }, [safeUsers, userQuery]);

  const apptsFiltered = useMemo(() => {
    const q = apptQuery.trim().toLowerCase();
    if (!q) return safeAppts;
    return safeAppts.filter(
      (a) =>
        String(a.bizName || "").toLowerCase().includes(q) ||
        String(a.fromUsername || "").toLowerCase().includes(q) ||
        String(a.note || "").toLowerCase().includes(q)
    );
  }, [safeAppts, apptQuery]);

  const apptsSummary = useMemo(() => {
    const map = new Map();
    for (const a of apptsFiltered) {
      const bizKey = String(a.bizName || a.bizId || "Bilinmeyen İşletme");
      if (!map.has(bizKey)) map.set(bizKey, []);
      const rawDate = a.requestedAt || a.createdAt || null;
      const dateLabel = rawDate ? fmt(rawDate) : "Tarih yok";
      map.get(bizKey).push({
        dateLabel,
        fromUsername: a.fromUsername || "-",
      });
    }
    return Array.from(map.entries());
  }, [apptsFiltered]);

  const logsFiltered = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    if (!q) return safeLogs;
    return safeLogs.filter(
      (l) =>
        String(l.action || "").toLowerCase().includes(q) ||
        String(l.admin || "").toLowerCase().includes(q) ||
        JSON.stringify(l.payload || {}).toLowerCase().includes(q)
    );
  }, [safeLogs, logQuery]);

  const appsPageData = paginate(appsFiltered, appsPage);
  const bizPageData = paginate(bizFiltered, bizPage);
  const usersPageData = paginate(usersFiltered, usersPage);
  const apptsPageData = paginate(apptsFiltered, apptsPage);
  const apptsSummaryPage = paginate(apptsSummary, apptsPage);
  const logsPageData = paginate(logsFiltered, logsPage);

  const [selectedBizId, setSelectedBizId] = useState("");
  const selectedBiz = safeBiz.find((b) => String(b.id) === String(selectedBizId)) || null;

  const kpis = selectedBizId
    ? [
        { label: "Seçili İşletme", value: selectedBiz?.name || "-" },
        { label: "İşletme Görüntüleme", value: getMetric(`biz_view:${selectedBizId}`) },
        { label: "Yol Tarifi", value: getMetric(`directions_click:${selectedBizId}`) },
      ]
    : [
        { label: "Toplam Kullanıcı", value: safeUsers.length },
        { label: "Onaylı İşletme", value: safeBiz.length },
        { label: "Bekleyen Başvuru", value: safePending.length },
        { label: "Randevu Talebi", value: safeAppts.length },
        { label: "Admin Log", value: safeLogs.length },
        { label: "İşletme Görüntüleme", value: getMetric("biz_view_total") },
        { label: "Arama Tıklama", value: getMetric("search_click_total") },
        { label: "Yol Tarifi", value: getMetric("directions_click_total") },
      ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        <Card ui={ui} style={{ height: "fit-content" }}>
          <div style={{ fontSize: 16, fontWeight: 950 }}>Admin Menü</div>
          <div style={{ color: ui.muted2, fontSize: 12, marginTop: 6 }}>
            Hızlı gezinme
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {[
              ["Dashboard", "dashboard"],
              ["İşletmeler", "businesses"],
              ["Randevular", "appointments"],
              ["Kullanıcılar", "users"],
              ["Loglar", "logs"],
            ].map(([label, targetId]) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveSection(targetId)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: `1px solid ${ui.border}`,
                  background: activeSection === targetId ? ui.panel : ui.panel2,
                  fontWeight: 900,
                  fontSize: 13,
                  color: ui.text,
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: ui.mode === "light" ? "0 8px 20px rgba(0,0,0,0.06)" : "0 10px 24px rgba(0,0,0,0.22)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display: "grid", gap: 16 }}>
          <Card ui={ui}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 950 }}>Admin Dashboard</div>
                <div style={{ color: ui.muted, marginTop: 4 }}>
                  Operasyonlar ve kalite kontrolleri tek ekranda.
                </div>
              </div>
              <Chip ui={ui}>@{currentUser?.username || "-"}</Chip>
            </div>
          </Card>

          {activeSection === "dashboard" ? (
            <Card ui={ui} id="admin-kpi">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 16, fontWeight: 950 }}>KPI Özeti</div>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  style={inputStyle(ui, {
                    minWidth: 300,
                    padding: "14px 18px",
                    fontWeight: 900,
                    fontSize: 14,
                    borderWidth: 2,
                    boxShadow:
                      ui.mode === "light"
                        ? "0 12px 28px rgba(0,0,0,0.1)"
                        : "0 14px 32px rgba(0,0,0,0.34)",
                  })}
                >
                  <option value="">Tüm işletmeler</option>
                  {safeBiz.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gap: 12, marginTop: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                {kpis.map((k) => (
                  <div
                    key={k.label}
                    style={{
                      border: `1px solid ${ui.border}`,
                      borderRadius: 14,
                      padding: 12,
                      background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontSize: 12, color: ui.muted2 }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {activeSection === "businesses" ? (
          <Card ui={ui} id="admin-biz">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 950 }}>İşletme Yönetimi</div>
                <div style={{ color: ui.muted, marginTop: 4 }}>Düzenle / Sil</div>
              </div>
              <input
                value={bizQuery}
                onChange={(e) => {
                  setBizQuery(e.target.value);
                  setBizPage(1);
                }}
                placeholder="İşletme ara..."
                style={inputStyle(ui, { minWidth: 220 })}
              />
            </div>
            <div
              style={{
                marginTop: 12,
                border: `1px solid ${ui.border}`,
                borderRadius: 16,
                padding: 12,
                background: ui.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>Bekleyen Başvurular</div>
                  <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>İşletme onay kuyruğu</div>
                </div>
                <input
                  value={appQuery}
                  onChange={(e) => {
                    setAppQuery(e.target.value);
                    setAppsPage(1);
                  }}
                  placeholder="Başvuru ara..."
                  style={inputStyle(ui, { minWidth: 220 })}
                />
              </div>
              {appsPageData.total === 0 ? (
                <div style={{ color: ui.muted, marginTop: 10 }}>Bekleyen başvuru yok.</div>
              ) : (
                <>
                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    {appsPageData.items.map((a) => {
                      const status = String(a.status || "pending").toLowerCase();
                      const isPending = status === "pending";
                      return (
                      <div
                        key={a.id}
                        style={{
                          border: `1px solid ${ui.border}`,
                          borderRadius: 14,
                          padding: 10,
                          background:
                            ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontWeight: 900 }}>{a.name}</div>
                            <div style={{ color: ui.muted, marginTop: 4, fontSize: 12 }}>
                              {a.city} • {a.category} • @{a.applicant}
                            </div>
                            <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                              Durum: {status}
                              {a.rejectReason ? ` • Sebep: ${a.rejectReason}` : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Button
                              ui={ui}
                              variant="ok"
                              onClick={() => business.adminApprove(a)}
                              disabled={!isPending}
                            >
                              Onayla
                            </Button>
                            <Button
                              ui={ui}
                              variant="danger"
                              onClick={() => business.openReject(a)}
                              disabled={!isPending}
                            >
                              Reddet
                            </Button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                  <Pagination
                    ui={ui}
                    page={appsPageData.page}
                    pages={appsPageData.pages}
                    onPrev={() => setAppsPage((p) => Math.max(1, p - 1))}
                    onNext={() => setAppsPage((p) => Math.min(appsPageData.pages, p + 1))}
                  />
                </>
              )}
            </div>

            {bizPageData.total === 0 ? (
              <div style={{ color: ui.muted, marginTop: 12 }}>Kayıtlı işletme yok.</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {bizPageData.items.map((b) => (
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
                <Pagination
                  ui={ui}
                  page={bizPageData.page}
                  pages={bizPageData.pages}
                  onPrev={() => setBizPage((p) => Math.max(1, p - 1))}
                  onNext={() => setBizPage((p) => Math.min(bizPageData.pages, p + 1))}
                />
              </>
            )}
          </Card>
          ) : null}

          {activeSection === "appointments" ? (
          <Card ui={ui} id="admin-appts">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 950 }}>Randevu Talepleri</div>
                <div style={{ color: ui.muted, marginTop: 4 }}>İşletmelere yönlendirilen talepler</div>
              </div>
              <input
                value={apptQuery}
                onChange={(e) => {
                  setApptQuery(e.target.value);
                  setApptsPage(1);
                }}
                placeholder="Randevu ara..."
                style={inputStyle(ui, { minWidth: 220 })}
              />
            </div>
            {apptsPageData.total === 0 ? (
              <div style={{ color: ui.muted, marginTop: 12 }}>Henüz randevu yok.</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {apptsSummaryPage.items.map(([bizName, rows]) => (
                    <div
                      key={bizName}
                      style={{
                        border: `1px solid ${ui.border}`,
                        borderRadius: 16,
                        padding: 12,
                        background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ fontWeight: 950, marginBottom: 6 }}>{bizName}</div>
                      {rows.map((r, idx) => (
                        <div key={`${bizName}-${idx}`} style={{ color: ui.muted, fontSize: 12, marginBottom: 4 }}>
                          {r.dateLabel} • @{r.fromUsername}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <Pagination
                  ui={ui}
                  page={apptsSummaryPage.page}
                  pages={apptsSummaryPage.pages}
                  onPrev={() => setApptsPage((p) => Math.max(1, p - 1))}
                  onNext={() => setApptsPage((p) => Math.min(apptsSummaryPage.pages, p + 1))}
                />
              </>
            )}
          </Card>
          ) : null}

          {activeSection === "users" ? (
          <Card ui={ui} id="admin-users">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 950 }}>Kullanıcı Yönetimi</div>
                <div style={{ color: ui.muted, marginTop: 4 }}>Düzenle / Askıya Al</div>
              </div>
              <input
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  setUsersPage(1);
                }}
                placeholder="Kullanıcı ara..."
                style={inputStyle(ui, { minWidth: 220 })}
              />
            </div>
            {usersPageData.total === 0 ? (
              <div style={{ color: ui.muted, marginTop: 12 }}>Kullanıcı bulunamadı.</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {usersPageData.items.map((u) => (
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
                <Pagination
                  ui={ui}
                  page={usersPageData.page}
                  pages={usersPageData.pages}
                  onPrev={() => setUsersPage((p) => Math.max(1, p - 1))}
                  onNext={() => setUsersPage((p) => Math.min(usersPageData.pages, p + 1))}
                />
              </>
            )}
          </Card>
          ) : null}

          {activeSection === "logs" ? (
          <Card ui={ui} id="admin-logs">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 950 }}>Loglar</div>
                <div style={{ color: ui.muted, marginTop: 4 }}>Tüm admin işlemleri burada kayıtlı tutulur.</div>
              </div>
              <input
                value={logQuery}
                onChange={(e) => {
                  setLogQuery(e.target.value);
                  setLogsPage(1);
                }}
                placeholder="Log ara..."
                style={inputStyle(ui, { minWidth: 220 })}
              />
            </div>
            {logsPageData.total === 0 ? (
              <div style={{ color: ui.muted, marginTop: 12 }}>Henüz log yok.</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {logsPageData.items.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        border: `1px solid ${ui.border}`,
                        borderRadius: 16,
                        padding: 12,
                        background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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
                <Pagination
                  ui={ui}
                  page={logsPageData.page}
                  pages={logsPageData.pages}
                  onPrev={() => setLogsPage((p) => Math.max(1, p - 1))}
                  onNext={() => setLogsPage((p) => Math.min(logsPageData.pages, p + 1))}
                />
              </>
            )}
          </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
