import { lsGet, lsSet } from "./localStorage";
import { KEY } from "../constants";

export function now() {
  return Date.now();
}

export function uid() {
  return `${Math.floor(Math.random() * 1e9)}-${Date.now()}`;
}

export function uuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (_) {}
  // Fallback UUID v4-ish
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export function normalizeUsername(s) {
  return String(s || "").trim().toLowerCase();
}

export function isAdminUser(username, admins) {
  const u = normalizeUsername(username);
  return (admins || []).map((x) => normalizeUsername(x)).includes(u);
}

export function trackMetric(name, delta = 1) {
  const key = String(name || "").trim();
  if (!key) return 0;
  const current = lsGet(KEY.METRICS, {});
  const next = {
    ...(current || {}),
    [key]: Number(current?.[key] || 0) + Number(delta || 0),
  };
  lsSet(KEY.METRICS, next);
  return next[key];
}

export function getMetric(name) {
  const key = String(name || "").trim();
  if (!key) return 0;
  const current = lsGet(KEY.METRICS, {});
  return Number(current?.[key] || 0);
}

/**
 * Open Google Maps directions
 */
export function openDirections(address) {
  trackMetric("directions_click_total");
  const q = encodeURIComponent(address || "");
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
}

/**
 * Open phone call
 */
export function openCall(phone) {
  const p = String(phone || "").trim();
  if (!p) return alert("Telefon numarası yok.");
  window.location.href = `tel:${p}`;
}
