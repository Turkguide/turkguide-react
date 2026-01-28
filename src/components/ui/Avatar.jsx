export function Avatar({ ui, src, size = 44, label }) {
  const bg = ui.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  return (
    <div
      title={label || ""}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
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
