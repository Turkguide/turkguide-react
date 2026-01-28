export function Divider({ ui }) {
  return <div style={{ height: 1, background: ui.mode === "light" ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)", margin: "16px 0" }} />;
}
