import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

/**
 * TurkGuide MVP — Single-file App.jsx (LocalStorage)
 * ✅ UI: 2. görseldeki Landing/Hero + Search + Segment + Kategori kartları (İşletmeler ekranında)
 * ✅ Mevcut LocalStorage mantığı korunur: users/biz/hub/admin/dm/randevu
 */

const KEY = {
  USER: "tg_user_v6",
  USERS: "tg_users_v6",
  BIZ: "tg_biz_v6",
  BIZ_APPS: "tg_biz_apps_v6",
  POSTS: "tg_posts_v6",
  DMS: "tg_dms_v6",
  APPTS: "tg_appts_v6",
  ADMIN_LOG: "tg_admin_log_v6",
  ADMIN_CONFIG: "tg_admin_config_v6",
  ADMIN_SECRET: "tg_admin_secret_v6",
  THEME: "tg_theme_v6", // "system" | "light" | "dark"
  ADMIN_UNLOCK: "tg_admin_unlock_v6",
  SETTINGS: "tg_settings_v6", // mesaj ayarları vs.
};

const DEFAULT_ADMINS = ["vicdan", "sadullah", "turkguide"];

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function lsGet(key, fallback) {
  return safeParse(localStorage.getItem(key), fallback);
}
function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function now() {
  return Date.now();
}
function uid() {
  return `${Math.floor(Math.random() * 1e9)}-${Date.now()}`;
}
function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}
function normalizeUsername(s) {
  return String(s || "").trim().toLowerCase();
}
function isAdminUser(username, admins) {
  const u = normalizeUsername(username);
  return (admins || []).map((x) => normalizeUsername(x)).includes(u);
}

function ensureSeed() {
  const users = lsGet(KEY.USERS, null);
  if (!users || !Array.isArray(users) || users.length === 0) {
 lsSet(KEY.USERS, [
  {
    id: uid(),
    username: "secer",
    email: "secer@example.com",
    providers: {},
    tier: "Onaylı İşletme",
    xp: 120,
    createdAt: now(),
    avatar: "",
  },
  {
    id: uid(),
    username: "vicdan",
    email: "vicdan@example.com",
    providers: { google: { sub: "google_seed_vicdan" } },
    tier: "verified",
    xp: 9000,
    createdAt: now(),
    avatar: "",
  },
  {
    id: uid(),
    username: "sadullah",
    email: "sadullah@example.com",
    providers: { apple: { sub: "apple_seed_sadullah" } },
    tier: "verified",
    xp: 12000,
    createdAt: now(),
    avatar: "",
  },
  {
    id: uid(),
    username: "turkguide",
    email: "admin@turkguide.app",
    providers: { email: true },
    tier: "verified",
    xp: 15000,
    createdAt: now(),
    avatar: "",
  },
]);
  }

  const cfg = lsGet(KEY.ADMIN_CONFIG, null);
  if (!cfg || !Array.isArray(cfg.admins) || cfg.admins.length === 0) {
    lsSet(KEY.ADMIN_CONFIG, { admins: DEFAULT_ADMINS });
  }

  const biz = lsGet(KEY.BIZ, null);
  if (!biz || !Array.isArray(biz) || biz.length === 0) {
    lsSet(KEY.BIZ, [
      {
        id: uid(),
        name: "Secer Auto",
        ownerUsername: "sadullah",
        category: "Araç Bayileri",
        plan: "Onaylı İşletme",
        status: "approved",
        address: "Los Angeles, CA",
        phone: "+1 310 555 0101",
        city: "Los Angeles, California",
        desc: "Araç alım-satım • Finans & sigorta yönlendirme • Güvenilir süreç",
        avatar: "",
        createdAt: now(),
        approvedAt: now(),
        approvedBy: "sadullah",
      },
      {
        id: uid(),
        name: "Turkish Market LA",
        ownerUsername: "vicdan",
        category: "Türk Marketleri",
        plan: "Onaylı İşletme",
        status: "approved",
        address: "Los Angeles, CA",
        phone: "+1 213 555 0199",
        city: "Los Angeles, California",
        desc: "Türk ürünleri • Taze ürün • Haftalık indirimler",
        avatar: "",
        createdAt: now(),
        approvedAt: now(),
        approvedBy: "vicdan",
      },
      {
        id: uid(),
        name: "AydinStay",
        ownerUsername: "secer",
        category: "Konaklama",
        plan: "Onaylı İşletme+",
        status: "approved",
        address: "West Hollywood, CA",
        phone: "+1 424 555 0133",
        city: "Los Angeles, California",
        desc: "Kısa dönem konaklama • Temiz ve güvenilir • Türkçe iletişim",
        avatar: "",
        createdAt: now(),
        approvedAt: now(),
        approvedBy: "sadullah",
      },
    ]);
  }

  if (!lsGet(KEY.BIZ_APPS, null)) lsSet(KEY.BIZ_APPS, []);
  if (!lsGet(KEY.POSTS, null)) lsSet(KEY.POSTS, []);
  if (!lsGet(KEY.DMS, null)) lsSet(KEY.DMS, []);
  if (!lsGet(KEY.APPTS, null)) lsSet(KEY.APPTS, []);
  if (!lsGet(KEY.ADMIN_LOG, null)) lsSet(KEY.ADMIN_LOG, []);
  if (!lsGet(KEY.THEME, null)) lsSet(KEY.THEME, "system");

  if (!lsGet(KEY.SETTINGS, null)) {
    lsSet(KEY.SETTINGS, {
      chatEnabled: true,
      readReceipts: true,
      msgNotifications: true,
    });
  }
  // 🔐 Admin secret yoksa oluştur (ilk kurulum için)
if (!lsGet(KEY.ADMIN_SECRET, null)) {
  lsSet(KEY.ADMIN_SECRET, uid() + "-" + uid());
}
// 🔒 Admin panel kilidi (varsayılan: kapalı)
if (!lsGet(KEY.ADMIN_UNLOCK, null)) {
  lsSet(KEY.ADMIN_UNLOCK, false);
}
}

function useSystemTheme() {
  const [system, setSystem] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return system;
}

/* ====== UI TOKENS (2. görsel hissi) ====== */
function themeTokens(mode) {
  const dark = {
    mode: "dark",
    bg: "#07080c",
    top: "rgba(7,8,12,0.72)",
    panel: "rgba(255,255,255,0.06)",
    panel2: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.14)",
    text: "rgba(255,255,255,0.92)",
    muted: "rgba(255,255,255,0.62)",
    muted2: "rgba(255,255,255,0.42)",
    glow: "rgba(0,0,0,0.55)",
    green: "rgba(110,255,170,0.12)",
    orange: "rgba(255,200,90,0.14)",
    red: "rgba(255,90,90,0.18)",
    blue: "#4f7cff",
    blueBtn: "rgba(80,120,255,0.20)",
    field: "rgba(255,255,255,0.06)",
    field2: "rgba(10,12,18,0.85)",
    whitePanel: "rgba(242,243,245,1)",
  };

  const light = {
    mode: "light",
    bg: "#f6f7fb",
    top: "rgba(255,255,255,0.72)",
    panel: "rgba(0,0,0,0.04)",
    panel2: "rgba(0,0,0,0.06)",
    border: "rgba(0,0,0,0.14)",
    text: "rgba(0,0,0,0.88)",
    muted: "rgba(0,0,0,0.60)",
    muted2: "rgba(0,0,0,0.40)",
    glow: "rgba(0,0,0,0.10)",
    green: "rgba(60,180,110,0.14)",
    orange: "rgba(220,150,40,0.16)",
    red: "rgba(220,60,60,0.14)",
    blue: "#2f66ff",
    blueBtn: "rgba(80,120,255,0.16)",
    field: "rgba(255,255,255,0.85)",
    field2: "rgba(255,255,255,0.95)",
    whitePanel: "rgba(242,243,245,1)",
  };

  return mode === "light" ? light : dark;
}

/* ====== COMPONENTS ====== */
function Brand({ ui }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div style={{ fontSize: 44, fontWeight: 950, letterSpacing: -0.8, lineHeight: 1, color: ui.text }}>
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

function Card({ ui, children, style }) {
  return (
    <div
      style={{
        border: `1px solid ${ui.border}`,
        background: ui.panel,
        borderRadius: 18,
        padding: 16,
        boxShadow: `0 18px 50px ${ui.glow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ ui, children, onClick, variant = "default", disabled, style, title, type }) {
  const base = {
    padding: "10px 16px",
    borderRadius: 999,
    border: `1px solid ${ui.border}`,
    background: ui.panel2,
    color: ui.text,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    letterSpacing: 0.2,
    opacity: disabled ? 0.55 : 1,
    userSelect: "none",
  };
  const v =
    variant === "ok"
      ? { background: ui.green }
      : variant === "warn"
      ? { background: ui.orange }
      : variant === "danger"
      ? { background: ui.red }
      : variant === "blue"
      ? { background: ui.blueBtn }
      : variant === "solidBlue"
      ? { background: ui.blue, border: "1px solid rgba(255,255,255,0.10)" }
      : null;

  return (
    <button type={type || "button"} onClick={onClick} disabled={disabled} style={{ ...base, ...(v || {}), ...(style || {}) }} title={title}>
      {children}
    </button>
  );
}

function Chip({ ui, children, active, onClick, style, title }) {
  const clickable = typeof onClick === "function";
  return (
    <span
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${ui.border}`,
        background: active
          ? ui.mode === "light"
            ? "rgba(0,0,0,0.08)"
            : "rgba(255,255,255,0.10)"
          : ui.mode === "light"
          ? "rgba(0,0,0,0.04)"
          : "rgba(255,255,255,0.04)",
        color: ui.text,
        fontSize: 13,
        fontWeight: 900,
        cursor: clickable ? "pointer" : "default",
        userSelect: "none",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Modal({ ui, open, title, onClose, children, width = 860, zIndex = 999 }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: `min(${width}px, 100%)`,
          borderRadius: 22,
          border: `1px solid ${ui.border}`,
          background: ui.mode === "light" ? "rgba(255,255,255,0.98)" : "rgba(10,12,18,0.96)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.35)",
          padding: 16,
          color: ui.text,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 950 }}>{title}</div>
          <Button ui={ui} onClick={onClose}>Kapat</Button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function inputStyle(ui, extra = {}) {
  return {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: ui.field,
    color: ui.text,
    outline: "none",
    ...extra,
  };
}

function Avatar({ ui, src, size = 44, label }) {
  const bg = ui.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  return (
    <div
      title={label || ""}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(12, Math.floor(size / 3)),
        border: `1px solid ${ui.border}`,
        background: bg,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontWeight: 950, color: ui.muted }}>{(label || "TG").slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

function Divider({ ui }) {
  return <div style={{ height: 1, background: ui.mode === "light" ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)", margin: "16px 0" }} />;
}

// ====== ICONS (SVG) — kurumsal / aynı çizgi kalınlığı ======
function IconBase({ children, size = 22, strokeWidth = 2, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function BellIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </IconBase>
  );
}

function ChatIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </IconBase>
  );
}

function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-1.41 3.41h-0.2a1.65 1.65 0 0 0-1.58 1.12 2 2 0 0 1-3.8 0 1.65 1.65 0 0 0-1.58-1.12H10a2 2 0 0 1-1.41-3.41l.06-.06A1.65 1.65 0 0 0 9 15.4a1.65 1.65 0 0 0-1.82-.33l-.06.06A2 2 0 0 1 3.7 13.7v-.2A1.65 1.65 0 0 0 2.58 11.9a2 2 0 0 1 0-3.8A1.65 1.65 0 0 0 3.7 6.6v-.2A2 2 0 0 1 6.1 4.59l.06.06A1.65 1.65 0 0 0 7.98 5a1.65 1.65 0 0 0 1.4-1.06l.02-.08A2 2 0 0 1 11.3 2h.4a2 2 0 0 1 1.9 1.86l.02.08A1.65 1.65 0 0 0 15.02 5a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.41 6.1v.2A1.65 1.65 0 0 0 20.53 8.1a2 2 0 0 1 0 3.8A1.65 1.65 0 0 0 19.41 13.7v.2A1.65 1.65 0 0 0 19.4 15z" />
    </IconBase>
  );
}

function LoginIcon(props) {
  // arrow into bracket
  return (
    <IconBase {...props}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </IconBase>
  );
}

function LogoutIcon(props) {
  // arrow out of bracket
  return (
    <IconBase {...props}>
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
      <path d="M14 17l5-5-5-5" />
      <path d="M19 12H7" />
    </IconBase>
  );
}

/** Read file as base64 for avatar uploads */
function useFileToBase64() {
  const pickRef = useRef(null);
  function pick() {
    pickRef.current?.click();
  }
  function Input({ onBase64 }) {
    return (
      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            const b64 = String(reader.result || "");
            onBase64?.(b64);
            e.target.value = "";
          };
          reader.readAsDataURL(f);
        }}
      />
    );
  }
  return { pick, Input };
}

