export const KEY = {
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
  METRICS: "tg_metrics_v1",
};

export const DEFAULT_ADMINS = ["vicdan", "turkguide"];
export const DEFAULT_ADMIN_EMAILS = ["vicdanecer@icloud.com", "info@turkguide.net"];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_VIDEO_BYTES = 12 * 1024 * 1024; // 12MB

/**
 * Bu an ve **sonrasında** oluşturulan hesaplar şartları açıkça kabul etmeli (kayıtta zorunlu).
 * Öncesi mevcut kullanıcı / ekip sayılır (accepted_terms_at boş olsa bile).
 * Production’da deploy anına göre ayarlayın: VITE_TERMS_ENFORCEMENT_START_ISO
 */
const _iso = import.meta.env.VITE_TERMS_ENFORCEMENT_START_ISO || "2026-02-24T00:00:00.000Z";
export const TERMS_ENFORCEMENT_START_MS = (() => {
  const n = Date.parse(_iso);
  return Number.isFinite(n) ? n : Date.parse("2026-02-24T00:00:00.000Z");
})();
