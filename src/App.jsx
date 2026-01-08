import { useEffect, useMemo, useState } from "react";

/**
 * TurkGuide MVP (LocalStorage) — App.jsx (fixed, non-admin sees NO admin filters)
 * Tabs: İşletmeler, Haberler, HUB, Profil
 * Admin tab: only visible if username is in admin list (vicdan, sadullah, turkguide)
 */

const KEY_USER = "tg_user_v5";
const KEY_USERS = "tg_users_v5";
const KEY_POSTS = "tg_posts_v5";
const KEY_BIZ = "tg_biz_v5";
const KEY_BIZ_APPS = "tg_biz_apps_v5";
const KEY_ADMIN_LOG = "tg_admin_log_v5";
const KEY_ADMIN_CONFIG = "tg_admin_config_v5";
const KEY_ADMIN_INBOX = "tg_admin_inbox_v5"; // unread support (demo)
const KEY_ADMIN_BUGS = "tg_admin_bugs_v5";   // unread bugs (demo)

const DEFAULT_ADMINS = ["vicdan", "sadullah", "turkguide"];

function safeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function lsGet(key, fallback) { return safeParse(localStorage.getItem(key), fallback); }
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function now() { return Date.now(); }
function uid() { return `${Math.floor(Math.random() * 1e9)}-${Date.now()}`; }
function fmt(ts) { try { return new Date(ts).toLocaleString(); } catch { return ""; } }

const ui = {
  bg: "#07080c",
  top: "rgba(7,8,12,0.72)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.16)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.62)",
  muted2: "rgba(255,255,255,0.42)",
  dangerBg: "rgba(255,90,90,0.18)",
  okBg: "rgba(110,255,170,0.12)",
  warnBg: "rgba(255,200,90,0.14)",
  glow: "rgba(0,0,0,0.45)",
};

function Card({ children, style }) {
  return (
    <div
      style={{
        border: `1px solid ${ui.border}`,
        background: ui.panel,
        borderRadius: 18,
        padding: 16,
        boxShadow: `0 18px 40px ${ui.glow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "default", disabled, style, title, type }) {
  const base = {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${ui.border}`,
    background: ui.panel2,
    color: ui.text,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 850,
    letterSpacing: 0.2,
    opacity: disabled ? 0.55 : 1,
    userSelect: "none",
  };
  const v =
    variant === "danger"
      ? { background: ui.dangerBg, border: "1px solid rgba(255,90,90,0.35)" }
      : variant === "ok"
      ? { background: ui.okBg, border: "1px solid rgba(110,255,170,0.30)" }
      : variant === "warn"
      ? { background: ui.warnBg, border: "1px solid rgba(255,200,90,0.30)" }
      : null;

  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...(v || {}), ...(style || {}) }}
      title={title}
    >
      {children}
    </button>
  );
}