function ToggleRow({ ui, label, desc, value, onToggle }) {
  return (
    <div
      style={{
        border: `1px solid ${ui.border}`,
        background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
        borderRadius: 16,
        padding: 14,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 240 }}>
        <div style={{ fontWeight: 950 }}>{label}</div>
        {desc ? <div style={{ color: ui.muted, marginTop: 4, fontSize: 13 }}>{desc}</div> : null}
      </div>
      <Button ui={ui} variant={value ? "ok" : "danger"} onClick={onToggle} style={{ minWidth: 140 }}>
        {value ? "Açık" : "Kapalı"}
      </Button>
    </div>
  );
}

/* ====== Landing (2. görsel) ====== */
/* ====== Landing (2. görsel) ====== */
function LandingHero({ ui, active, setActive, searchText, setSearchText, onSearch }) {
  const segWrap = {
    marginTop: 40,
    background: ui.whitePanel,
    borderRadius: 18,
    padding: 6,
    border: ui.mode === "light" ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    width: "100%",
    boxSizing: "border-box",

    // ✅ HUB kaybolmasın: flex yerine grid (mobilde 3’ü de sığdırır)
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 6,
  };

  const Seg = ({ id, icon, label }) => {
  const isActive = active === id;

  return (
    <div
      onClick={() => setActive(id)}
      style={{
        minWidth: 0,
        padding: "12px 8px",
        borderRadius: 14,
        background: isActive ? "#fff" : "transparent",
        color: isActive ? "#000" : "rgba(0,0,0,0.55)",

        // ✅ Mobilde yazı kesilmesin: icon üstte, yazı altta 2 satıra kadar
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,

        fontWeight: 950,
        cursor: "pointer",
        userSelect: "none",
        textAlign: "center",
      }}
    >
      <span style={{ opacity: isActive ? 1 : 0.8, lineHeight: 1 }}>{icon}</span>

      <span
        style={{
          maxWidth: "100%",
          fontSize: 13,
          lineHeight: 1.1,

          // ✅ kesme yok, wrap var
          whiteSpace: "normal",
          overflow: "hidden",
          textOverflow: "clip",
          wordBreak: "break-word",
        }}
      >
        {label}
      </span>
    </div>
  );
};

  return (
  // ✅ FULL-WIDTH HERO (gri ambians sağ-sol tam dolar)
  <div
    style={{
      width: "100vw",
      marginLeft: "calc(50% - 50vw)",
      marginRight: "calc(50% - 50vw)",
      padding: "70px 0 28px",
      overflowX: "hidden",
      background:
        ui.mode === "light"
          ? "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 75%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 75%)",
    }}
  >
    {/* ✅ içerik max-width burada kalsın */}
    <div
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "0 16px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
        <div style={{ display: "grid", placeItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 999,
              background: "#fff",
              color: "#0b0c10",
              fontWeight: 950,
              fontSize: 12,
              letterSpacing: 0.2,
              boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
              maxWidth: "100%",
            }}
          >
            <span style={{ opacity: 0.65 }}>●</span> AMERİKA’NIN EN BÜYÜK TÜRK REHBERİ
          </div>

          <h1
            style={{
              marginTop: 26,
              textAlign: "center",
              fontWeight: 950,
              color: ui.blue,
              lineHeight: 1.05,
              fontSize: "clamp(32px, 8.5vw, 64px)",
              padding: "0 12px",
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: "100%",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            Discover
            <br />
            Turkish Businesses
          </h1>

          <div style={{ marginTop: 14, color: ui.muted, fontSize: 18, textAlign: "center" }}>
            Amerika'nın her köşesinden Türk işletmeleri ve profesyonelleri keşfedin
          </div>

          <div
            style={{
              marginTop: 34,
              width: "100%",
              maxWidth: 760,
              background: ui.mode === "light" ? "rgba(255,255,255,0.88)" : ui.field2,
              border: `1px solid ${ui.border}`,
              borderRadius: 999,
              padding: 12,
              display: "flex",
              flexWrap: "nowrap",
              boxSizing: "border-box",
              gap: 10,
              alignItems: "center",
              boxShadow: "0 28px 80px rgba(0,0,0,0.50)",
            }}
          >
            <span style={{ opacity: 0.65, fontSize: 18, paddingLeft: 6 }}>🔍</span>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tüm kategorilerde ara..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: ui.text,
                fontSize: 16,
                padding: 10,
                minWidth: 0,
              }}
            />
            <Button ui={ui} variant="solidBlue" onClick={onSearch} style={{ padding: "12px 18px", flex: "0 0 auto" }}>
              Ara
            </Button>
          </div>

          <div style={{ width: "100%", maxWidth: 1100, boxSizing: "border-box" }}>
            <div style={segWrap}>
              <Seg id="biz" icon="🏢" label="İŞLETMELER" />
              <Seg id="news" icon="📰" label="HABERLER" />
              <Seg id="hub" icon="👥" label="HUB" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryGrid({ ui, counts, onPickCategory }) {
  const items = [
    { key: "Avukatlar", icon: "⚖️", title: "Avukatlar" },
    { key: "Doktorlar & Sağlık Hizmetleri", icon: "🩺", title: "Doktorlar & Sağlık Hizmetleri" },
    { key: "Restoranlar", icon: "🍽️", title: "Restoranlar" },
    { key: "Emlak Hizmetleri", icon: "🏠", title: "Emlak Hizmetleri" },
    { key: "Araç Hizmetleri", icon: "🔧", title: "Araç Hizmetleri" },

    { key: "Kuaförler", icon: "✂️", title: "Kuaförler" },
    { key: "Berberler", icon: "💈", title: "Berberler" },
    { key: "Araç Kiralama", icon: "🔑", title: "Araç Kiralama" },
    { key: "Araç Bayileri", icon: "🚗", title: "Araç Bayileri" },
    { key: "Türk Marketleri", icon: "🛒", title: "Türk Marketleri" },

    { key: "Okullar & Eğitim Hizmetleri", icon: "📘", title: "Okullar & Eğitim Hizmetleri" },
    { key: "Tamir Ustası / Ev Hizmetleri", icon: "🛠️", title: "Tamir Ustası / Ev Hizmetleri" },
    { key: "Temizlik Hizmetleri", icon: "✨", title: "Temizlik Hizmetleri" },
  ];

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {items.map((it) => (
          <div
            key={it.key}
            onClick={() => onPickCategory?.(it.key)}
            style={{
              cursor: "pointer",
              background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${ui.border}`,
              borderRadius: 22,
              padding: 22,
              minHeight: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: `0 30px 90px ${ui.glow}`,
            }}
          >
            <div style={{ fontSize: 28 }}>{it.icon}</div>
            <div>
              <div style={{ fontWeight: 950, fontSize: 16 }}>{it.title}</div>
              <div style={{ color: ui.muted, fontSize: 13, marginTop: 6 }}>
                {(counts?.[it.key] ?? 0)} listing
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
/* ========= APP ========= */
export default function App() {
  console.log("🔥 App.jsx yüklendi");
  console.log("🔥 SUPABASE INSTANCE:", supabase);
  console.log("🧪 ENV URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("🧪 ENV KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

  const [booted, setBooted] = useState(false);

  const systemTheme = useSystemTheme();
  const [themePref, setThemePref] = useState("system");
  const resolvedTheme = themePref === "system" ? systemTheme : themePref;
  const ui = useMemo(() => themeTokens(resolvedTheme), [resolvedTheme]);

  // Tabs
  const [active, setActive] = useState("biz");

  // Data
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [biz, setBiz] = useState([]);
  const [bizApps, setBizApps] = useState([]);
  const [posts, setPosts] = useState([]);
  const [dms, setDms] = useState([]);
  const [appts, setAppts] = useState([]);
  const [adminLog, setAdminLog] = useState([]);
  const [adminConfig, setAdminConfig] = useState({ admins: DEFAULT_ADMINS });
  const [adminUnlocked, setAdminUnlocked] = useState(() => lsGet(KEY.ADMIN_UNLOCK, false));

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() =>
    lsGet(KEY.SETTINGS, { chatEnabled: true, readReceipts: true, msgNotifications: true })
  );

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Auth state'leri
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");

  const [showBizApply, setShowBizApply] = useState(false);

  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectCtx, setRejectCtx] = useState(null);
  const [rejectText, setRejectText] = useState("");

  const [showDeleteReason, setShowDeleteReason] = useState(false);
  const [deleteCtx, setDeleteCtx] = useState(null);
  const [reasonText, setReasonText] = useState("");

 const [showEditUser, setShowEditUser] = useState(false);
const [editUserCtx, setEditUserCtx] = useState(null);
const [pickedAvatarName, setPickedAvatarName] = useState("");

  const [showEditBiz, setShowEditBiz] = useState(false);
  const [editBizCtx, setEditBizCtx] = useState(null);

  // HUB
  const [composer, setComposer] = useState("");
  const [commentDraft, setCommentDraft] = useState({});

  // Profile view
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);

  // DM modal
  const [showDm, setShowDm] = useState(false);
  const [dmTarget, setDmTarget] = useState(null);
  const [dmText, setDmText] = useState("");

  // Appointment modal
  const [showAppt, setShowAppt] = useState(false);
  const [apptBizId, setApptBizId] = useState(null);
  const [apptMsg, setApptMsg] = useState("");

  // Landing search (UI)
  const [landingSearch, setLandingSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

    // File upload helpers
  const userAvatarPicker = useFileToBase64();
  const bizAvatarPicker = useFileToBase64();
  const UserAvatarInput = userAvatarPicker.Input;
  const BizAvatarInput = bizAvatarPicker.Input;

  // ✅ Username değişince eski username'lerden profile açabilmek için alias map
  const [usernameAliases, setUsernameAliases] = useState({});
  // örn: { "oldname": "newname" } (hepsi normalize edilmiş tutulacak)

  function resolveUsernameAlias(uname) {
    const key = normalizeUsername(uname);
    return usernameAliases[key] || uname;
  }

  // ✅ Username değiştiğinde tüm kayıtları güncelle (DM / post / comment / biz owner vs.)
  function updateUsernameEverywhere(oldUsername, newUsername) {
    const oldN = normalizeUsername(oldUsername);
    const newU = String(newUsername || "").trim();

    // alias kaydı (eski -> yeni)
    setUsernameAliases((prev) => ({ ...prev, [oldN]: newU }));

    // DM'ler
    setDms((prev) =>
      prev.map((m) => ({
        ...m,
        from: normalizeUsername(m.from) === oldN ? newU : m.from,
        toUsername: normalizeUsername(m.toUsername) === oldN ? newU : m.toUsername,
      }))
    );

    // Postlar
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        by: normalizeUsername(p.by) === oldN ? newU : p.by,
        comments: Array.isArray(p.comments)
          ? p.comments.map((c) => ({
              ...c,
              by: normalizeUsername(c.by) === oldN ? newU : c.by,
              replies: Array.isArray(c.replies)
                ? c.replies.map((r) => ({
                    ...r,
                    by: normalizeUsername(r.by) === oldN ? newU : r.by,
                  }))
                : c.replies,
            }))
          : p.comments,
      }))
    );

    // İşletmeler (ownerUsername / approvedBy)
    setBiz((prev) =>
      prev.map((b) => ({
        ...b,
        ownerUsername: normalizeUsername(b.ownerUsername) === oldN ? newU : b.ownerUsername,
        approvedBy: normalizeUsername(b.approvedBy) === oldN ? newU : b.approvedBy,
      }))
    );
  }

  // ✅ EMAIL DOĞRULAMA + AUTH CALLBACK (TEK KAYNAK) — FIX: #auth%23access_token
  useEffect(() => {
    const run = async () => {
      try {
        if (!supabase?.auth) return;

        // ✅ Hash normalize: "#auth%23access_token" / "#auth#access_token" -> "#access_token"
        const rawHash = window.location.hash || "";
        const normalizedHash = rawHash.replace("#auth%23", "#").replace("#auth#", "#");

        // 1) HASH (#access_token / #error / otp_expired vs)
        const hash = normalizedHash.startsWith("#") ? normalizedHash.slice(1) : normalizedHash;
        const hp = new URLSearchParams(hash);

        // Hash error handling
        const codeErr = hp.get("error_code");
        const descErr = hp.get("error_description");
        const hasErr = hp.get("error") || descErr || codeErr;

        if (hasErr) {
          const msg =
            descErr ||
            (codeErr === "otp_expired"
              ? "Email doğrulama linki süresi dolmuş veya daha önce kullanılmış."
              : "Email doğrulama sırasında hata oluştu.");

          alert(decodeURIComponent(msg));

          // hash'i temizle ama path'i koru
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          return;
        }

        // Hash session handling
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });

          if (error) {
            console.error("❌ setSession error:", error);
            alert(error.message || "Email doğrulama sırasında hata oluştu.");
            return;
          }

          // hash'i temizle
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }

       // 2) ?code=... (PKCE / OAuth)
const url = new URL(window.location.href);
const code = url.searchParams.get("code");

if (code) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("❌ exchangeCodeForSession error:", error);
    alert(error.message || "Giriş tamamlanamadı. Lütfen tekrar deneyin.");
    return;
  }

  // ✅ URL temizle: code/state kalksın ama PATH kalsın
  url.searchParams.delete("code");
  url.searchParams.delete("state");

  window.history.replaceState(
    {},
    document.title,
    url.pathname + (url.search ? `?${url.searchParams.toString()}` : "") + url.hash
  );

  // ✅ UI state: login modal kapansın (beyaz ekranda kalma hissini keser)
  setShowAuth(false);

  // ✅ Session'ı okuyup user state’i tetikle (listener bazen geç kalıyor)
  const session = data?.session || (await supabase.auth.getSession()).data.session;
  if (session?.user) {
    const md = session.user.user_metadata || {};
    setUser((prev) => ({
      ...(prev || {}),
      id: session.user.id,
      email: session.user.email,
      username: md.username ?? prev?.username ?? null,
      avatar: md.avatar ?? prev?.avatar ?? "",
      Tier: md.Tier ?? prev?.Tier ?? "Verified",
      XP: Number(md.XP ?? md.xp ?? prev?.XP ?? 0),
      createdAt: md.createdAt ?? prev?.createdAt ?? null,
    }));
  }
}
      } catch (e) {
        console.error("❌ auth callback error:", e);
      }
    };

    run();
  }, []);

  // ✅ Boot + Local State + Supabase Auth Restore + Auth Listener
useEffect(() => {
  let alive = true;
  let subscription = null;

  // 🧹 DEV ortamında eski seed/login kalıntılarını 1 kere temizle
  if (import.meta.env.DEV && !localStorage.getItem("tg_clean_v1")) {
    localStorage.removeItem(KEY.USERS);
    localStorage.removeItem(KEY.USER);
    localStorage.setItem("tg_clean_v1", "done");
  }

  // 📦 Local veriler
  setUsers(lsGet(KEY.USERS, []));
  setBiz(lsGet(KEY.BIZ, []));
  setBizApps(lsGet(KEY.BIZ_APPS, []));
  setPosts(lsGet(KEY.POSTS, []));
  setDms(lsGet(KEY.DMS, []));
  setAppts(lsGet(KEY.APPTS, []));
  setAdminLog(lsGet(KEY.ADMIN_LOG, []));
  setAdminConfig(lsGet(KEY.ADMIN_CONFIG, { admins: DEFAULT_ADMINS }));
  setAdminUnlocked(lsGet(KEY.ADMIN_UNLOCK, false));

  setThemePref("system");
  setSettings(
    lsGet(KEY.SETTINGS, {
      chatEnabled: true,
      readReceipts: true,
      msgNotifications: true,
    })
  );

  const restoreAndListen = async () => {
    try {
      // 🔐 Supabase yoksa sadece booted true
      if (!supabase?.auth) {
        if (alive) setBooted(true);
        return;
      }

      // 1) Session restore
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      if (error) console.error("❌ getSession error:", error);

      const session = data?.session;
      if (session?.user) {
        const md = session.user.user_metadata || {};
        setUser((prev) => ({
          ...(prev || {}),
          id: session.user.id,
          email: session.user.email,
          username: md.username ?? prev?.username ?? null,
          avatar: md.avatar ?? prev?.avatar ?? "",
          Tier: md.Tier ?? prev?.Tier ?? "Onaylı İşletme",
          XP: Number(md.XP ?? md.xp ?? prev?.XP ?? 0),
          createdAt: md.createdAt ?? prev?.createdAt ?? null,
        }));
      } else {
        setUser(null);
      }

      // 2) Auth listener (login/logout/refresh değişimlerinde state güncelle)
      const { data: subData } = supabase.auth.onAuthStateChange((_event, s) => {
        if (!alive) return;

        if (s?.user) {
          const md = s.user.user_metadata || {};
          setUser((prev) => ({
            ...(prev || {}),
            id: s.user.id,
            email: s.user.email,
            username: md.username ?? prev?.username ?? null,
            avatar: md.avatar ?? prev?.avatar ?? "",
            Tier: md.Tier ?? prev?.Tier ?? "Onaylı İşletme",
            XP: Number(md.XP ?? md.xp ?? prev?.XP ?? 0),
            createdAt: md.createdAt ?? prev?.createdAt ?? null,
          }));
        } else {
          setUser(null);
        }
      });

      subscription = subData?.subscription || null;
    } catch (e) {
      console.error("💥 restore/auth crash:", e);
      setUser(null);
    } finally {
      if (alive) setBooted(true);
    }
  };

  restoreAndListen();

  return () => {
    alive = false;
    try {
      subscription?.unsubscribe?.();
    } catch (_) {}
  };
}, []);
  // Persist
  useEffect(() => { if (booted) lsSet(KEY.USERS, users); }, [users, booted]);
  useEffect(() => { if (booted) lsSet(KEY.BIZ, biz); }, [biz, booted]);
  useEffect(() => { if (booted) lsSet(KEY.BIZ_APPS, bizApps); }, [bizApps, booted]);
  useEffect(() => { if (booted) lsSet(KEY.POSTS, posts); }, [posts, booted]);
  useEffect(() => { if (booted) lsSet(KEY.DMS, dms); }, [dms, booted]);
  useEffect(() => { if (booted) lsSet(KEY.APPTS, appts); }, [appts, booted]);
  useEffect(() => { if (booted) lsSet(KEY.ADMIN_LOG, adminLog); }, [adminLog, booted]);
  useEffect(() => { if (booted) lsSet(KEY.ADMIN_CONFIG, adminConfig); }, [adminConfig, booted]);
  useEffect(() => { if (booted) lsSet(KEY.THEME, themePref); }, [themePref, booted]);
  useEffect(() => { if (booted) lsSet(KEY.SETTINGS, settings); }, [settings, booted]);

  useEffect(() => {
    if (!booted) return;
    if (user) lsSet(KEY.USER, user);
    else localStorage.removeItem(KEY.USER);
  }, [user, booted]);

  const adminMode = useMemo(
  () => adminUnlocked && isAdminUser(user?.username, adminConfig.admins),
  [user, adminConfig, adminUnlocked]
);

  const approvedBiz = useMemo(() => biz.filter((x) => x.status === "approved"), [biz]);
const deletedBiz = useMemo(() => biz.filter((x) => x.status === "deleted"), [biz]);
const pendingApps = useMemo(() => bizApps.filter((x) => x.status === "pending"), [bizApps]);

const apptsForBiz = useMemo(() => {
  const map = new Map();
  for (const a of appts) {
    if (!a?.bizId) continue;
    map.set(a.bizId, (map.get(a.bizId) || 0) + (a.status === "pending" ? 1 : 0));
  }
  return map;
}, [appts]);

function addLog(action, payload = {}) {
  if (!adminMode) return;
  setAdminLog((prev) => [{ id: uid(), createdAt: now(), admin: user?.username || "-", action, payload }, ...prev]);
}

function requireAuth() {
  if (!user) {
    setShowAuth(true);
    return false;
  }
  return true;
}

function authUserExists() {
  const email = String(authEmail || "").trim().toLowerCase();
  const username = String(authUsername || "").trim();

  // Email girildiyse: email'e göre kontrol
  if (email) {
    return users.some((x) => String(x.email || "").trim().toLowerCase() === email);
  }

  // Email yok ama username girildiyse: username'e göre kontrol
  if (username) {
    const unameLower = normalizeUsername(username);
    return users.some((x) => normalizeUsername(x.username) === unameLower);
  }

  // Hiçbiri yoksa: false
  return false;
}

// ✅ LOGIN / REGISTER (Supabase)
async function loginNow(provider = "email", mode = "login") {
  try {
    const email = String(authEmail || "").trim().toLowerCase();
    const pass = String(authPassword || "").trim();
    const username = String(authUsername || "").trim();

    // 1) Supabase var mı?
    if (!supabase || !supabase.auth) {
      alert("Supabase client hazır değil. supabaseClient import/env kontrol et.");
      return;
    }

    // (İsteğe bağlı) Ping testi: debug için aç-kapa
    // const ping = await supabase.auth.getSession();
    // console.log("🧪 SESSION:", ping);

    // 2) REGISTER
    if (mode === "register") {
      if (!email || !pass || !username) {
        alert("Email, şifre ve kullanıcı adı zorunlu.");
        return;
      }

     const { data, error } = await supabase.auth.signUp({
  email,
  password: pass,
  options: {
    data: { username },
    emailRedirectTo: "https://www.turkguide.net/auth/callback",
  },
});

      if (error) {
        console.error("❌ signUp error:", error);
        alert(error.message);
        return;
      }

      console.log("✅ signUp ok:", data);

      // Confirm email açıksa: session null gelir, bu normal
      if (!data?.session) {
        alert("Kayıt alındı. Email doğrulama linki gönderildi. Linke tıklayıp doğrula.");
      } else {
        alert("Kayıt alındı ve giriş yapıldı.");
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || null,
          Tier: "Onaylı İşletme",
        });
        setShowAuth(false);
      }

      setAuthPassword("");
      setShowRegister(false);
      setShowAuth(true);
      return;
    }

    // 3) LOGIN
    if (mode === "login") {
      if (!email || !pass) {
        alert("Email ve şifre zorunlu.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        console.error("❌ login error:", error);
        alert(error.message);
        return;
      }

      console.log("✅ login ok:", data);

      setUser({
  id: data.user.id,
  email: data.user.email,
  username:
    data.user.user_metadata?.username ??
    (data.user.email ? data.user.email.split("@")[0] : null),
  Tier:
    data.user.user_metadata?.tier ??
    data.user.user_metadata?.Tier ??
    "Onaylı İşletme",
  XP: Number(data.user.user_metadata?.xp ?? data.user.user_metadata?.XP ?? 0),
  avatar: data.user.user_metadata?.avatar ?? "",
});

      setShowAuth(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthUsername("");
      return;
    }

    alert("Geçersiz işlem.");
  } catch (e) {
    console.error("💥 loginNow crash:", e);
    alert(e?.message || "Load failed");
  }
}

// ✅ LOGOUT
async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error("logout error:", e);
  } finally {
    setUser(null);
    lsSet(KEY.USER, null);
    setShowAuth(true);
  }
}

// ❌ HESAP SİL
async function deleteAccount() {
  const ok = confirm("Hesabın kalıcı olarak silinecek. Emin misin?");
  if (!ok) return;

  try {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;

    alert("Hesabın silindi.");
    await supabase.auth.signOut();

    // ✅ UI + state reset
    setUser(null);
    lsSet(KEY.USER, null);
    setShowSettings(false);
    setShowAuth(false);
  } catch (e) {
    console.error("delete account error:", e);
    alert("Hesap silinirken hata oluştu.");
  }
}
// ✅ OAUTH LOGIN (Apple / Google vs.)
async function oauthLogin(provider) {
  try {
    if (!supabase?.auth) {
      alert("Supabase hazır değil.");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback`;

const { error } = await supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo,
  },
});

    if (error) {
      console.error("❌ oauthLogin error:", error);
      alert(error.message || "OAuth giriş hatası");
    }
  } catch (e) {
    console.error("💥 oauthLogin crash:", e);
    alert(e?.message || "OAuth giriş hatası");
  }
}

function openProfileByUsername(username) {
  const uname = resolveUsernameAlias(String(username || "").trim());

  // ✅ 1) Önce current user match (en sağlamı)
  if (user && normalizeUsername(user.username) === normalizeUsername(uname)) {
    setProfileTarget({ type: "user", userId: user.id, username: user.username });
    setProfileOpen(true);
    return;
  }

  // ✅ 2) users[] içinden id çöz (username değişse bile sağlam kalsın)
  const found = users.find((x) => normalizeUsername(x.username) === normalizeUsername(uname));

  if (found?.id) {
    setProfileTarget({ type: "user", userId: found.id, username: found.username });
  } else {
    // id bulamazsak yine username ile aç (fallback)
    setProfileTarget({ type: "user", userId: null, username: uname });
  }

  setProfileOpen(true);
}

function openProfileBiz(bizId) {
  setProfileTarget({ type: "biz", bizId });
  setProfileOpen(true);
}

function openDmToUser(username) {
  if (!requireAuth()) return;
  if (!settings.chatEnabled) return;
  setDmTarget({ type: "user", username });
  setDmText("");
  setShowDm(true);
}

function openDmToBiz(bizId) {
  if (!requireAuth()) return;
  if (!settings.chatEnabled) return;
  setDmTarget({ type: "biz", bizId });
  setDmText("");
  setShowDm(true);
}

function sendDm() {
  if (!requireAuth()) return;
  if (!settings.chatEnabled) return;

  const text = String(dmText || "").trim();
  if (!text) return;

  const msg = {
    id: uid(),
    createdAt: now(),
    from: user.username,
    toType: dmTarget?.type,
    toUsername: dmTarget?.type === "user" ? dmTarget.username : null,
    toBizId: dmTarget?.type === "biz" ? dmTarget.bizId : null,
    text,
    readBy: [],
  };

  setDms((prev) => [msg, ...prev]);
  setDmText("");
}

function openBizApply() {
  if (!requireAuth()) return;
  setShowBizApply(true);
}

function submitBizApplication(data) {
  if (!requireAuth()) return;
  const name = String(data?.name || "").trim();
  const city = String(data?.city || "").trim();
  const address = String(data?.address || "").trim();
  const phone = String(data?.phone || "").trim();
  const category = String(data?.category || "").trim();
  const plan = String(data?.plan || "Onaylı İşletme").trim();

  if (!name || !city || !category) {
    alert("Lütfen işletme adı / şehir / kategori doldur.");
    return;
  }

  setBizApps((prev) => [
    {
      id: uid(),
      createdAt: now(),
      status: "pending",
      applicant: user.username,
      ownerUsername: user.username,
      name,
      city,
      address,
      phone,
      category,
      plan,
      desc: String(data?.desc || "").trim(),
      avatar: "",
    },
    ...prev,
  ]);
  setShowBizApply(false);
}

function adminApprove(app) {
  if (!adminMode) return;
  const b = {
    id: uid(),
    createdAt: now(),
    status: "approved",
    name: app.name,
    city: app.city,
    address: app.address || app.city,
    phone: app.phone || "",
    category: app.category,
    plan: app.plan || "Onaylı İşletme",
    desc: app.desc || "",
    avatar: app.avatar || "",
    ownerUsername: app.ownerUsername || app.applicant || "",
    applicant: app.applicant,
    approvedAt: now(),
    approvedBy: user.username,
  };
  setBiz((prev) => [b, ...prev]);
  setBizApps((prev) => prev.filter((x) => x.id !== app.id));
  addLog("BUSINESS_APPROVE", { appId: app.id, name: app.name });
}

function openReject(app) {
  if (!adminMode) return;
  setRejectCtx(app);
  setRejectText("");
  setShowRejectReason(true);
}

function adminReject() {
  if (!adminMode) return;
  const reason = String(rejectText || "").trim();
  if (!reason) return alert("Sebep yazmalısın.");
  if (!rejectCtx) return;

  setBizApps((prev) => prev.filter((x) => x.id !== rejectCtx.id));
  addLog("BUSINESS_REJECT", { appId: rejectCtx.id, name: rejectCtx.name, reason });
  setShowRejectReason(false);
  setRejectCtx(null);
  setRejectText("");
}

function openDelete(type, item) {
  if (!adminMode) return;
  setDeleteCtx({ type, item });
  setReasonText("");
  setShowDeleteReason(true);
}

function confirmDelete() {
  if (!adminMode) return;
  const reason = String(reasonText || "").trim();
  if (!reason) return alert("Sebep yazmalısın.");
  if (!deleteCtx) return;

  if (deleteCtx.type === "biz") {
    const b = deleteCtx.item;
    setBiz((prev) =>
      prev.map((x) =>
        x.id === b.id
          ? { ...x, status: "deleted", deletedAt: now(), deletedBy: user.username, deleteReason: reason }
          : x
      )
    );
    addLog("BUSINESS_DELETE", { id: b.id, name: b.name, reason });
  }

  if (deleteCtx.type === "user") {
    const u = deleteCtx.item;
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    addLog("USER_DELETE", { id: u.id, username: u.username, reason });
  }

  setShowDeleteReason(false);
  setDeleteCtx(null);
  setReasonText("");
}

function hubShare() {
  if (!requireAuth()) return;
  const text = String(composer || "").trim();
  if (!text) return;

  const post = {
    id: uid(),
    createdAt: now(),
    byType: "user",
    byUsername: user.username,
    content: text,
    likes: 0,
    comments: [],
  };
  setPosts((prev) => [post, ...prev]);
  setComposer("");
}

function hubLike(postId) {
  if (!requireAuth()) return;
  setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)));
}

