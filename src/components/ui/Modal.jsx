import { Button } from "./Button";
import { IconBase } from "./Icons";

export function Modal({ ui, open, title, onClose, children, width = 860, zIndex = 999, iconClose = false, showBack = false, onBack }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "16px",
        paddingTop: "calc(16px + env(safe-area-inset-top))",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        zIndex,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: `min(${width}px, 100%)`,
          maxHeight: "calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
          borderRadius: 22,
          border: `1px solid ${ui.border}`,
          background: ui.mode === "light" ? "rgba(255,255,255,0.98)" : "rgba(10,12,18,0.96)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          padding: 16,
          color: ui.text,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flex: "0 0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {showBack ? (
              <Button
                ui={ui}
                onClick={() => (typeof onBack === "function" ? onBack() : onClose?.())}
                title="Geri"
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconBase size={18}>
                  <path d="M15 18l-6-6 6-6" />
                </IconBase>
              </Button>
            ) : null}

            <div style={{ fontSize: 16, fontWeight: 950, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </div>
          </div>

          <Button
            ui={ui}
            onClick={onClose}
            title="Kapat"
            style={{ padding: "10px 12px", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            {iconClose ? (
              <IconBase size={18}>
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </IconBase>
            ) : (
              "Kapat"
            )}
          </Button>
        </div>

        <div
          style={{
            marginTop: 12,
            flex: "1 1 auto",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
