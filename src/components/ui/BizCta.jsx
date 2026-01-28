import { IconBase } from "./Icons";

export function BizCta({ ui, onClick, compact = false, block = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tg-cta"
      style={{
        border: "none",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        display: "inline-flex",
        width: block ? "100%" : "auto",
        maxWidth: "100%",
        alignItems: "center",
        justifyContent: block ? "space-between" : "center",
        gap: 10,
        padding: compact ? "10px 14px" : "14px 18px",
        borderRadius: 999,
        fontWeight: 950,
        fontSize: compact ? 13 : 15,
        letterSpacing: -0.2,
        color: "#fff",
        background:
          "linear-gradient(135deg, rgba(47,102,255,1) 0%, rgba(123,97,255,1) 45%, rgba(255,79,216,1) 100%)",
        boxShadow: "0 22px 70px rgba(47,102,255,0.28)",
        position: "relative",
        overflow: "hidden",
        minHeight: compact ? 40 : 46,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
      title="İşletmenizi TurkGuide'a ekleyin"
      aria-label="İşletmenizi ekleyin"
    >
      <span
        aria-hidden="true"
        style={{
          width: compact ? 26 : 30,
          height: compact ? 26 : 30,
          borderRadius: 999,
          background: "rgba(255,255,255,0.16)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        <IconBase size={compact ? 16 : 18}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </IconBase>
      </span>

      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 3,
          whiteSpace: "normal",
          lineHeight: 1.1,
        }}
      >
        <span style={{ fontWeight: 950 }}>İşletmenizi Ekleyin</span>

        {!compact ? (
          <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.9 }}>
            Ücretsiz Başvur
          </span>
        ) : null}
      </span>
      {block ? (
        <span
          aria-hidden="true"
          style={{
            width: compact ? 26 : 30,
            height: compact ? 26 : 30,
            flex: "0 0 auto",
          }}
        />
      ) : null}

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px 120px at 20% 10%, rgba(255,255,255,0.22), transparent 60%)",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