function Chip({ children, style }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${ui.border}`,
        background: "rgba(255,255,255,0.04)",
        color: ui.muted,
        fontSize: 12,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Modal({ open, title, onClose, children, width = 760 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 999,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: `min(${width}px, 100%)`,
          borderRadius: 20,
          border: `1px solid ${ui.border}`,
          background: "rgba(10,12,18,0.96)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.65)",
          padding: 16,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 950 }}>{title}</div>
          <Button onClick={onClose}>Kapat</Button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div style={{ fontSize: 32, fontWeight: 950, letterSpacing: -0.6, lineHeight: 1 }}>
        Turk
        <span
          style={{
            background: "linear-gradient(180deg, #7fe7ff 0%, #4aa8ff 55%, #2f66ff 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          G
        </span>
        uide
      </div>
    </div>
  );
}

function inp() {
  return {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.25)",
    color: ui.text,
    outline: "none",
  };
}

function isAdminUser(username, admins) {
  if (!username) return false;
  const u = String(username).trim().toLowerCase();
  return (admins || []).map((x) => String(x).toLowerCase()).includes(u);
}

function ensureSeed() {
  if (!lsGet(KEY_USERS, null)) {
    lsSet(KEY_USERS, [
      { id: uid(), username: "secer", tier: "free", createdAt: now() },
      { id: uid(), username: "vicdan", tier: "verified", createdAt: now() },
      { id: uid(), username: "sadullah", tier: "verified", createdAt: now() },
      { id: uid(), username: "turkguide", tier: "verified", createdAt: now() },
    ]);
  }
  if (!lsGet(KEY_ADMIN_CONFIG, null)) {
    lsSet(KEY_ADMIN_CONFIG, { admins: DEFAULT_ADMINS });
  }
  if (!lsGet(KEY_BIZ, null)) {
    lsSet(KEY_BIZ, [
      {
        id: uid(),
        name: "Secer Auto",
        city: "Los Angeles",
        category: "Araç Bayileri",
        plan: "premium",
        status: "approved",
        createdAt: now(),
        approvedAt: now(),
        approvedBy: "sadullah",
      },
      {
        id: uid(),
        name: "Turkish Market LA",
        city: "Los Angeles",
        category: "Türk Marketleri",
        plan: "free",
        status: "approved",
        createdAt: now(),
        approvedAt: now(),
        approvedBy: "vicdan",
      },
    ]);
  }
  if (!lsGet(KEY_BIZ_APPS, null)) lsSet(KEY_BIZ_APPS, []);
  if (!lsGet(KEY_POSTS, null)) lsSet(KEY_POSTS, []);
  if (!lsGet(KEY_ADMIN_LOG, null)) lsSet(KEY_ADMIN_LOG, []);
  if (!lsGet(KEY_ADMIN_INBOX, null)) lsSet(KEY_ADMIN_INBOX, [{ id: uid(), createdAt: now(), text: "Örnek destek mesajı (okunmamış)", read: false }]);
  if (!lsGet(KEY_ADMIN_BUGS, null)) lsSet(KEY_ADMIN_BUGS, [{ id: uid(), createdAt: now(), text: "Örnek hata bildirimi (okunmamış)", read: false }]);
}

function TopTabs({ active, setActive, showAdmin }) {
  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActive(id)}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background: active === id ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
        color: ui.text,
        cursor: "pointer",
        fontWeight: 900,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Tab id="biz" label="İşletmeler" />
      <Tab id="news" label="Haberler" />
      <Tab id="hub" label="HUB" />
      <Tab id="profile" label="Profil" />
      {showAdmin && <Tab id="admin" label="Admin" />}
    </div>
  );
}
export default function App() {
  const [booted, setBooted] = useState(false);

  // app state
  const [active, setActive] = useState("biz");
  const [user, setUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [biz, setBiz] = useState([]);
  const [bizApps, setBizApps] = useState([]);
  const [posts, setPosts] = useState([]);
  const [adminLog, setAdminLog] = useState([]);
  const [adminInbox, setAdminInbox] = useState([]);
  const [adminBugs, setAdminBugs] = useState([]);
  const [adminConfig, setAdminConfig] = useState({ admins: DEFAULT_ADMINS });

  // modals
  const [showAuth, setShowAuth] = useState(false);
  const [authName, setAuthName] = useState("");
  const [showBizApply, setShowBizApply] = useState(false);

  // admin modals (part 3/4)
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectCtx, setRejectCtx] = useState(null);
  const [rejectText, setRejectText] = useState("");
  const [showDeleteReason, setShowDeleteReason] = useState(false);
  const [deleteCtx, setDeleteCtx] = useState(null);
  const [reasonText, setReasonText] = useState("");

  // HUB
  const [composer, setComposer] = useState("");
  const [commentDraft, setCommentDraft] = useState({});

  // BOOT
  useEffect(() => {
    ensureSeed();

    setUsers(lsGet(KEY_USERS, []));
    setBiz(lsGet(KEY_BIZ, []));
    setBizApps(lsGet(KEY_BIZ_APPS, []));
    setPosts(lsGet(KEY_POSTS, []));
    setAdminLog(lsGet(KEY_ADMIN_LOG, []));
    setAdminInbox(lsGet(KEY_ADMIN_INBOX, []));
    setAdminBugs(lsGet(KEY_ADMIN_BUGS, []));
    setAdminConfig(lsGet(KEY_ADMIN_CONFIG, { admins: DEFAULT_ADMINS }));
    setUser(lsGet(KEY_USER, null));

    setBooted(true);
  }, []);

  // persist
  useEffect(() => { if (booted) lsSet(KEY_USERS, users); }, [users, booted]);
  useEffect(() => { if (booted) lsSet(KEY_BIZ, biz); }, [biz, booted]);
  useEffect(() => { if (booted) lsSet(KEY_BIZ_APPS, bizApps); }, [bizApps, booted]);
  useEffect(() => { if (booted) lsSet(KEY_POSTS, posts); }, [posts, booted]);
  useEffect(() => { if (booted) lsSet(KEY_ADMIN_LOG, adminLog); }, [adminLog, booted]);
  useEffect(() => { if (booted) lsSet(KEY_ADMIN_CONFIG, adminConfig); }, [adminConfig, booted]);
  useEffect(() => { if (booted) lsSet(KEY_ADMIN_INBOX, adminInbox); }, [adminInbox, booted]);
  useEffect(() => { if (booted) lsSet(KEY_ADMIN_BUGS, adminBugs); }, [adminBugs, booted]);
  useEffect(() => { if (booted) { if (user) lsSet(KEY_USER, user); } }, [user, booted]);

  const adminMode = useMemo(() => isAdminUser(user?.username, adminConfig.admins), [user, adminConfig]);

  // derived
  const approvedBiz = useMemo(() => biz.filter((b) => b.status === "approved"), [biz]);

  // auth helpers
  function requireAuth() {
    if (!user) {
      setShowAuth(true);
      return false;
    }
    return true;
  }

  function loginNow() {
    const name = (authName || "").trim();
    if (!name) return;

    let found = users.find((x) => String(x.username || "").toLowerCase() === name.toLowerCase());
    if (!found) {
      found = { id: uid(), username: name.toLowerCase(), tier: "free", createdAt: now() };
      setUsers((prev) => [found, ...prev]);
    }

    setUser(found);
    lsSet(KEY_USER, found);
    setShowAuth(false);
    setAuthName("");
  }

  function logoutNow() {
    localStorage.removeItem(KEY_USER);
    setUser(null);
    setActive("biz");
  }

  // business apply (USER)
  function openBizApply() {
    if (!requireAuth()) return;
    setShowBizApply(true);
  }

  function submitBizApplication(data) {
    if (!requireAuth()) return;

    const name = (data?.name || "").trim();
    const city = (data?.city || "").trim();
    const category = (data?.category || "").trim();
    const plan = (data?.plan || "free").trim().toLowerCase();

    if (!name || !city || !category) return alert("Lütfen işletme adı / şehir / kategori doldur.");

    setBizApps((prev) => [
      {
        id: uid(),
        createdAt: now(),
        status: "pending",
        applicant: user.username,
        name,
        city,
        category,
        plan: plan === "premium+" ? "premium+" : plan === "premium" ? "premium" : "free",
      },
      ...prev,
    ]);

    setShowBizApply(false);
  }

  // HUB (simple)
  function hubShare() {
    if (!requireAuth()) return;
    const text = (composer || "").trim();
    if (!text) return;

    setPosts((prev) => [
      {
        id: uid(),
        createdAt: now(),
        username: user.username,
        content: text,
        likes: 0,
        comments: [],
      },
      ...prev,
    ]);
    setComposer("");
  }

  function hubLike(postId) {
    if (!requireAuth()) return;
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)));
  }

  function hubComment(postId) {
    if (!requireAuth()) return;
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...(p.comments || []), { id: uid(), createdAt: now(), username: user.username, text }],
            }
          : p
      )
    );
    setCommentDraft((d) => ({ ...d, [postId]: "" }));
  }

  if (!booted) return null;

  return (
    <div style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>
      {/* TOP BAR */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
          background: ui.top,
          borderBottom: `1px solid ${ui.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}
        >
          <div />

          <Brand />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
            {user ? (
              <>
                {adminMode && <Chip>🛡️ Admin</Chip>}
                <Chip>👤 @{user.username}</Chip>
                <Button onClick={logoutNow}>Çıkış</Button>
              </>
            ) : (
              <Button onClick={() => setShowAuth(true)}>⤴︎ Giriş</Button>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 16px 12px" }}>
          <TopTabs active={active} setActive={setActive} showAdmin={adminMode} />
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: 16 }}>
        {/* ============ BUSINESS (USER) ============ */}
        {active === "biz" && (
          <div style={{ display: "grid", gap: 14 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 950 }}>İşletmenizi ekleyin, fırsatlardan yararlanın</div>
                  <div style={{ color: ui.muted, marginTop: 4 }}>Başvurun → admin onayı ile listelensin.</div>
                </div>
                <Button onClick={openBizApply}>İşletme Ekle</Button>
              </div>
              {!user && (
                <div style={{ marginTop: 10, color: ui.muted }}>
                  İşletme başvurusu için kayıt zorunlu. Butona basınca giriş ekranı açılır.
                </div>
              )}
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 950 }}>İşletmeler</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Chip>Onaylı: {approvedBiz.length}</Chip>
                </div>
              </div>

              {approvedBiz.length === 0 ? (
                <div style={{ marginTop: 14, color: ui.muted }}>Sonuç yok.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {approvedBiz.map((b) => (
                    <Card key={b.id} style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 950, fontSize: 16 }}>{b.name}</div>
                          <div style={{ color: ui.muted, fontSize: 13, marginTop: 4 }}>
                            {b.city} • {b.category} • {String(b.plan || "free")}
                          </div>
                        </div>
                        <Chip style={{ color: ui.muted }}>Onay: {b.approvedBy || "-"}</Chip>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ============ NEWS (placeholder) ============ */}
        {active === "news" && (
          <Card>
            <div style={{ fontSize: 22, fontWeight: 950 }}>Haberler</div>
            <div style={{ color: ui.muted, marginTop: 6 }}>Bu bölüm MVP’de örnek placeholder.</div>
          </Card>
        )}
        {/* ============ HUB ============ */}
        {active === "hub" && (
          <Card>
            <div style={{ fontSize: 22, fontWeight: 950 }}>HUB</div>
            <div style={{ color: ui.muted, marginTop: 6 }}>
              Amerika’yı ziyaret edenler deneyim paylaşır, gelecek olanlar bilgi alır. (Yalın & temiz)
            </div>

            <div style={{ marginTop: 12 }}>
              <textarea
                placeholder={user ? "Deneyimini yaz..." : "Paylaşmak için giriş yap"}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onFocus={() => {
                  if (!user) setShowAuth(true);
                }}
                style={{
                  width: "100%",
                  minHeight: 90,
                  borderRadius: 14,
                  border: `1px solid ${ui.border}`,
                  background: "rgba(0,0,0,0.25)",
                  color: ui.text,
                  padding: 12,
                  outline: "none",
                }}
              />
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button onClick={hubShare} variant="ok">Paylaş</Button>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              {posts.length === 0 ? (
                <div style={{ color: ui.muted }}>Henüz paylaşım yok.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {posts.map((p) => (
                    <Card key={p.id} style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <Chip>@{p.username}</Chip>
                        <Chip style={{ color: ui.muted2 }}>{fmt(p.createdAt)}</Chip>
                      </div>

                      <div style={{ marginTop: 8, lineHeight: 1.45 }}>{p.content}</div>

                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button onClick={() => hubLike(p.id)}>Like ({p.likes || 0})</Button>
                      </div>

                      {/* comments */}
                      <div style={{ marginTop: 12, borderTop: `1px solid ${ui.border}`, paddingTop: 12 }}>
                        <div style={{ color: ui.muted, fontWeight: 850, fontSize: 13 }}>
                          Yorumlar ({(p.comments || []).length})
                        </div>

                        {(p.comments || []).length > 0 && (
                          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                            {(p.comments || []).map((c) => (
                              <div key={c.id} style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${ui.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                  <span style={{ fontWeight: 900 }}>@{c.username}</span>
                                  <span style={{ color: ui.muted2, fontSize: 12 }}>{fmt(c.createdAt)}</span>
                                </div>
                                <div style={{ marginTop: 6, color: ui.text }}>{c.text}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input
                            value={commentDraft[p.id] || ""}
                            placeholder={user ? "Yorum yaz..." : "Yorum için giriş yap"}
                            onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                            onFocus={() => {
                              if (!user) setShowAuth(true);
                            }}
                            style={{
                              flex: 1,
                              minWidth: 220,
                              padding: 12,
                              borderRadius: 12,
                              border: `1px solid ${ui.border}`,
                              background: "rgba(0,0,0,0.25)",
                              color: ui.text,
                              outline: "none",
                            }}
                          />
                          <Button onClick={() => hubComment(p.id)} variant="ok">Gönder</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ============ PROFILE ============ */}
        {active === "profile" && (
          <Card>
            <div style={{ fontSize: 22, fontWeight: 950 }}>Profil</div>
            <div style={{ color: ui.muted, marginTop: 6 }}>Hesap bilgilerin.</div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {user ? (
                <>
                  <Card style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ fontWeight: 950 }}>@{user.username}</div>
                    <div style={{ color: ui.muted, marginTop: 6 }}>Üyelik: {user.tier || "free"}</div>
                    <div style={{ color: ui.muted2, marginTop: 6 }}>Kayıt: {fmt(user.createdAt)}</div>
                  </Card>

                  <Button onClick={logoutNow} variant="danger">Çıkış Yap</Button>
                </>
              ) : (
                <div style={{ color: ui.muted }}>
                  Profil için giriş yapmalısın. <Button onClick={() => setShowAuth(true)}>Giriş</Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ============ ADMIN (ONLY ADMINS) ============ */}
        {active === "admin" && adminMode && (
          <div style={{ display: "grid", gap: 14 }}>
            <Card>
              <div style={{ fontSize: 22, fontWeight: 950 }}>Admin Dashboard</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>Özet + işletme başvuruları + kullanıcılar + log.</div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Chip>Toplam İşletme: {biz.length}</Chip>
                <Chip>Onaylı: {biz.filter((b) => b.status === "approved").length}</Chip>
                <Chip>Bekleyen: {bizApps.length}</Chip>
                <Chip>Silinen: {biz.filter((b) => b.status === "deleted").length}</Chip>
                <Chip>Toplam Kullanıcı: {users.length}</Chip>
                <Chip>Okunmamış Destek: {adminInbox.filter((x) => !x.read).length}</Chip>
                <Chip>Okunmamış Hata: {adminBugs.filter((x) => !x.read).length}</Chip>
              </div>
            </Card>

            {/* Pending applications */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 950 }}>Bekleyen İşletme Başvuruları</div>
                  <div style={{ color: ui.muted, marginTop: 4 }}>Manuel onay / reddet (sebep zorunlu).</div>
                </div>
                <Chip>Bekleyen: {bizApps.length}</Chip>
              </div>

              {bizApps.length === 0 ? (
                <div style={{ marginTop: 12, color: ui.muted }}>Bekleyen başvuru yok.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {bizApps.map((a) => (
                    <Card key={a.id} style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 950, fontSize: 16 }}>{a.name}</div>
                          <div style={{ color: ui.muted, marginTop: 4, fontSize: 13 }}>
                            {a.city} • {a.category} • {a.plan || "free"}
                          </div>
                          <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                            Başvuran: <b>{a.applicant}</b> • {fmt(a.createdAt)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <Button
                            variant="ok"
                            onClick={() => {
                              // approve (admin username kayıt)
                              const newBiz = {
                                id: uid(),
                                name: a.name,
                                city: a.city,
                                category: a.category,
                                plan: a.plan || "free",
                                status: "approved",
                                createdAt: a.createdAt,
                                applicant: a.applicant,
                                approvedAt: now(),
                                approvedBy: user.username,
                              };
                              setBiz((prev) => [newBiz, ...prev]);
                              setBizApps((prev) => prev.filter((x) => x.id !== a.id));
                              setAdminLog((prev) => [
                                { id: uid(), createdAt: now(), admin: user.username, action: "BUSINESS_APPROVE", target: a.name, reason: "" },
                                ...prev,
                              ]);
                            }}
                          >
                            Onayla
                          </Button>

                          <Button
                            variant="danger"
                            onClick={() => {
                              setRejectCtx(a);
                              setRejectText("");
                              setShowRejectReason(true);
                            }}
                          >
                            Reddet
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Businesses management quick list */}
            <Card>
              <div style={{ fontSize: 18, fontWeight: 950 }}>İşletmeler (Onaylı / Silinen)</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>
                Silme işlemi: sebep zorunlu + silen admin username log’da kalır.
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {biz
                  .filter((b) => b.status !== "pending")
                  .slice(0, 12)
                  .map((b) => (
                    <Card key={b.id} style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 950 }}>{b.name}</div>
                          <div style={{ color: ui.muted, marginTop: 4, fontSize: 13 }}>
                            {b.city} • {b.category} • {String(b.plan || "free")} •{" "}
                            {b.status === "approved" ? "Onaylı" : "Silinmiş"}
                          </div>
                          {b.status === "approved" && (
                            <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                              Onay: {b.approvedBy || "-"} • {b.approvedAt ? fmt(b.approvedAt) : "-"}
                            </div>
                          )}
                          {b.status === "deleted" && (
                            <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                              Silen: {b.deletedBy || "-"} • {b.deletedAt ? fmt(b.deletedAt) : "-"} • Sebep: {b.deleteReason || "-"}
                            </div>
                          )}
                        </div>

                        {b.status === "approved" && (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Button
                              variant="danger"
                              onClick={() => openDelete("biz", b)}
                              title="Sil (sebep zorunlu)"
                            >
                              Sil
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>

              <div style={{ color: ui.muted2, marginTop: 10, fontSize: 12 }}>
                Not: Detaylı filtreli işletme yönetimi (bekleyen/onaylı/silinen + plan) PART 4’te tamamlanıyor.
              </div>
            </Card>

            {/* Users management */}
            <Card>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Kullanıcılar</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>
                Kullanıcı silme: sebep zorunlu + silen admin username log’da kalır.
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Chip>Free: {users.filter((u) => (u.tier || "free") === "free").length}</Chip>
                <Chip>Elit: {users.filter((u) => (u.tier || "") === "elit").length}</Chip>
                <Chip>Verified: {users.filter((u) => (u.tier || "") === "verified").length}</Chip>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {users.slice(0, 12).map((u) => (
                  <Card key={u.id} style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 950 }}>@{u.username}</div>
                        <div style={{ color: ui.muted, marginTop: 4, fontSize: 13 }}>
                          Tier: {u.tier || "free"} • Kayıt: {fmt(u.createdAt)}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Button
                          variant="danger"
                          onClick={() => openDelete("user", u)}
                          title="Kullanıcı Sil (sebep zorunlu)"
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div style={{ color: ui.muted2, marginTop: 10, fontSize: 12 }}>
                Not: Tam kullanıcı arama + filtre PART 4’te tamamlanıyor.
              </div>
            </Card>

            {/* Admin Settings (admins editable) */}
            <Card>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Admin Ayarları</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>
                Adminler şu an: <b>vicdan</b>, <b>sadullah</b>, <b>turkguide</b> (istediğimizde değiştirilebilir).
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div style={{ color: ui.muted, fontSize: 13 }}>
                  Admin kullanıcı adlarını virgülle yaz: <span style={{ color: ui.muted2 }}>(örn: vicdan, sadullah, turkguide)</span>
                </div>
                <input
                  value={(adminConfig.admins || []).join(", ")}
                  onChange={(e) => {
                    const raw = e.target.value || "";
                    const list = raw
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean);
                    setAdminConfig((prev) => ({ ...prev, admins: list.length ? list : DEFAULT_ADMINS }));
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${ui.border}`,
                    background: "rgba(0,0,0,0.25)",
                    color: ui.text,
                    outline: "none",
                  }}
                />
                <div style={{ color: ui.muted2, fontSize: 12 }}>
                  Bu liste LocalStorage’a kaydolur. Admin olmayan kullanıcılar “Admin” tabını göremez.
                </div>
              </div>
            </Card>

            {/* Admin Logs */}
            <Card>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Admin Log</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>
                Onay / red / silme işlemleri burada tutulur.
              </div>

              {adminLog.length === 0 ? (
                <div style={{ marginTop: 12, color: ui.muted }}>Henüz log yok.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {adminLog.slice(0, 15).map((l) => (
                    <div
                      key={l.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1px solid ${ui.border}`,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div>
                          <b>@{l.admin}</b> • <span style={{ color: ui.muted }}>{l.action}</span> •{" "}
                          <span style={{ color: ui.text }}>{l.target}</span>
                        </div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(l.createdAt)}</div>
                      </div>
                      {l.reason ? <div style={{ marginTop: 6, color: ui.muted }}>Sebep: {l.reason}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ====== MODALS will continue in PART 4 ====== */}

      {/* AUTH MODAL */}
      <Modal open={showAuth} title="Giriş" onClose={() => setShowAuth(false)}>
        <div style={{ color: ui.muted, marginBottom: 10 }}>
          Platformda paylaşım, beğeni, yorum ve işletme başvurusu işlemlerini gerçekleştirebilmek için kullanıcı girişi zorunludur.
        </div>

        <input
          placeholder="Kullanıcı adı (örn: sadullah)"
          value={authName}
          onChange={(e) => setAuthName(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${ui.border}`,
            background: "rgba(0,0,0,0.25)",
            color: ui.text,
            outline: "none",
          }}
        />

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="ok" onClick={loginNow}>Giriş Yap</Button>
          <Button onClick={() => setShowAuth(false)}>İptal</Button>
        </div>
      </Modal>

      {/* BUSINESS APPLY MODAL */}
      <Modal open={showBizApply} title="İşletme Başvurusu" onClose={() => setShowBizApply(false)}>
        <div style={{ color: ui.muted, marginBottom: 10 }}>
          Başvurunuz admin onayından sonra “Onaylı İşletmeler” listesinde görünür.
        </div>
        <BizApplyForm
          onSubmit={(data) => submitBizApplication(data)}
          onCancel={() => setShowBizApply(false)}
        />
      </Modal>

      {/* REJECT REASON MODAL */}
      <Modal open={showRejectReason} title="Reddetme Sebebi" onClose={() => setShowRejectReason(false)}>
        <div style={{ color: ui.muted, marginBottom: 8 }}>
          Reddetme sebebi zorunlu. Log’a kaydedilir.
        </div>

        <textarea
          value={rejectText}
          onChange={(e) => setRejectText(e.target.value)}
          placeholder="Sebep yaz..."
          style={{
            width: "100%",
            minHeight: 90,
            padding: 10,
            borderRadius: 12,
            border: `1px solid ${ui.border}`,
            background: "rgba(0,0,0,0.25)",
            color: ui.text,
            outline: "none",
          }}
        />

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant="danger"
            onClick={() => {
              if (!rejectCtx) return;
              const r = (rejectText || "").trim();
              if (!r) return alert("Sebep yazmalısın.");
              // reject + log
              setBizApps((prev) => prev.filter((x) => x.id !== rejectCtx.id));
              setAdminLog((prev) => [
                { id: uid(), createdAt: now(), admin: user?.username || "-", action: "BUSINESS_REJECT", target: rejectCtx.name, reason: r },
                ...prev,
              ]);
              setShowRejectReason(false);
              setRejectCtx(null);
              setRejectText("");
            }}
          >
            Reddet
          </Button>

          <Button onClick={() => setShowRejectReason(false)}>İptal</Button>
        </div>
      </Modal>

      {/* DELETE REASON MODAL */}
      <Modal open={showDeleteReason} title="Silme Sebebi" onClose={() => setShowDeleteReason(false)}>
        <div style={{ color: ui.muted, marginBottom: 8 }}>
          Silme sebebi zorunlu. Log’a admin kullanıcı adı + sebep kaydedilir.
        </div>

        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          placeholder="Sebep yaz..."
          style={{
            width: "100%",
            minHeight: 90,
            padding: 10,
            borderRadius: 12,
            border: `1px solid ${ui.border}`,
            background: "rgba(0,0,0,0.25)",
            color: ui.text,
            outline: "none",
          }}
        />

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant="danger"
            onClick={() => {
              const r = (reasonText || "").trim();
              if (!r) return alert("Sebep yazmalısın.");
              if (!deleteCtx) return;

              if (deleteCtx.type === "biz") {
                const b = deleteCtx.item;
                setBiz((prev) =>
                  prev.map((x) =>
                    x.id === b.id
                      ? { ...x, status: "deleted", deletedAt: now(), deletedBy: user.username, deleteReason: r }
                      : x
                  )
                );
                setAdminLog((prev) => [
                  { id: uid(), createdAt: now(), admin: user.username, action: "BUSINESS_DELETE", target: b.name, reason: r },
                  ...prev,
                ]);
              }

              if (deleteCtx.type === "user") {
                const u = deleteCtx.item;
                setUsers((prev) => prev.filter((x) => x.id !== u.id));
                setAdminLog((prev) => [
                  { id: uid(), createdAt: now(), admin: user.username, action: "USER_DELETE", target: u.username, reason: r },
                  ...prev,
                ]);
              }

              setShowDeleteReason(false);
              setDeleteCtx(null);
              setReasonText("");
            }}
          >
            Sil
          </Button>

          <Button onClick={() => setShowDeleteReason(false)}>İptal</Button>
        </div>
      </Modal>

      {/* FOOTER */}
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "12px 16px 28px",
          color: ui.muted2,
          fontSize: 12,
          textAlign: "center",
        }}
      >
        TurkGuide • MVP (LocalStorage) • v0.4
      </div>
    </div>
  );

  /* ===========================
      FUNCTIONS (App scope)
  =========================== */

  function requireAuth() {
    if (!user) {
      setShowAuth(true);
      return false;
    }
    return true;
  }

  function loginNow() {
    const name = (authName || "").trim();
    if (!name) return;

    let found = users.find((x) => (x.username || "").toLowerCase() === name.toLowerCase());
    if (!found) {
      found = { id: uid(), username: name, tier: "free", createdAt: now() };
      setUsers((prev) => [...prev, found]);
    }
    setUser(found);
    lsSet(KEY_USER, found);
    setShowAuth(false);
    setAuthName("");
  }

  function logoutNow() {
    localStorage.removeItem(KEY_USER);
    setUser(null);
    setActive("biz");
  }

  function submitBizApplication(data) {
    if (!requireAuth()) return;

    const name = (data?.name || "").trim();
    const city = (data?.city || "").trim();
    const category = (data?.category || "").trim();
    const plan = (data?.plan || "free").trim();

    if (!name || !city || !category) return alert("Lütfen işletme adı / şehir / kategori doldur.");

    setBizApps((prev) => [
      { id: uid(), createdAt: now(), status: "pending", applicant: user.username, name, city, category, plan },
      ...prev,
    ]);
    setShowBizApply(false);
  }

  function hubShare() {
    if (!requireAuth()) return;
    const text = (composer || "").trim();
    if (!text) return;

    const p = { id: uid(), createdAt: now(), username: user.username, content: text, likes: 0, comments: [] };
    setPosts((prev) => [p, ...prev]);
    setComposer("");
  }

  function hubLike(postId) {
    if (!requireAuth()) return;
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)));
  }

  function hubComment(postId) {
    if (!requireAuth()) return;
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), { id: uid(), createdAt: now(), username: user.username, text }] }
          : p
      )
    );
    setCommentDraft((d) => ({ ...d, [postId]: "" }));
  }

  function openDelete(type, item) {
    if (!adminMode) return;
    setDeleteCtx({ type, item });
    setReasonText("");
    setShowDeleteReason(true);
  }
}

/* ===========================
    SUB COMPONENTS
=========================== */

function BizApplyForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [plan, setPlan] = useState("free");

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input placeholder="İşletme adı" value={name} onChange={(e) => setName(e.target.value)} style={inpStyle()} />
      <input placeholder="Şehir (örn: Los Angeles)" value={city} onChange={(e) => setCity(e.target.value)} style={inpStyle()} />
      <input placeholder="Kategori (örn: Restoran)" value={category} onChange={(e) => setCategory(e.target.value)} style={inpStyle()} />

      <select value={plan} onChange={(e) => setPlan(e.target.value)} style={inpStyle()}>
        <option value="free">Free</option>
        <option value="premium">Premium</option>
        <option value="premium+">Premium+</option>
        <option value="platinum">Platinum</option>
      </select>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="ok" onClick={() => onSubmit({ name, city, category, plan })}>Başvuru Gönder</Button>
        <Button onClick={onCancel}>İptal</Button>
      </div>
    </div>
  );
}

function inpStyle() {
  return {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.25)",
    color: ui.text,
    outline: "none",
  };
}
