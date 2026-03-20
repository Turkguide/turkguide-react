/**
 * Sadece localStorage tg_terms_debug === '1' iken (Safari: aynı origin, normal pencere).
 */
export function termsDebugLog(payload) {
  try {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem("tg_terms_debug") !== "1") return;
    console.log("TERMS DEBUG", payload);
  } catch (_) {}
}