function hubComment(postId) {
  if (!requireAuth()) return;
  const text = String(commentDraft[postId] || "").trim();
  if (!text) return;

  setPosts((prev) =>
    prev.map((p) =>
      p.id === postId
        ? { ...p, comments: [...(p.comments || []), { id: uid(), createdAt: now(), byUsername: user.username, text }] }
        : p
    )
  );
  setCommentDraft((d) => ({ ...d, [postId]: "" }));
}

function openAppointment(bizId) {
  if (!requireAuth()) return;
  setApptBizId(bizId);
  setApptMsg("");
  setShowAppt(true);
}

function submitAppointment() {
  if (!requireAuth()) return;
  const bizId = apptBizId;
  const msg = String(apptMsg || "").trim();
  if (!bizId) return;
  if (!msg) return alert("Randevu notu yaz (örn: tarih/saat isteği).");

  const b = biz.find((x) => x.id === bizId);
  const a = {
    id: uid(),
    createdAt: now(),
    status: "pending",
    bizId,
    bizName: b?.name || "-",
    fromUsername: user.username,
    note: msg,
  };
  setAppts((prev) => [a, ...prev]);
  setShowAppt(false);
  setApptBizId(null);
  setApptMsg("");
}

// ✅ KENDİ PROFİLİNİ DE AÇABİLSİN + oldUsername KORUNUR
function openEditUser(u) {
  if (!u) return;

  const isAdmin = typeof adminMode !== "undefined" ? adminMode : false;
  const me = typeof user !== "undefined" ? user : null;

  // ✅ Admin her kullanıcıyı, normal kullanıcı sadece kendini düzenler
  const can = isAdmin || (me && u.id && me.id && String(u.id) === String(me.id));
  if (!can) return;

  setEditUserCtx({
    ...u,
    _origUsername: String(u.username || "").trim(), // ✅ KRİTİK: eski username sakla
  });

  setShowEditUser(true);
}

