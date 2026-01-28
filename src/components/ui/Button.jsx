export function Button({ ui, children, onClick, onMouseDown, variant = "default", disabled, style, title, type }) {
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
    <button
      type={type || "button"}
      onMouseDown={onMouseDown}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...(v || {}), ...(style || {}) }}
      title={title}
    >
      {children}
    </button>
  );
}
