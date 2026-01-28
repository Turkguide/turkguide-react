export function Card({ ui, children, style }) {
  return (
    <div
      style={{
        border: `1px solid ${ui.border}`,
        background: ui.panel,
        borderRadius: 18,
        padding: 16,
        boxShadow: `0 18px 50px ${ui.glow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
