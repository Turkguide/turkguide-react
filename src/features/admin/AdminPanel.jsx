import { useMemo, useState } from "react";
import { Card, Button, Avatar, Chip, inputStyle } from "../../components/ui";
import { fmt, normalizeUsername } from "../../utils/helpers";

const PAGE_SIZE = 8;

function getStartOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

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
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
      <Button ui={ui} onClick={onPrev} disabled={page <= 1}>
        ← Önceki
      </Button>
      <span style={{ color: ui.muted2, fontSize: 13 }}>
        Sayfa {page} / {pages}
      </span>
      <Button ui={ui} onClick={onNext} disabled={page >= pages}>
        Sonraki →
      </Button>
    </div>
  );
}

// ----- Simple nav icons (inline SVG) -----
const iconSize = 20;
const iconStroke = 2;
function IconDashboard({ color }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={iconStroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function IconModeration({ color }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={iconStroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
function IconBusiness({ color }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={iconStroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconUsers({ color }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={iconStroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconAppointments({ color }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={iconStroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconLogs({ color }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={iconStroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { id: "reports", label: "Moderasyon", Icon: IconModeration },
  { id: "businesses", label: "İşletmeler", Icon: IconBusiness },
  { id: "users", label: "Kullanıcılar", Icon: IconUsers },
  { id: "appointments", label: "Randevular", Icon: IconAppointments },
  { id: "logs", label: "Loglar", Icon: IconLogs },
];

// Human-readable log action labels and badge color
function getLogDisplay(action, payload) {
  const a = String(action || "").toUpperCase();
  if (a.includes("HUB_CONTENT_REMOVED") || a.includes("CONTENT_REMOVED")) {
    return { title: "İçerik kaldırıldı", color: "red" };
  }
  if (a.includes("USER_DELETE") || a.includes("USER_SUSPEND")) {
    return { title: "Kullanıcı askıya alındı", color: "red" };
  }
  if (a.includes("BUSINESS_DELETE")) {
    return { title: "İşletme silindi", color: "red" };
  }
  if (a.includes("BUSINESS_APPROVE")) {
    return { title: "İşletme onaylandı", color: "green" };
  }
  if (a.includes("BUSINESS_REJECT")) {
    return { title: "İşletme reddedildi", color: "yellow" };
  }
  if (a.includes("REPORT") || a.includes("RESOLVED")) {
    return { title: "Rapor çözüldü", color: "blue" };
  }
  if (a.includes("PENDING") || a.includes("REJECT")) {
    return { title: action || "İşlem", color: "yellow" };
  }
  return { title: action || "İşlem", color: "gray" };
}

function LogBadge({ ui, color }) {
  const bg =
    color === "red"
      ? "rgba(239,68,68,0.2)"
      : color === "green"
      ? "rgba(34,197,94,0.2)"
      : color === "yellow"
      ? "rgba(234,179,8,0.2)"
      : color === "blue"
      ? "rgba(59,130,246,0.2)"
      : "rgba(128,128,128,0.2)";
  const text =
    color === "red"
      ? ui.red
      : color === "green"
      ? ui.green
      : color === "yellow"
      ? "#eab308"
      : color === "blue"
      ? "#3b82f6"
      : ui.muted2;
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        background: bg,
        color: text,
      }}
    >
      {color === "red" ? "Silme" : color === "green" ? "Onay" : color === "yellow" ? "Uyarı" : color === "blue" ? "Bilgi" : "Log"}
    </span>
  );
}

function EmptyState({ ui, icon, title, subtitle }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "24px 16px",
        color: ui.muted,
        border: `1px dashed ${ui.border}`,
        borderRadius: 12,
        background: ui.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: ui.text }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 12, marginTop: 4 }}>{subtitle}</div> : null}
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
  reports,
  user: currentUser,
  business,
  profile,
  openEditBiz,
  openEditUser,
  hubPostsTodayCount = 0,
}) {
  const safePending = Array.isArray(pendingApps) ? pendingApps : [];
  const safeApps = Array.isArray(allApps) ? allApps : safePending;
  const safeBiz = useMemo(() => (Array.isArray(approvedBiz) ? approvedBiz : []), [approvedBiz]);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const safeAppts = useMemo(() => (Array.isArray(appts) ? appts : []), [appts]);
  const safeLogs = useMemo(() => (Array.isArray(adminLog) ? adminLog : []), [adminLog]);
  const safeReports = useMemo(() => (Array.isArray(reports) ? reports : []), [reports]);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [appQuery, setAppQuery] = useState("");
  const [bizQuery, setBizQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [apptQuery, setApptQuery] = useState("");
  const [logQuery, setLogQuery] = useState("");
  const [reportQuery, setReportQuery] = useState("");
  const [reportFilterStatus, setReportFilterStatus] = useState("open"); // open | all
  const [reportFilterType, setReportFilterType] = useState(""); // '' | hub_post | hub_comment | user_profile | business
  const [logFilterAction, setLogFilterAction] = useState(""); // '' or action substring
  const [expandedLogId, setExpandedLogId] = useState(null);

  const [appsPage, setAppsPage] = useState(1);
  const [bizPage, setBizPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [apptsPage, setApptsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);

  const startTodayMs = useMemo(() => getStartOfTodayMs(), []);

  const todayUsersCount = useMemo(
    () => safeUsers.filter((u) => (u.createdAt || 0) >= startTodayMs).length,
    [safeUsers, startTodayMs]
  );
  const todayApptsCount = useMemo(
    () =>
      safeAppts.filter((a) => {
        const t = a.requestedAt || a.createdAt;
        return t && new Date(t).getTime() >= startTodayMs;
      }).length,
    [safeAppts, startTodayMs]
  );
  const openReportsCount = useMemo(
    () => safeReports.filter((r) => String(r.status || "open").toLowerCase() !== "resolved").length,
    [safeReports]
  );

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
        note: a.note || "",
        status: a.status || "pending",
      });
    }
    return Array.from(map.entries());
  }, [apptsFiltered]);

  const reportsFiltered = useMemo(() => {
    let list =
      reportFilterStatus === "all"
        ? safeReports
        : safeReports.filter((r) => String(r.status || "open").toLowerCase() !== "resolved");
    if (reportFilterType) {
      list = list.filter((r) => String(r.targetType || "").toLowerCase() === reportFilterType.toLowerCase());
    }
    const q = reportQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        String(r.reporterUsername || "").toLowerCase().includes(q) ||
        String(r.reason || "").toLowerCase().includes(q) ||
        String(r.targetOwner || "").toLowerCase().includes(q) ||
        String(r.targetLabel || "").toLowerCase().includes(q) ||
        String(r.targetType || "").toLowerCase().includes(q)
    );
  }, [safeReports, reportQuery, reportFilterStatus, reportFilterType]);

  const logsFiltered = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    const byAction = logFilterAction.trim().toLowerCase();
    let list = safeLogs;
    if (byAction) {
      list = list.filter((l) => String(l.action || "").toLowerCase().includes(byAction));
    }
    if (!q) return list;
    return list.filter(
      (l) =>
        String(l.action || "").toLowerCase().includes(q) ||
        String(l.admin || "").toLowerCase().includes(q) ||
        JSON.stringify(l.payload || {}).toLowerCase().includes(q)
    );
  }, [safeLogs, logQuery, logFilterAction]);

  const appsPageData = paginate(appsFiltered, appsPage);
  const bizPageData = paginate(bizFiltered, bizPage);
  const usersPageData = paginate(usersFiltered, usersPage);
  const apptsPageData = paginate(apptsFiltered, apptsPage);
  const apptsSummaryPage = paginate(apptsSummary, apptsPage);
  const logsPageData = paginate(logsFiltered, logsPage);
  const reportsPageData = paginate(reportsFiltered, reportsPage);

  const kpiCards = useMemo(
    () => [
      { label: "Toplam kullanıcı", value: safeUsers.length },
      { label: "Onaylı işletme", value: safeBiz.length },
      { label: "Bekleyen başvuru", value: safePending.length },
      { label: "Açık rapor / moderasyon", value: openReportsCount },
      { label: "Bugünkü randevular", value: todayApptsCount },
      { label: "Bugün yeni kullanıcı", value: todayUsersCount },
      { label: "Bugün HUB paylaşımı", value: hubPostsTodayCount },
      { label: "Admin log sayısı", value: safeLogs.length },
    ],
    [
      safeUsers.length,
      safeBiz.length,
      safePending.length,
      openReportsCount,
      todayApptsCount,
      todayUsersCount,
      hubPostsTodayCount,
      safeLogs.length,
    ]
  );

  if (!adminMode) return null;

  const isActive = (id) => activeSection === id;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 240px) 1fr", gap: 20 }}>
        {/* ----- SIDEBAR ----- */}
        <Card ui={ui} style={{ height: "fit-content", position: "sticky", top: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: ui.muted2, letterSpacing: 0.8, marginBottom: 10 }}>
            ADMIN
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: isActive(id) ? (ui.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)") : "transparent",
                  color: isActive(id) ? ui.text : ui.muted,
                  fontWeight: isActive(id) ? 800 : 600,
                  fontSize: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <span style={{ opacity: isActive(id) ? 1 : 0.7 }}>
                  <Icon color={isActive(id) ? ui.text : ui.muted} />
                </span>
                {label}
              </button>
            ))}
          </nav>
        </Card>

        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          {/* ----- COMPACT HEADER (section-specific) ----- */}
          {(() => {
            const headers = {
              dashboard: { title: "Dashboard", subtitle: "Özet ve son aktiviteler" },
              reports: { title: "Moderasyon", subtitle: "Raporlanan içerik ve kullanıcılar" },
              businesses: { title: "İşletmeler", subtitle: "Başvurular ve onaylı işletmeler" },
              users: { title: "Kullanıcılar", subtitle: "Hesap yönetimi" },
              appointments: { title: "Randevular", subtitle: "Randevu talepleri" },
              logs: { title: "Loglar", subtitle: "Admin işlem geçmişi" },
            };
            const h = headers[activeSection] || { title: "Admin", subtitle: "" };
            return (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  paddingBottom: 4,
                  borderBottom: `1px solid ${ui.border}`,
                }}
              >
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{h.title}</h1>
                  {h.subtitle ? (
                    <p style={{ color: ui.muted, marginTop: 2, fontSize: 13 }}>{h.subtitle}</p>
                  ) : null}
                </div>
                <Chip ui={ui}>@{currentUser?.username || "-"}</Chip>
              </div>
            );
          })()}

          {/* ----- DASHBOARD ----- */}
          {activeSection === "dashboard" && (
            <>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                }}
              >
                {kpiCards.map((k) => (
                  <div
                    key={k.label}
                    style={{
                      border: `1px solid ${ui.border}`,
                      borderRadius: 12,
                      padding: 10,
                      background: ui.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontSize: 11, color: ui.muted2, fontWeight: 600 }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{k.value}</div>
                  </div>
                ))}
              </div>
              {/* Recent moderation + recent admin actions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <Card ui={ui} style={{ padding: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 10px 0", color: ui.muted2 }}>Son moderasyon</h3>
                  {safeReports.filter((r) => String(r.status || "").toLowerCase() !== "resolved").length === 0 ? (
                    <p style={{ fontSize: 12, color: ui.muted, margin: 0 }}>Açık rapor yok.</p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: ui.text }}>
                      {safeReports
                        .filter((r) => String(r.status || "").toLowerCase() !== "resolved")
                        .slice(0, 5)
                        .map((r) => (
                          <li key={r.id} style={{ marginBottom: 4 }}>
                            @{r.reporterUsername || "-"} → {r.targetType || "?"} · {fmt(r.createdAt)}
                          </li>
                        ))}
                    </ul>
                  )}
                </Card>
                <Card ui={ui} style={{ padding: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 10px 0", color: ui.muted2 }}>Son admin işlemleri</h3>
                  {safeLogs.length === 0 ? (
                    <p style={{ fontSize: 12, color: ui.muted, margin: 0 }}>Henüz log yok.</p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: ui.text }}>
                      {safeLogs.slice(0, 5).map((l) => {
                        const { title } = getLogDisplay(l.action, l.payload);
                        return (
                          <li key={l.id} style={{ marginBottom: 4 }}>
                            {title} · @{l.admin} · {fmt(l.createdAt)}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>
            </>
          )}

          {/* ----- MODERASYON ----- */}
          {activeSection === "reports" && (
            <Card ui={ui} id="admin-reports" style={{ padding: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ui.muted2 }}>Filtreler</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <select
                    value={reportFilterStatus}
                    onChange={(e) => {
                      setReportFilterStatus(e.target.value);
                      setReportsPage(1);
                    }}
                    style={inputStyle(ui, { minWidth: 120 })}
                  >
                    <option value="open">Açık raporlar</option>
                    <option value="all">Tümü</option>
                  </select>
                  <select
                    value={reportFilterType}
                    onChange={(e) => {
                      setReportFilterType(e.target.value);
                      setReportsPage(1);
                    }}
                    style={inputStyle(ui, { minWidth: 140 })}
                  >
                    <option value="">Tüm türler</option>
                    <option value="hub_post">Hub paylaşımı</option>
                    <option value="hub_comment">Hub yorumu</option>
                    <option value="user_profile">Kullanıcı</option>
                    <option value="business_profile">İşletme</option>
                  </select>
                  <input
                    value={reportQuery}
                    onChange={(e) => {
                      setReportQuery(e.target.value);
                      setReportsPage(1);
                    }}
                    placeholder="Ara..."
                    style={inputStyle(ui, { minWidth: 180 })}
                  />
                </div>
              </div>

              {reportsPageData.total === 0 ? (
                <EmptyState
                  ui={ui}
                  icon="📋"
                  title="Rapor yok"
                  subtitle="Açık bildirim bulunmuyor."
                />
              ) : (
                <>
                  <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                    {reportsPageData.items.map((r) => {
                      const typeLabel =
                        r.targetType === "hub_post"
                          ? "Hub paylaşımı"
                          : r.targetType === "hub_comment"
                          ? "Hub yorumu"
                          : r.targetType === "user_profile"
                          ? "Kullanıcı"
                          : r.targetType === "business_profile" || r.targetType === "business"
                          ? "İşletme"
                          : "Diğer";
                      const isResolved = String(r.status || "").toLowerCase() === "resolved";
                      const thumbUrl = r.targetImageUrl || r.target_image || null;
                      return (
                        <div
                          key={r.id}
                          style={{
                            border: `1px solid ${ui.border}`,
                            borderRadius: 12,
                            padding: 12,
                            background: ui.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                          }}
                        >
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {thumbUrl ? (
                              <div
                                style={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  flexShrink: 0,
                                  background: ui.mode === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.06)",
                                }}
                              >
                                <img src={thumbUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ) : null}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 800, fontSize: 13 }}>{typeLabel}</span>
                                {isResolved && (
                                  <Chip ui={ui} style={{ fontSize: 11 }}>Çözüldü</Chip>
                                )}
                              </div>
                              <div style={{ color: ui.muted, marginTop: 4, fontSize: 12 }}>
                                Raporlayan: @{r.reporterUsername || "-"} · Hedef: {r.targetLabel || r.targetOwner || r.targetId || "-"}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 12 }}>{r.reason || "—"}</div>
                              <div style={{ color: ui.muted2, fontSize: 11, marginTop: 4 }}>{fmt(r.createdAt)}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {r.targetType === "hub_post" && !isResolved && (
                              <Button
                                ui={ui}
                                variant="danger"
                                onClick={() => business.openDelete("hub_post", r)}
                              >
                                İçeriği kaldır
                              </Button>
                            )}
                            {!isResolved && (
                              <Button
                                ui={ui}
                                variant="danger"
                                onClick={() =>
                                  business.openDelete("user", {
                                    id: r.targetOwnerId || r.targetOwner,
                                    username: r.targetOwner,
                                  })
                                }
                              >
                                Kullanıcıyı askıya al
                              </Button>
                            )}
                            <Button
                              ui={ui}
                              variant="ok"
                              onClick={() => business.openDelete("report", r)}
                              disabled={isResolved}
                            >
                              Çözüldü işaretle
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination
                    ui={ui}
                    page={reportsPageData.page}
                    pages={reportsPageData.pages}
                    onPrev={() => setReportsPage((p) => Math.max(1, p - 1))}
                    onNext={() => setReportsPage((p) => Math.min(reportsPageData.pages, p + 1))}
                  />
                </>
              )}
            </Card>
          )}

          {/* ----- İŞLETMELER ----- */}
          {activeSection === "businesses" && (
            <Card ui={ui} id="admin-biz" style={{ padding: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
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

              {/* Pending applications */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Bekleyen başvurular</h3>
                <input
                  value={appQuery}
                  onChange={(e) => {
                    setAppQuery(e.target.value);
                    setAppsPage(1);
                  }}
                  placeholder="Başvuru ara..."
                  style={inputStyle(ui, { maxWidth: 280, marginBottom: 12 })}
                />
                {appsPageData.total === 0 ? (
                  <EmptyState ui={ui} icon="📄" title="Bekleyen başvuru yok" subtitle="İşletme onay kuyruğu boş." />
                ) : (
                  <>
                    <div style={{ display: "grid", gap: 10 }}>
                      {appsPageData.items.map((a) => {
                        const status = String(a.status || "pending").toLowerCase();
                        const isPending = status === "pending";
                        return (
                          <div
                            key={a.id}
                            style={{
                              border: `1px solid ${ui.border}`,
                              borderRadius: 14,
                              padding: 12,
                              background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontWeight: 800 }}>{a.name}</div>
                                <div style={{ color: ui.muted, marginTop: 4, fontSize: 12 }}>
                                  {a.city} • {a.category} • @{a.applicant}
                                </div>
                                <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                                  Durum: {status}
                                  {a.rejectReason ? ` • Sebep: ${a.rejectReason}` : ""}
                                </div>
                                <div style={{ color: ui.muted2, fontSize: 11, marginTop: 2 }}>
                                  Başvuru: {fmt(a.createdAt)}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                                <Button ui={ui} variant="ok" onClick={() => business.adminApprove(a)} disabled={!isPending}>
                                  Onayla
                                </Button>
                                <Button ui={ui} variant="danger" onClick={() => business.openReject(a)} disabled={!isPending}>
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

              {/* Approved businesses */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Onaylı işletmeler</h3>
                {bizPageData.total === 0 ? (
                  <EmptyState ui={ui} icon="🏪" title="Kayıtlı işletme yok" subtitle="Onaylı işletme listesi boş." />
                ) : (
                  <>
                    <div style={{ display: "grid", gap: 10 }}>
                      {bizPageData.items.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                            border: `1px solid ${ui.border}`,
                            borderRadius: 14,
                            padding: 12,
                            background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                          }}
                        >
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <Avatar ui={ui} src={b.avatar} size={44} label={b.name} />
                            <div>
                              <div style={{ fontWeight: 800 }}>{b.name}</div>
                              <div style={{ color: ui.muted, fontSize: 13 }}>
                                {b.category} • {b.city} • @{b.ownerUsername || "-"}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button ui={ui} variant="blue" onClick={() => openEditBiz(b)}>
                              Detay / Düzenle
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
              </div>
            </Card>
          )}

          {/* ----- KULLANICILAR ----- */}
          {activeSection === "users" && (
            <Card ui={ui} id="admin-users" style={{ padding: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
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
                <EmptyState ui={ui} icon="👤" title="Kullanıcı bulunamadı" subtitle="Liste boş veya arama sonucu yok." />
              ) : (
                <>
                  <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                    {usersPageData.items.map((u) => (
                      <div
                        key={u.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "center",
                          border: `1px solid ${ui.border}`,
                          borderRadius: 14,
                          padding: 12,
                          background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <Avatar ui={ui} src={u.avatar} size={44} label={u.username} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <Chip ui={ui} onClick={() => profile.openProfileByUsername(u.username)}>
                                @{u.username}
                              </Chip>
                              <span style={{ color: ui.muted, fontSize: 13 }}>Durum: {u.Tier || "Onaylı"}</span>
                              {(u.postCount != null || u.commentCount != null) && (
                                <span style={{ color: ui.muted2, fontSize: 12 }}>
                                  Paylaşım: {u.postCount ?? "—"} · Yorum: {u.commentCount ?? "—"}
                                </span>
                              )}
                            </div>
                            <div style={{ color: ui.muted2, fontSize: 12, marginTop: 4 }}>Kayıt: {fmt(u.createdAt)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button ui={ui} variant="blue" onClick={() => openEditUser(u)}>
                            Yönet
                          </Button>
                          <Button
                            ui={ui}
                            variant="danger"
                            onClick={() => business.openDelete("user", u)}
                            disabled={normalizeUsername(u.username) === normalizeUsername(currentUser?.username)}
                            title="Kendini silemezsin"
                          >
                            Askıya al / Sil
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
          )}

          {/* ----- RANDEVULAR ----- */}
          {activeSection === "appointments" && (
            <Card ui={ui} id="admin-appts" style={{ padding: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
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
                <EmptyState
                  ui={ui}
                  icon="📅"
                  title="Henüz randevu yok"
                  subtitle="Randevu talepleri burada listelenir."
                />
              ) : (
                <>
                  <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                    {apptsSummaryPage.items.map(([bizName, rows]) => (
                      <div
                        key={bizName}
                        style={{
                          border: `1px solid ${ui.border}`,
                          borderRadius: 14,
                          padding: 14,
                          background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>{bizName}</div>
                        {rows.map((r, idx) => (
                          <div
                            key={`${bizName}-${idx}`}
                            style={{
                              color: ui.muted,
                              fontSize: 13,
                              marginBottom: 6,
                              paddingLeft: 8,
                              borderLeft: `3px solid ${ui.border}`,
                            }}
                          >
                            {r.dateLabel} • @{r.fromUsername}
                            {r.status && r.status !== "pending" ? ` • ${r.status}` : ""}
                            {r.note ? ` • Not: ${r.note}` : ""}
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
          )}

          {/* ----- LOGLAR ----- */}
          {activeSection === "logs" && (
            <Card ui={ui} id="admin-logs" style={{ padding: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ui.muted2 }}>Filtreler</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={logFilterAction}
                    onChange={(e) => {
                      setLogFilterAction(e.target.value);
                      setLogsPage(1);
                    }}
                    placeholder="Aksiyon filtresi..."
                    style={inputStyle(ui, { minWidth: 140 })}
                  />
                  <input
                    value={logQuery}
                    onChange={(e) => {
                      setLogQuery(e.target.value);
                      setLogsPage(1);
                    }}
                    placeholder="Log ara..."
                    style={inputStyle(ui, { minWidth: 180 })}
                  />
                </div>
              </div>
              {logsPageData.total === 0 ? (
                <EmptyState ui={ui} icon="📜" title="Henüz log yok" subtitle="Admin işlemleri burada görünür." />
              ) : (
                <>
                  <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                    {logsPageData.items.map((l) => {
                      const { title, color } = getLogDisplay(l.action, l.payload);
                      const isExpanded = expandedLogId === l.id;
                      return (
                        <div
                          key={l.id}
                          style={{
                            border: `1px solid ${ui.border}`,
                            borderRadius: 14,
                            padding: 12,
                            background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <LogBadge ui={ui} color={color} />
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{title}</span>
                            </div>
                            <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(l.createdAt)}</div>
                          </div>
                          <div style={{ marginTop: 8, fontSize: 13, color: ui.muted }}>Admin: @{l.admin}</div>
                          {Object.keys(l.payload || {}).length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <button
                                type="button"
                                onClick={() => setExpandedLogId(isExpanded ? null : l.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: ui.blueBtn || ui.blue,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                {isExpanded ? "Detayı gizle" : "Detayı gör"}
                              </button>
                              {isExpanded && (
                                <pre
                                  style={{
                                    marginTop: 8,
                                    padding: 10,
                                    borderRadius: 8,
                                    background: ui.mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)",
                                    fontSize: 11,
                                    overflow: "auto",
                                    color: ui.muted2,
                                  }}
                                >
                                  {JSON.stringify(l.payload, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
          )}
        </div>
      </div>
    </div>
  );
}