// ✅ KAYDET (kapanma: SADECE gerçekten kaydettiyse kapanır + profilTarget fix)
async function saveEditUser() {
  const u = editUserCtx;
  if (!u) return;

  const isAdmin = typeof adminMode !== "undefined" ? adminMode : false;
  const me = typeof user !== "undefined" ? user : null;

  const can = isAdmin || (me && u.id && me.id && u.id === me.id);
  if (!can) return;

  // ✅ Username değişince profil popup "Profil bulunamadı" olmasın diye eski username’i yakala
  const oldUsername = String(u._origUsername || u.username || "").trim();

  const username = String(u.username || "").trim();
  if (!username) {
    alert("Username boş olamaz.");
    return;
  }

  const lower = normalizeUsername(username);
  const clash = users.find((x) => x.id !== u.id && normalizeUsername(x.username) === lower);
  if (clash) {
    alert("Bu kullanıcı adı zaten var.");
    return;
  }

  // local users[] update (yoksa ekle)
  setUsers((prev) => {
    const idx = prev.findIndex((x) => x.id === u.id);
    if (idx >= 0) {
      const copy = [...prev];
      const old = copy[idx] || {};
      copy[idx] = {
        ...old,
        ...u,
        username,
        avatar: u.avatar ?? old.avatar ?? "",
        tier: u.Tier ?? old.Tier ?? "Onaylı İşletme",
        XP: Number(u.XP ?? old.XP ?? 0),
        createdAt: u.createdAt ?? old.createdAt ?? new Date().toISOString(),
        email: u.email ?? old.email ?? "",
      };
      return copy;
    }

    return [
      {
        id: u.id,
        email: u.email || "",
        username,
        tier: u.Tier || "Onaylı İşletme",
        xp: Number(u.XP || 0),
        avatar: u.avatar || "",
        createdAt: u.createdAt || new Date().toISOString(),
      },
      ...prev,
    ];
  });

  // kendi profiliyse user state’i de güncelle
  if (me && u.id === me.id) {
    setUser((p) => ({
      ...(p || {}),
      ...(u || {}),
      id: me.id,
      email: me.email,
      username,
      avatar: u.avatar ?? p?.avatar ?? "",
      tier: u.tier ?? p?.Tier ?? "Onaylı İşletme",
      xp: Number(u.XP ?? p?.xp ?? 0),
    }));
  }

  // ✅ Supabase user_metadata güncelle (kalıcı) — hata olursa kapatma
if (supabase?.auth) {
  try {
    const { data: sData, error: sErr } = await supabase.auth.getSession();
    const sessUser = sData?.session?.user;

    if (sErr) {
      console.error("❌ getSession error:", sErr);
      alert("Supabase session okunamadı: " + (sErr.message || JSON.stringify(sErr)));
      return;
    }

    if (!sessUser) {
      console.error("❌ No session user. user state:", user);
      alert("Supabase session yok (login düşmüş olabilir). Lütfen çıkış yapıp tekrar giriş yap.");
      return;
    }

    const avatarStr = typeof u.avatar === "string" ? u.avatar : "";
    const avatarLen = avatarStr.length;

    // ⚠️ Base64 çok büyükse Supabase metadata patlayabilir
    if (avatarLen > 120000) {
      alert(
        "Profil fotoğrafı çok büyük görünüyor (base64 length: " +
          avatarLen +
          "). Bu yüzden kaydetme hata veriyor olabilir. Birazdan storage çözümüne geçeceğiz."
      );
      // yine de denemeye devam ediyoruz (istersen burada return yapabiliriz)
    }

    const payload = {
      username,
      // boş string ise null gönder
      avatar: avatarStr ? avatarStr : null,
      tier: u.Tier || "Onaylı İşletme",
      xp: Number(u.XP || 0),
    };

    console.log("🧪 updateUser payload:", {
      ...payload,
      avatar_len: avatarLen,
      has_session: !!sessUser,
      session_email: sessUser.email,
    });

    const { error } = await supabase.auth.updateUser({ data: payload });

    if (error) {
      console.error("❌ updateUser error FULL:", error);
      alert(
        "updateUser error: " +
          (error.message || "") +
          "\nstatus: " +
          (error.status || "") +
          "\nname: " +
          (error.name || "") +
          "\nJSON: " +
          JSON.stringify(error)
      );
      return;
    }

    console.log("✅ updateUser OK");
  } catch (e) {
    console.error("💥 updateUser crash FULL:", e);
    alert("updateUser crash: " + (e?.message || JSON.stringify(e)));
    return;
  }
}

  // ✅ Profil popup açıksa, target username'i güncelle (Profil bulunamadı fix)
  setProfileTarget((pt) => {
    if (!pt || pt.type !== "user") return pt;

    const cur = normalizeUsername(pt.username || "");
    const oldN = normalizeUsername(oldUsername || "");
    if (cur !== oldN) return pt;

    return { ...pt, username };
  });

  // ✅ Username değiştiyse: tüm referansları eski->yeni sync et + alias kaydı (kullanıcı bulunamadı fix)
  const newUsername = String(username || "").trim();
  const oldU = String(oldUsername || "").trim();

  if (oldU && newUsername && normalizeUsername(oldU) !== normalizeUsername(newUsername)) {
    // ✅ eski username ile de profile açabilmek için alias map'e ekle
    setUsernameAliases((prev) => ({
      ...(prev || {}),
      [normalizeUsername(oldU)]: newUsername,
    }));

    // 1) İşletmelerde ownerUsername güncelle
    setBiz((prev) =>
      prev.map((b) =>
        normalizeUsername(b.ownerUsername) === normalizeUsername(oldU)
          ? { ...b, ownerUsername: newUsername }
          : b
      )
    );

    // 2) HUB post + yorumlarda byUsername güncelle
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        byUsername:
          normalizeUsername(p.byUsername) === normalizeUsername(oldU) ? newUsername : p.byUsername,
        comments: (p.comments || []).map((c) => ({
          ...c,
          byUsername:
            normalizeUsername(c.byUsername) === normalizeUsername(oldU) ? newUsername : c.byUsername,
        })),
      }))
    );

    // 3) DM'lerde from/toUsername güncelle
    setDms((prev) =>
      prev.map((m) => ({
        ...m,
        from: normalizeUsername(m.from) === normalizeUsername(oldU) ? newUsername : m.from,
        toUsername:
          m.toType === "user" && normalizeUsername(m.toUsername) === normalizeUsername(oldU)
            ? newUsername
            : m.toUsername,
        readBy: (m.readBy || []).map((rb) =>
          normalizeUsername(rb) === normalizeUsername(oldU) ? newUsername : rb
        ),
      }))
    );

    // 4) Randevularda fromUsername güncelle
    setAppts((prev) =>
      prev.map((a) =>
        normalizeUsername(a.fromUsername) === normalizeUsername(oldU)
          ? { ...a, fromUsername: newUsername }
          : a
      )
    );

    // 5) Biz başvurularında applicant/ownerUsername güncelle (varsa)
    setBizApps((prev) =>
      prev.map((a) => ({
        ...a,
        applicant:
          normalizeUsername(a.applicant) === normalizeUsername(oldU) ? newUsername : a.applicant,
        ownerUsername:
          normalizeUsername(a.ownerUsername) === normalizeUsername(oldU)
            ? newUsername
            : a.ownerUsername,
      }))
    );
  }

  // ✅ başarıyla buraya geldiyse kapat
  addLog("USER_EDIT", { id: u.id, username });
  setShowEditUser(false);
  setEditUserCtx(null);
}

