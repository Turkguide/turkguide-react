export function themeTokens(mode) {
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
