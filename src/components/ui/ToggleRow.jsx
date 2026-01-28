import { Button } from "./Button";

export function ToggleRow({ ui, label, desc, value, onToggle }) {
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