function openEditBiz(b) {
  if (!adminMode) return;
  setEditBizCtx({ ...b });
  setShowEditBiz(true);
}

function saveEditBiz() {
  if (!adminMode) return;
  const b = editBizCtx;
  if (!b) return;

  const name = String(b.name || "").trim();
  const category = String(b.category || "").trim();
  if (!name || !category) return alert("İşletme adı ve kategori boş olamaz.");

  setBiz((prev) => prev.map((x) => (x.id === b.id ? { ...x, ...b, name, category } : x)));
  addLog("BUSINESS_EDIT", { id: b.id, name });
  setShowEditBiz(false);
  setEditBizCtx(null);
}

function canEditBizAvatar(b) {
  if (!user) return false;
  if (adminMode) return true;
  return normalizeUsername(b.ownerUsername) === normalizeUsername(user.username);
}

// ✅ AVATAR KAYDI (local + Supabase metadata)
async function setMyAvatar(base64) {
  if (!user) return;

  const updated = { ...user, avatar: base64 };
  setUser(updated);

  setUsers((prev) => {
    const idx = prev.findIndex((x) => x.id === user.id);
    if (idx >= 0) {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], avatar: base64, username: updated.username };
      return copy;
    }
    return [
      {
        id: user.id,
        username: updated.username,
        email: user.email,
        tier: user.Tier || "Onaylı İşletme",
        xp: user.xp || 0,
        avatar: base64,
        createdAt: user.createdAt || new Date().toISOString(),
      },
      ...prev,
    ];
  });

  try {
    await supabase.auth.updateUser({
      data: {
        username: updated.username || null,
        avatar: base64 || null,
        tier: updated.Tier || "Onaylı İşletme",
        xp: Number(updated.XP || 0),
      },
    });
  } catch (e) {
    console.error("setMyAvatar updateUser error:", e);
  }
}

function setBizAvatar(bizId, base64) {
  setBiz((prev) => prev.map((x) => (x.id === bizId ? { ...x, avatar: base64 } : x)));
  addLog("BIZ_AVATAR_SET", { bizId });
}

function openDirections(address) {
  const q = encodeURIComponent(address || "");
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
}

function openCall(phone) {
  const p = String(phone || "").trim();
  if (!p) return alert("Telefon numarası yok.");
  window.location.href = `tel:${p}`;
}

// ✅ Unread counters
// - unreadForMe: unread message count (legacy)
// - unreadThreadsForMe: unread "thread" count = farklı gönderen sayısı (badge bunu gösterecek)
const unreadForMe = useMemo(() => {
  if (!user) return 0;
  const me = normalizeUsername(user.username);

  return dms.filter((m) => {
    const isToUser = m.toType === "user" && normalizeUsername(m.toUsername) === me;
    const isToBiz =
      m.toType === "biz" &&
      biz.some((b) => b.id === m.toBizId && normalizeUsername(b.ownerUsername) === me);

    const read = (m.readBy || []).map(normalizeUsername).includes(me);
    return (isToUser || isToBiz) && !read;
  }).length;
}, [dms, user, biz]);

const unreadThreadsForMe = useMemo(() => {
  if (!user) return 0;
  const me = normalizeUsername(user.username);

  const senders = new Set();

  for (const m of dms) {
    const isToUser = m.toType === "user" && normalizeUsername(m.toUsername) === me;
    const isToBiz =
      m.toType === "biz" &&
      biz.some((b) => b.id === m.toBizId && normalizeUsername(b.ownerUsername) === me);

    if (!(isToUser || isToBiz)) continue;

    // kendi attığın mesajlar badge'i artırmasın
    if (normalizeUsername(m.from) === me) continue;

    const read = (m.readBy || []).map(normalizeUsername).includes(me);
    if (!read) senders.add(normalizeUsername(m.from));
  }

  return senders.size;
}, [dms, user, biz]);

function markThreadRead(target) {
  if (!user || !target) return;
  const me = normalizeUsername(user.username);
  setDms((prev) =>
    prev.map((m) => {
      const isToUser =
        target.type === "user" &&
        m.toType === "user" &&
        normalizeUsername(m.toUsername) === normalizeUsername(target.username);
      const isToBiz = target.type === "biz" && m.toType === "biz" && m.toBizId === target.bizId;
      if (!(isToUser || isToBiz)) return m;
      const readBy = new Set((m.readBy || []).map(normalizeUsername));
      readBy.add(me);
      return { ...m, readBy: Array.from(readBy) };
    })
  );
}

const profileData = useMemo(() => {
  if (!profileTarget) return null;

  // 👤 USER PROFİLİ
  if (profileTarget.type === "user") {
    // ✅ Kendi profilim: local users[] yerine auth user state'ini kullan
    if (user && normalizeUsername(user.username) === normalizeUsername(profileTarget.username)) {
      const owned = biz.filter(
        (b) => normalizeUsername(b.ownerUsername) === normalizeUsername(user.username) && b.status === "approved"
      );

      return {
        type: "user",
        user: {
          ...user,
          xp: user.xp || 0,
          createdAt: user.createdAt || new Date().toISOString(),
        },
        owned,
      };
    }

    // 👥 Başka kullanıcı (local users[]'tan)
const targetUname = resolveUsernameAlias(profileTarget.username);

// 1) Eğer userId geldiyse önce id ile bul (en sağlamı)
let u = profileTarget.userId ? users.find((x) => String(x.id) === String(profileTarget.userId)) : null;

// 2) Bulunamazsa username (alias çözülmüş) ile dene
if (!u) {
  u = users.find((x) => normalizeUsername(x.username) === normalizeUsername(targetUname));
}

if (!u) return null;

    const owned = biz.filter(
      (b) => normalizeUsername(b.ownerUsername) === normalizeUsername(u.username) && b.status === "approved"
    );

    return { type: "user", user: u, owned };
  }

  // 🏢 BİZ PROFİLİ
if (profileTarget.type === "biz") {
  const b = biz.find((x) => x.id === profileTarget.bizId);
  if (!b) return null;

  const resolvedOwner = resolveUsernameAlias(b.ownerUsername);

  const ownerFromAuth =
    user && normalizeUsername(user.username) === normalizeUsername(resolvedOwner)
      ? user
      : null;

  const ownerFromLocal = users.find(
    (x) => normalizeUsername(x.username) === normalizeUsername(resolvedOwner)
  );

  return {
    type: "biz",
    biz: {
      ...b,
      ownerUsername: resolvedOwner,
    },
    owner: ownerFromAuth || ownerFromLocal || null,
  };
}

return null;
}, [profileTarget, users, biz, user]);

const filteredBiz = useMemo(() => {
  const q = normalizeUsername(landingSearch);
  const cat = String(categoryFilter || "").trim();
  return approvedBiz.filter((b) => {
    const inCat = cat ? String(b.category || "").toLowerCase().includes(cat.toLowerCase()) : true;
    const inQ = q
      ? normalizeUsername(b.name).includes(q) ||
        normalizeUsername(b.category).includes(q) ||
        normalizeUsername(b.city).includes(q) ||
        normalizeUsername(b.address).includes(q)
      : true;
    return inCat && inQ;
  });
}, [approvedBiz, landingSearch, categoryFilter]);

const categoryCounts = useMemo(() => {
  const map = {};
  for (const b of approvedBiz) {
    const k = b.category || "Diğer";
    map[k] = (map[k] || 0) + 1;
  }
  map["Avukatlar"] = map["Avukatlar"] ?? 1;
  map["Doktorlar & Sağlık Hizmetleri"] = map["Doktorlar & Sağlık Hizmetleri"] ?? 1;
  map["Restoranlar"] = map["Restoranlar"] ?? 1;
  map["Emlak Hizmetleri"] = map["Emlak Hizmetleri"] ?? 1;
  map["Araç Hizmetleri"] = map["Araç Hizmetleri"] ?? 1;
  return map;
}, [approvedBiz]);

function landingDoSearch() {
  // şu an sadece filtre input'u kullanıyoruz; buton UX için
}

