export function inputStyle(ui, extra = {}) {
  return {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: ui.field,
    color: ui.text,
    outline: "none",
    ...extra,
  };
}
