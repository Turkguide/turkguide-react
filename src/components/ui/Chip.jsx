export function Chip({ ui, children, active, onClick, style, title }) {
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