function pickCategory(key) {
  setCategoryFilter(key);
  setTimeout(() => {
    const el = document.getElementById("biz-list");
    el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, 50);
}

function clearFilters() {
  setLandingSearch("");
  setCategoryFilter("");
}

if (!booted) return null;

return (
  <div style={{ minHeight: "100vh", width: "100%", background: ui.bg, color: ui.text }}>
    {/* TOP BAR */}
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(14px)",
        background: ui.top,
        borderBottom: `1px solid ${ui.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "10px 12px",
          position: "relative",
          minHeight: 48,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* LOGO (centered; never pushes buttons) */}
<div
  style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    pointerEvents: "auto",   // ✅ TIKLANABİLİR
    paddingRight: "clamp(120px, 26vw, 160px)",
    paddingLeft: "clamp(120px, 26vw, 160px)",
    boxSizing: "border-box",
  }}
>
          <div
            onClick={() => {
              setActive("biz");
              setCategoryFilter("");
              setLandingSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              transform: "translateY(1px)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                fontSize: "clamp(28px, 7.2vw, 48px)",
                fontWeight: 950,
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              Turk<span style={{ color: ui.blue }}>G</span>uide
            </div>
          </div>
        </div>

        {/* RIGHT ACTIONS (always visible) */}
        <div
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
          }}
        >
          {(() => {
            const iconBtnStyle = {
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent", // ✅ kare yok
              color: ui.text,
              padding: 0,
              lineHeight: 1,
              cursor: "pointer",
              boxShadow: "none",
              WebkitTapHighlightColor: "transparent",
              overflow: "visible",
            };
            const isAuthed = !!user?.id;
            return (
              <>
                {isAuthed && (
                  <button
                    type="button"
                    aria-label="Bildirimler"
                    title="Bildirimler"
                    onClick={() => setActive("notifications")}
                    style={iconBtnStyle}
                  >
                    <BellIcon size={22} />
                  </button>
                )}

                {isAuthed ? (
                  <button
                    type="button"
                    aria-label="Ayarlar"
                    title="Ayarlar"
                    onClick={() => setShowSettings(true)}
                    style={iconBtnStyle}
                  >
                    <SettingsIcon size={22} />
                  </button>
                ) : null}

                {isAuthed ? (
                  <>
                    <button
                      type="button"
                      aria-label="Mesajlar"
                      title="Mesajlar"
                      onClick={() => setActive("messages")}
                      style={{ ...iconBtnStyle, position: "relative" }}
                    >
                      <ChatIcon size={22} />

                      {settings?.msgNotifications && unreadThreadsForMe > 0 ? (
                        <span
                          style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            minWidth: 18,
                            height: 18,
                            padding: "0 6px",
                            borderRadius: 999,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 950,
                            lineHeight: 1,
                            background: ui.blue,
                            color: "#fff",
                            border: `2px solid ${ui.top}`,
                            boxSizing: "border-box",
                            pointerEvents: "auto",
                            userSelect: "none",
                          }}
                        >
                          {unreadThreadsForMe > 99 ? "99+" : unreadThreadsForMe}
                        </span>
                      ) : null}
                    </button>

                    <button
                      type="button"
                      aria-label="Çıkış Yap"
                      title="Çıkış Yap"
                      onClick={logout}
                      style={iconBtnStyle}
                    >
                      <LogoutIcon size={22} />
                    </button>
                  </>
                ) : null}

                {/* Login button should be last when logged out */}
                {!isAuthed ? (
                  <button
                    type="button"
                    aria-label="Giriş"
                    title="Giriş"
                    onClick={() => setShowAuth(true)}
                    style={iconBtnStyle}
                  >
                    <LoginIcon size={22} />
                  </button>
                ) : null}

                {user && adminMode && adminUnlocked && (
                  <button
                    type="button"
                    aria-label="Admin"
                    title="Admin"
                    onClick={() => setActive("admin")}
                    style={iconBtnStyle}
                  >
                    {/* Basit kalkan svg */}
                    <IconBase size={22}>
                      <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
                    </IconBase>
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>




      {/* CONTENT */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 16px 16px" }}>
        {/* LANDING — sadece biz/news/hub ekranlarında üstte görünür (2. görsel) */}
        {(active === "biz" || active === "news" || active === "hub") && (
          <>
            <LandingHero
              ui={ui}
              active={active}
              setActive={(id) => setActive(id)}
              searchText={landingSearch}
              setSearchText={setLandingSearch}
              onSearch={landingDoSearch}
            />


          </>
        )}

 {/* BUSINESS */}
{active === "biz" && (
  <>
    {/* ✅ Kategori seçilmediyse: SADECE KATEGORİLER GÖZÜKSÜN */}
    {!categoryFilter && !landingSearch ? (
      <div style={{ paddingTop: 26 }}>
        <CategoryGrid ui={ui} counts={categoryCounts} onPickCategory={pickCategory} />
      </div>
    ) : (
      /* ✅ Kategori seçildiyse veya arama varsa: SADECE FİLTRELİ İŞLETMELER */
      <div id="biz-list" style={{ display: "grid", gap: 14, paddingTop: 26 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Button ui={ui} onClick={clearFilters}>← Tüm Kategoriler</Button>
          {categoryFilter ? <Chip ui={ui} active>Filtre: {categoryFilter}</Chip> : null}
          {landingSearch ? <Chip ui={ui} active>Arama: {landingSearch}</Chip> : null}
        </div>

        <Card ui={ui} style={{ background: ui.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 950 }}>İşletmeler</div>
              <div style={{ color: ui.muted, marginTop: 4 }}>
                Seçtiğin kategori/arama filtresine göre listelenir.
              </div>
            </div>
            <Button ui={ui} onClick={openBizApply} variant="solidBlue">+ İşletmenizi Ekleyin</Button>
          </div>
        </Card>

        {filteredBiz.length === 0 ? (
  <div style={{ color: ui.muted, padding: 10 }}>Bu filtrede işletme yok.</div>
) : (
  <div style={{ display: "grid", gap: 12 }}>
    {filteredBiz.map((b) => {
      const badge =
        (b.plan || "").toLowerCase() === "verified"
          ? "Onaylı İşletme"
          : "İşletme";

      const canEditAvatar = canEditBizAvatar(b);

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
                      <div onClick={() => openProfileBiz(b.id)} style={{ cursor: "pointer" }}>
                        <Avatar ui={ui} src={b.avatar} size={54} label={b.name} />
                      </div>

                      <div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <div
                            style={{ fontSize: 18, fontWeight: 950, cursor: "pointer" }}
                            onClick={() => openProfileBiz(b.id)}
                          >
                            {b.name}
                          </div>
                          <Chip ui={ui}>{badge}</Chip>
                          {apptsForBiz.get(b.id) ? <Chip ui={ui}>🗓️ {apptsForBiz.get(b.id)} yeni talep</Chip> : null}
                        </div>

                        <div style={{ marginTop: 6, color: ui.muted }}>
                          📍 {b.address || b.city || "-"}
                        </div>

                        <div style={{ marginTop: 6, color: ui.muted2, fontSize: 12 }}>
                          Sahibi:{" "}
                          <span
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => openProfileByUsername(b.ownerUsername || "-")}
                          >
                            @{b.ownerUsername || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canEditAvatar ? (
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <BizAvatarInput onBase64={(b64) => setBizAvatar(b.id, b64)} />
                        <Button ui={ui} variant="blue" onClick={() => bizAvatarPicker.pick()}>
                          🖼️ İşletme Foto
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {b.desc ? <div style={{ marginTop: 12, color: ui.muted }}>{b.desc}</div> : null}

                  <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button ui={ui} variant="ok" onClick={() => openAppointment(b.id)}>🗓️ Randevu Al</Button>
                    <Button ui={ui} onClick={() => openDirections(b.address || b.city || "")}>🧭 Yol Tarifi</Button>
                    <Button ui={ui} onClick={() => openCall(b.phone)}>📞 Ara</Button>
                    <Button ui={ui} variant="solidBlue" onClick={() => openDmToBiz(b.id)}>💬 Mesaj Gönder</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
  </>
)}

        {/* NEWS */}
        {active === "news" && (
          <div style={{ paddingTop: 26 }}>
            <Card ui={ui}>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Haberler</div>
              <div style={{ color: ui.muted, marginTop: 8 }}>
                MVP demo. (Sonraki adım: haber kaynağı + detay sayfası)
              </div>
            </Card>
          </div>
        )}

        {/* HUB */}
        {active === "hub" && (
          <div style={{ display: "grid", gap: 14, paddingTop: 26 }}>
            <Card ui={ui}>
              <div style={{ fontSize: 18, fontWeight: 950 }}>HUB</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>
                Amerika’yı ziyaret edenlerin deneyimleri + geleceklerin soru/cevap alanı (demo).
              </div>

              <div style={{ marginTop: 12 }}>
                <textarea
                  placeholder={user ? "Bir şey yaz ve paylaş..." : "Paylaşmak için giriş yap"}
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  onFocus={() => { if (!user) setShowAuth(true); }}
                  style={inputStyle(ui, { minHeight: 90, borderRadius: 14, resize: "vertical" })}
                />
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button ui={ui} variant="solidBlue" onClick={hubShare}>Paylaş</Button>
                  <Button ui={ui} onClick={() => setComposer("")} disabled={!composer}>Temizle</Button>
                </div>
              </div>
            </Card>

            {posts.length === 0 ? (
              <div style={{ color: ui.muted, padding: 10 }}>Henüz paylaşım yok.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {posts.map((p) => (
                  <Card ui={ui} key={p.id} style={{ background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <Chip ui={ui} onClick={() => openProfileByUsername(p.byUsername)}>
                        @{p.byUsername}
                      </Chip>
                      <span style={{ color: ui.muted2, fontSize: 12 }}>{fmt(p.createdAt)}</span>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900 }}>
                      {p.content}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                      <Button ui={ui} onClick={() => hubLike(p.id)}>Like ({p.likes || 0})</Button>
                      <Button ui={ui} variant="solidBlue" onClick={() => openDmToUser(p.byUsername)}>💬 Mesaj</Button>
                    </div>

                    <Divider ui={ui} />

                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        placeholder={user ? "Yorum yaz..." : "Yorum için giriş yap"}
                        value={commentDraft[p.id] || ""}
                        onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                        onFocus={() => { if (!user) setShowAuth(true); }}
                        style={inputStyle(ui, { padding: "10px 12px" })}
                      />
                      <Button ui={ui} variant="solidBlue" onClick={() => hubComment(p.id)}>Gönder</Button>
                    </div>

                    <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                      {(p.comments || []).slice().reverse().map((c) => (
                        <div key={c.id} style={{ padding: 10, borderRadius: 14, border: `1px solid ${ui.border}`, background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <Chip ui={ui} onClick={() => openProfileByUsername(c.byUsername)}>@{c.byUsername}</Chip>
                            <span style={{ color: ui.muted2, fontSize: 12 }}>{fmt(c.createdAt)}</span>
                            {user ? (
                              <Button ui={ui} variant="blue" onClick={() => openDmToUser(c.byUsername)} style={{ padding: "6px 12px", borderRadius: 999, fontWeight: 900 }}>
                                Mesaj
                              </Button>
                            ) : null}
                          </div>
                          <div style={{ marginTop: 8 }}>{c.text}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {active === "profile" && (
          <div style={{ paddingTop: 26 }}>
            <Card ui={ui}>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Profil</div>
              {!user ? (
                <div style={{ marginTop: 8, color: ui.muted }}>
                  Giriş yapmadın. Profil bilgisi için giriş yap.
                </div>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <Avatar ui={ui} src={user.avatar} size={70} label={user.username} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 950 }}>@{user.username}</div>
                      <div style={{ color: ui.muted, marginTop: 4 }}>
                        Üyelik: {user.Tier || "Onaylı işletme"} • XP: {user.XP || 0}
                      </div>
                      <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
                        Kayıt: {fmt(user.createdAt)}
                      </div>
                    </div>
                  </div>

                  <UserAvatarInput onBase64={(b64) => setMyAvatar(b64)} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button ui={ui} variant="solidBlue" onClick={() => userAvatarPicker.pick()}>
                      🖼️ Profil Foto Değiştir
                    </Button>
                    <Button
  ui={ui}
  onClick={() => {
    setProfileTarget({
      type: "user",
      userId: user.id,       // ✅ KRİTİK
      username: user.username
    });
    setProfileOpen(true);
  }}
>
  👤 Profil Görünümü
</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ADMIN */}
        {active === "admin" && adminMode && (
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
                    <div key={a.id} style={{ border: `1px solid ${ui.border}`, borderRadius: 16, padding: 12, background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 950 }}>{a.name}</div>
                          <div style={{ color: ui.muted, marginTop: 4 }}>
                            {a.city} • {a.category} • Plan: {a.plan || "Onaylı İşletme"} • Başvuran: @{a.applicant}
                          </div>
                          <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>{fmt(a.createdAt)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Button ui={ui} variant="ok" onClick={() => adminApprove(a)}>Onayla</Button>
                          <Button ui={ui} variant="danger" onClick={() => openReject(a)}>Reddet</Button>
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
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", border: `1px solid ${ui.border}`, borderRadius: 16, padding: 12, background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <Avatar ui={ui} src={b.avatar} size={44} label={b.name} />
                      <div>
                        <div style={{ fontWeight: 950 }}>{b.name}</div>
                        <div style={{ color: ui.muted, fontSize: 13 }}>
                          {b.category} • {b.plan} • owner: @{b.ownerUsername || "-"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <Button ui={ui} variant="blue" onClick={() => openEditBiz(b)}>Yönet / Düzenle</Button>
                      <Button ui={ui} variant="danger" onClick={() => openDelete("biz", b)}>Sil</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card ui={ui}>
              <div style={{ fontSize: 16, fontWeight: 950 }}>Randevu Talepleri</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>Bu talepler işletmeye iletilmiş kabul edilir (MVP).</div>

              {appts.length === 0 ? (
                <div style={{ color: ui.muted, marginTop: 10 }}>Henüz randevu yok.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {appts.slice(0, 30).map((a) => (
                    <div key={a.id} style={{ border: `1px solid ${ui.border}`, borderRadius: 16, padding: 12, background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 950 }}>
                          {a.bizName} <span style={{ color: ui.muted }}>({a.status})</span>
                        </div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(a.createdAt)}</div>
                      </div>
                      <div style={{ marginTop: 6, color: ui.muted }}>
                        Talep eden:{" "}
                        <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => openProfileByUsername(a.fromUsername)}>
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
                  <div key={u.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", border: `1px solid ${ui.border}`, borderRadius: 16, padding: 12, background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <Avatar ui={ui} src={u.avatar} size={44} label={u.username} />
                      <div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <Chip ui={ui} onClick={() => openProfileByUsername(u.username)}>@{u.username}</Chip>
                          <span style={{ color: ui.muted }}>Tier: {u.Tier || "Onaylı İşletme"}</span>
                          <span style={{ color: ui.muted }}>XP: {u.xp || 0}</span>
                        </div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(u.createdAt)}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <Button ui={ui} variant="blue" onClick={() => openEditUser(u)}>Yönet / Düzenle</Button>
                      <Button
                        ui={ui}
                        variant="danger"
                        onClick={() => openDelete("user", u)}
                        disabled={normalizeUsername(u.username) === normalizeUsername(user?.username)}
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
              {adminLog.length === 0 ? (
                <div style={{ color: ui.muted, marginTop: 10 }}>Henüz log yok.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {adminLog.slice(0, 40).map((l) => (
                    <div key={l.id} style={{ border: `1px solid ${ui.border}`, borderRadius: 16, padding: 12, background: ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 950 }}>{l.action}</div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>{fmt(l.createdAt)}</div>
                      </div>
                      <div style={{ marginTop: 6, color: ui.muted }}>Admin: @{l.admin}</div>
                      <div style={{ marginTop: 6, color: ui.muted2, fontSize: 12 }}>{JSON.stringify(l.payload)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "12px 16px 28px", color: ui.muted2, fontSize: 12 }}>
        TurkGuide • MVP (LocalStorage) • v6
      </div>

     {/* SETTINGS MODAL */}
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
        background:
          ui.mode === "light"
            ? "rgba(0,0,0,0.02)"
            : "rgba(255,255,255,0.03)",
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
          onToggle={() =>
            setSettings((p) => ({ ...p, chatEnabled: !p.chatEnabled }))
          }
        />

        <ToggleRow
          ui={ui}
          label="Görüldü Özelliği"
          desc="Açıkken mesajlar ‘okundu’ olarak işaretlenebilir (MVP)."
          value={!!settings.readReceipts}
          onToggle={() =>
            setSettings((p) => ({ ...p, readReceipts: !p.readReceipts }))
          }
        />

        <ToggleRow
          ui={ui}
          label="Mesaj Bildirimleri"
          desc="Açıkken rozet/okunmamış sayısı güncel tutulur (MVP)."
          value={!!settings.msgNotifications}
          onToggle={() =>
            setSettings((p) => ({ ...p, msgNotifications: !p.msgNotifications }))
          }
        />

        {/* ⚠️ HESAP SİLME */}
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

     {/* LOGIN MODAL */}
<Modal ui={ui} open={showAuth} title="Giriş / Kayıt" onClose={() => setShowAuth(false)}>
  <div style={{ color: ui.muted, marginBottom: 10 }}>
    Paylaşım, yorum, mesaj ve randevu için giriş zorunlu.
  </div>

  <input
    placeholder="Email veya Kullanıcı Adı"
    value={authEmail}
    onChange={(e) => setAuthEmail(e.target.value)}
    style={inputStyle(ui)}
  />

  <input
    placeholder="Şifre"
    type="password"
    value={authPassword}
    onChange={(e) => setAuthPassword(e.target.value)}
    style={{ ...inputStyle(ui), marginTop: 10 }}
  />

  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
    <Button
      ui={ui}
      variant="solidBlue"
      onClick={() => loginNow("email", "login")}
      disabled={!authEmail.trim() || !authPassword.trim()}
      style={{ width: "100%" }}
    >
      Giriş Yap
    </Button>

    <Button
      ui={ui}
      variant="blue"
      onClick={() => {
        setShowAuth(false);
        setShowRegister(true);

        // Register alanlarını temizle
        setAuthUsername("");
        setAuthEmail("");
        setAuthPassword("");
      }}
      style={{ width: "100%" }}
    >
      Kayıt Ol
    </Button>

    <Button ui={ui} onClick={() => setShowAuth(false)} style={{ width: "100%" }}>
      Vazgeç
    </Button>
  </div>

  <div style={{ marginTop: 10, color: ui.muted, fontSize: 12 }}>
    Not: Gerçek email doğrulama (kod/OTP) için Supabase/Firebase bağlayacağız.
  </div>

  {/* AYRAÇ */}
  <div style={{ textAlign: "center", color: ui.muted, fontSize: 12, margin: "12px 0" }}>
    veya
  </div>

  {/* OAUTH GİRİŞ BUTONLARI */}
<div style={{ display: "grid", gap: 10 }}>
  <Button
    ui={ui}
    onClick={() => oauthLogin("apple")}
    style={{
      width: "100%",
      background: "#000",
      color: "#fff",
      fontWeight: 900,
      borderRadius: 999,
    }}
  >
     Apple ile Giriş
  </Button>
</div>

</Modal>

{/* REGISTER MODAL */}
<Modal ui={ui} open={showRegister} title="Kayıt Ol" onClose={() => setShowRegister(false)}>
  <div style={{ color: ui.muted, marginBottom: 10 }}>
    Email, kullanıcı adı ve şifre ile hesap oluştur.
  </div>

  <input
    placeholder="Kullanıcı Adı"
    value={authUsername}
    onChange={(e) => setAuthUsername(e.target.value)}
    style={inputStyle(ui)}
  />

  <input
    placeholder="Email"
    value={authEmail}
    onChange={(e) => setAuthEmail(e.target.value)}
    style={{ ...inputStyle(ui), marginTop: 10 }}
  />

  <input
    placeholder="Şifre"
    type="password"
    value={authPassword}
    onChange={(e) => setAuthPassword(e.target.value)}
    style={{ ...inputStyle(ui), marginTop: 10 }}
  />

  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
    <Button
      ui={ui}
      variant="solidBlue"
      onClick={() => loginNow("email", "register")}
      disabled={!authUsername.trim() || !authEmail.trim() || !authPassword.trim()}
      style={{ width: "100%" }}
    >
      Kaydı Tamamla
    </Button>

    <Button
      ui={ui}
      variant="blue"
      onClick={() => {
        setShowRegister(false);
        setShowAuth(true);
      }}
      style={{ width: "100%" }}
    >
      ← Girişe Dön
    </Button>

    <Button
      ui={ui}
      onClick={() => setShowRegister(false)}
      style={{ width: "100%" }}
    >
      Vazgeç
    </Button>
  </div>

  <div style={{ marginTop: 10, color: ui.muted, fontSize: 12 }}>
    Not: Eğer Supabase bağlı değilse “Kaydı Tamamla” tıklayınca hata verebilir.
  </div>
</Modal>


      {/* BIZ APPLY MODAL */}
      <Modal ui={ui} open={showBizApply} title="İşletme Başvurusu" onClose={() => setShowBizApply(false)}>
        <BizApplyForm ui={ui} onSubmit={submitBizApplication} onCancel={() => setShowBizApply(false)} />
      </Modal>

      {/* REJECT MODAL */}
      <Modal ui={ui} open={showRejectReason} title="Reddetme Sebebi" onClose={() => setShowRejectReason(false)}>
        <div style={{ color: ui.muted, marginBottom: 8 }}>Reddetme sebebi zorunlu.</div>
        <textarea value={rejectText} onChange={(e) => setRejectText(e.target.value)} placeholder="Sebep yaz..." style={inputStyle(ui, { minHeight: 90 })} />
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button ui={ui} variant="danger" onClick={adminReject}>Reddet</Button>
          <Button ui={ui} onClick={() => setShowRejectReason(false)}>İptal</Button>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal ui={ui} open={showDeleteReason} title="Silme Sebebi" onClose={() => setShowDeleteReason(false)}>
        <div style={{ color: ui.muted, marginBottom: 8 }}>Silme sebebi zorunlu. Log’a admin kullanıcı adı + sebep kaydedilir.</div>
        <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} placeholder="Sebep yaz..." style={inputStyle(ui, { minHeight: 90 })} />
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button ui={ui} variant="danger" onClick={confirmDelete}>Sil</Button>
          <Button ui={ui} onClick={() => setShowDeleteReason(false)}>İptal</Button>
        </div>
      </Modal>

 {/* EDIT USER MODAL */}
<Modal
  ui={ui}
  open={showEditUser}
  title="Kullanıcı Yönet / Düzenle"
  onClose={() => setShowEditUser(false)}
  zIndex={1200}
>
  {!editUserCtx ? null : (
    <div style={{ display: "grid", gap: 16 }}>

      {/* ÜST BİLGİ */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <Avatar ui={ui} src={editUserCtx.avatar} size={72} label={editUserCtx.username} />

        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 950 }}>
            @{editUserCtx.username}
          </div>

          <div style={{ color: ui.muted, fontSize: 13 }}>
            Kayıt: {new Date(editUserCtx.createdAt).toLocaleDateString()}
          </div>

          <div style={{ fontSize: 13, fontWeight: 900, color: ui.blue }}>
            XP: {editUserCtx.xp ?? 0}
          </div>

          <div style={{ fontSize: 13, color: ui.muted }}>
            Profil Durumu:{" "}
            <b style={{ color: ui.text }}>
              {(editUserCtx.tier || "Verified").toUpperCase()}
            </b>
          </div>
        </div>
      </div>

      {/* PROFİL FOTO */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>
          Profil Fotoğrafı
        </div>

        {/* ✅ 1) input'u gizle */}
        <input
          id="avatarPickInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // ✅ dosya adını sakla
            setPickedAvatarName(file.name || "");

            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
              try {
                const MAX = 320;
                const scale = Math.min(1, MAX / Math.max(img.width, img.height));

                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));

                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas context yok");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const compressed = canvas.toDataURL("image/jpeg", 0.75);
                setEditUserCtx((p) => ({ ...p, avatar: compressed }));
              } catch (err) {
                console.error("avatar compress error:", err);
                alert("Foto işlenirken hata oluştu.");
              } finally {
                URL.revokeObjectURL(url);
                e.target.value = ""; // aynı dosyayı tekrar seçebilsin
              }
            };

            img.onerror = () => {
              URL.revokeObjectURL(url);
              e.target.value = "";
              alert("Foto okunamadı.");
            };

            img.src = url;
          }}
        />

        {/* ✅ 2) tarayıcının “seçili dosya yok” satırı yerine kendi satırımız */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${ui.border}`,
            background: ui.panel,
          }}
        >
          <button
            type="button"
            onClick={() => document.getElementById("avatarPickInput")?.click()}
            style={{
              padding: "6px 12px",
              borderRadius: 10,
              border: `1px solid ${ui.border}`,
              background: ui.bg,
              color: ui.text,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Dosyayı Seçin
          </button>

          <div style={{ color: ui.muted2, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
            {pickedAvatarName ? pickedAvatarName : "seçili dosya yok"}
          </div>
        </div>

        <div style={{ color: ui.muted2, fontSize: 12 }}>
          Foto seçince önizleme değişir. Kaydet deyince kalıcı olur.
        </div>
      </div>

      {/* USERNAME */}
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>
          Username
        </div>
        <input
          value={editUserCtx.username || ""}
          onChange={(e) =>
            setEditUserCtx((p) => ({ ...p, username: e.target.value }))
          }
          style={inputStyle(ui)}
        />
      </div>

      {/* ✅ HESAP DURUMU */}
<div>
  <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 6 }}>
    Hesap Durumu
  </div>

  {/* 🔒 Kullanıcıya satın alma / değiştirme hissi vermesin diye select KALDIRILDI */}
  <div style={{ fontSize: 13, color: ui.muted }}>
    {((editUserCtx.tier || "Onaylı İşletme").toLowerCase() === "verified") ? (
      <>
        Doğrulanmış Profil
      </>
    ) : (
      <>
        Verified
      </>
    )}
  </div>
</div>

      {/* AKSİYONLAR */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <Button ui={ui} variant="solidBlue" onClick={saveEditUser}>
          Kaydet
        </Button>
        <Button
          ui={ui}
          onClick={() => {
            setShowEditUser(false);
            setEditUserCtx(null);
          }}
        >
          Kapat
        </Button>
      </div>
    </div>
  )}
</Modal>

      {/* EDIT BIZ MODAL */}
<Modal ui={ui} open={showEditBiz} title="İşletme Yönet / Düzenle" onClose={() => setShowEditBiz(false)}>
  {!editBizCtx ? null : (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Avatar ui={ui} src={editBizCtx.avatar} size={62} label={editBizCtx.name} />
        <div style={{ color: ui.muted }}>
          Oluşturma: {fmt(editBizCtx.createdAt)} • Owner: @{editBizCtx.ownerUsername || "-"}
        </div>
      </div>

      {/* ✅ FOTO / LOGO YÜKLE */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12 }}>İşletme Fotoğrafı / Logo</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              const base64 = String(reader.result || "");
              setEditBizCtx((p) => ({ ...p, avatar: base64 }));
            };
            reader.readAsDataURL(file);

            // aynı dosyayı tekrar seçebilmek için:
            e.target.value = "";
          }}
          style={inputStyle(ui)}
        />
        <div style={{ color: ui.muted2, fontSize: 12 }}>
          JPG/PNG seç. Seçince anında önizleme olur; Kaydet deyince kalıcı olur.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>İşletme Adı</div>
          <input
            value={editBizCtx.name || ""}
            onChange={(e) => setEditBizCtx((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle(ui)}
          />
        </div>
        <div>
          <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Kategori</div>
          <input
            value={editBizCtx.category || ""}
            onChange={(e) => setEditBizCtx((p) => ({ ...p, category: e.target.value }))}
            style={inputStyle(ui)}
          />
        </div>
      </div>

      {/* satış/upgrade çağrışımı yok) */}
<div>
  <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>
    Plan
  </div>

  <select
    value={editBizCtx.plan || "Onaylı İşletme"}
    onChange={(e) => setEditBizCtx((p) => ({ ...p, plan: e.target.value }))}
    style={inputStyle(ui)}
  >
    <option value="Onaylı İşletme">Onaylı İşletme</option>
  </select>

  <div style={{ marginTop: 6, color: ui.muted2, fontSize: 12 }}>
    Şimdilik tek plan aktif.
  </div>
</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Telefon</div>
          <input
            value={editBizCtx.phone || ""}
            onChange={(e) => setEditBizCtx((p) => ({ ...p, phone: e.target.value }))}
            style={inputStyle(ui)}
          />
        </div>
        <div>
          <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Adres</div>
          <input
            value={editBizCtx.address || ""}
            onChange={(e) => setEditBizCtx((p) => ({ ...p, address: e.target.value }))}
            style={inputStyle(ui)}
          />
        </div>
      </div>

      <div>
        <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Açıklama</div>
        <textarea
          value={editBizCtx.desc || ""}
          onChange={(e) => setEditBizCtx((p) => ({ ...p, desc: e.target.value }))}
          style={inputStyle(ui, { minHeight: 90, resize: "vertical" })}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button ui={ui} variant="solidBlue" onClick={saveEditBiz}>Kaydet</Button>
        <Button ui={ui} onClick={() => { setShowEditBiz(false); setEditBizCtx(null); }}>Kapat</Button>
      </div>
    </div>
  )}
