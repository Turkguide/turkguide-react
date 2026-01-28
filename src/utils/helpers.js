export function now() {
  return Date.now();
}

export function uid() {
  return `${Math.floor(Math.random() * 1e9)}-${Date.now()}`;
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

/**
 * Open Google Maps directions
 */
export function openDirections(address) {
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
