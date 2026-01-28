export function Seg({ id, icon, label, active, setActive }) {
  const isActive = active === id;

  return (
    <div
      onClick={() => setActive(id)}
      style={{
        minWidth: 0,
        padding: "12px 8px",
        borderRadius: 14,
        background: isActive ? "#fff" : "transparent",
        color: isActive ? "#000" : "rgba(0,0,0,0.55)",

        // ✅ Mobilde yazı kesilmesin: icon üstte, yazı altta 2 satıra kadar
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,

        fontWeight: 950,
        cursor: "pointer",
        userSelect: "none",
        textAlign: "center",
      }}
    >
      <span style={{ opacity: isActive ? 1 : 0.8, lineHeight: 1 }}>{icon}</span>

      <span
        style={{
          maxWidth: "100%",
          fontSize: 13,
          lineHeight: 1.1,

          // ✅ kesme yok, wrap var
          whiteSpace: "normal",
          overflow: "hidden",
          textOverflow: "clip",
          wordBreak: "break-word",
        }}
      >
        {label}
      </span>
    </div>
  );
}