</Modal>

      {/* DM MODAL */}
<Modal ui={ui} open={showDm} title="Mesaj" onClose={() => setShowDm(false)}>
  {!dmTarget ? null : (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ color: ui.muted }}>
        Hedef:{" "}
        {dmTarget.type === "user" ? <b>@{dmTarget.username}</b> : <b>İşletme</b>}
      </div>

      <div
        style={{
          border: `1px solid ${ui.border}`,
          borderRadius: 16,
          padding: 12,
          background:
            ui.mode === "light"
              ? "rgba(0,0,0,0.03)"
              : "rgba(255,255,255,0.03)",
          maxHeight: 260,
          overflow: "auto",
        }}
      >
        {dms
          .filter((m) => {
            if (dmTarget.type === "user") {
              return (
                m.toType === "user" &&
                normalizeUsername(m.toUsername) ===
                  normalizeUsername(dmTarget.username)
              );
            }
            return m.toType === "biz" && m.toBizId === dmTarget.bizId;
          })
          .slice()
          .reverse()
          .map((m) => (
            <div
              key={m.id}
              style={{
                padding: "10px 0",
                borderBottom: `1px solid ${
                  ui.mode === "light"
                    ? "rgba(0,0,0,0.08)"
                    : "rgba(255,255,255,0.08)"
                }`,
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
                <span
                  style={{
                    fontWeight: 950,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() =>
                    openProfileByUsername(resolveUsernameAlias(m.from))
                  }
                >
                  @{resolveUsernameAlias(m.from)}
                </span>

                <span style={{ color: ui.muted2, fontSize: 12 }}>
                  {fmt(m.createdAt)}
                </span>
              </div>

              <div style={{ marginTop: 6 }}>{m.text}</div>
            </div>
          ))}

        {dms.filter((m) =>
          dmTarget.type === "user"
            ? m.toType === "user" &&
              normalizeUsername(m.toUsername) ===
                normalizeUsername(dmTarget.username)
            : m.toType === "biz" && m.toBizId === dmTarget.bizId
        ).length === 0 && (
          <div style={{ color: ui.muted }}>Henüz mesaj yok.</div>
        )}
      </div>

      <textarea
        value={dmText}
        onChange={(e) => setDmText(e.target.value)}
        placeholder="Mesaj yaz..."
        style={inputStyle(ui, { minHeight: 90, resize: "vertical" })}
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
            setDmTarget(null);
          }}
        >
          Kapat
        </Button>
      </div>
    </div>
  )}
