export function Brand({ ui }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div style={{ fontSize: 44, fontWeight: 950, letterSpacing: -0.8, lineHeight: 1, color: ui.text }}>
        Turk
        <span
          style={{
            background: "linear-gradient(180deg, #7fe7ff 0%, #4aa8ff 55%, #2f66ff 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          G
        </span>
        uide
      </div>
    </div>
  );
}