</Modal>
            {/* APPOINTMENT MODAL */}
      <Modal ui={ui} open={showAppt} title="Randevu Talebi" onClose={() => setShowAppt(false)}>
        <div style={{ color: ui.muted, marginBottom: 10 }}>
          Tarih/saat isteğini ve kısa notunu yaz (MVP: talep işletmeye iletilmiş sayılır).
        </div>

        <textarea
          value={apptMsg}
          onChange={(e) => setApptMsg(e.target.value)}
          placeholder="Örn: Yarın 2pm uygunsa görüşmek istiyorum..."
          style={inputStyle(ui, { minHeight: 110, resize: "vertical" })}
        />

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button ui={ui} variant="solidBlue" onClick={submitAppointment}>
            Talep Gönder
          </Button>
          <Button ui={ui} onClick={() => setShowAppt(false)}>
            Vazgeç
          </Button>
        </div>
      </Modal>

      {/* PROFILE MODAL */}
<Modal
  ui={ui}
  open={profileOpen}
  title="Profil"
  onClose={() => {
    setProfileOpen(false);
    setProfileTarget(null);
  }}
>
  {!profileData ? (
    <div style={{ color: ui.muted }}>Profil bulunamadı.</div>
  ) : profileData.type === "user" ? (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Avatar ui={ui} src={profileData.user.avatar} size={72} label={profileData.user.username} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 950 }}>@{profileData.user.username}</div>
          <div style={{ color: ui.muted, marginTop: 4 }}>
  Profil Durumu:{" "}
  <b style={{ color: ui.text }}>
    VERIFIED
  </b>
  {" • "}XP: {profileData.user.xp || 0}
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
            variant="solidBlue"
            onClick={() => {
              setShowEditUser(true);
              setEditUserCtx(profileData.user);
            }}
          >
            ✏️ Profili Düzenle
          </Button>
        ) : (
          <Button ui={ui} variant="solidBlue" onClick={() => openDmToUser(profileData.user.username)}>
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
              onClick={() => openProfileBiz(b.id)}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar ui={ui} src={b.avatar} size={44} label={b.name} />
                <div>
                  <div style={{ fontWeight: 950 }}>{b.name}</div>
                  <div style={{ color: ui.muted, fontSize: 13 }}>
                    {b.category} • {b.plan}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Avatar ui={ui} src={profileData.biz.avatar} size={72} label={profileData.biz.name} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 950 }}>{profileData.biz.name}</div>
          <div style={{ color: ui.muted, marginTop: 4 }}>
            {profileData.biz.category} • {profileData.biz.plan}
          </div>
          <div style={{ color: ui.muted2, marginTop: 4, fontSize: 12 }}>
            Onay: {fmt(profileData.biz.approvedAt)} • by @{profileData.biz.approvedBy}
          </div>
        </div>
      </div>

      <div style={{ color: ui.muted }}>📍 {profileData.biz.address || profileData.biz.city}</div>
      <div style={{ color: ui.muted }}>📞 {profileData.biz.phone || "-"}</div>
      <div style={{ color: ui.muted2 }}>Owner: @{profileData.biz.ownerUsername || "-"}</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button ui={ui} variant="ok" onClick={() => openAppointment(profileData.biz.id)}>
          🗓️ Randevu Al
        </Button>
        <Button ui={ui} onClick={() => openDirections(profileData.biz.address || profileData.biz.city || "")}>
          🧭 Yol Tarifi
        </Button>
        <Button ui={ui} onClick={() => openCall(profileData.biz.phone)}>
          📞 Ara
        </Button>
        <Button ui={ui} variant="solidBlue" onClick={() => openDmToBiz(profileData.biz.id)}>
          💬 Mesaj
        </Button>
      </div>
    </div>
  )}
</Modal>
    </div>
  );
}

/* ===========================
   SUB COMPONENTS
=========================== */

function BizApplyForm({ ui, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("Los Angeles, California");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("+1 ");
  const [category, setCategory] = useState("Emlak");
  const [desc, setDesc] = useState("");

  const safeSubmit = () => {
    if (typeof onSubmit !== "function") {
      console.error("BizApplyForm: onSubmit function değil:", onSubmit);
      alert("Başvuru gönderme fonksiyonu bağlı değil (onSubmit).");
      return;
    }
    onSubmit({ name, city, address, phone, category, plan: "Onaylı İşletme", desc });
  };

  const safeCancel = () => {
    if (typeof onCancel !== "function") {
      console.error("BizApplyForm: onCancel function değil:", onCancel);
      return;
    }
    onCancel();
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input
        placeholder="İşletme adı"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle(ui)}
      />
      <input
        placeholder="Şehir (örn: Los Angeles, California)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={inputStyle(ui)}
      />
      <input
        placeholder="Adres (yol tarifi için)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={inputStyle(ui)}
      />
      <input
        placeholder="Telefon (+1 ...)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle(ui)}
      />

      <div style={{ ...inputStyle(ui), display: "flex", alignItems: "center" }}>
  Onaylanmış İşletme
</div>


      <textarea
        placeholder="Kısa açıklama"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        style={inputStyle(ui, { minHeight: 90, resize: "vertical" })}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={safeSubmit}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: `1px solid ${ui.border}`,
            background: ui.blue,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Başvuru Gönder
        </button>

        <button
          type="button"
          onClick={safeCancel}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: `1px solid ${ui.border}`,
            background: ui.panel2,
            color: ui.text,
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
                İptal
        </button>
      </div>

      <div style={{ color: ui.muted2, fontSize: 12 }}>
        Başvurunuz admin onayından sonra “işletmeler” listesinde görünür.
      </div>
    </div>
  );

}
