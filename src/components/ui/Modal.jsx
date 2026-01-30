import { useEffect, useState } from "react";
import { Button } from "./Button";
import { IconBase } from "./Icons";

export function Modal({ ui, open, title, onClose, children, width = 860, zIndex = 999, iconClose = false, showBack = false, onBack, fullScreen = false }) {
  const [vvHeight, setVvHeight] = useState(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!open || !fullScreen || !window?.visualViewport) return;

    const updateViewport = () => {
      try {
        const vv = window.visualViewport;
        const h = vv?.height || window.innerHeight;
        const offsetTop = vv?.offsetTop || 0;
        const layoutH = window.innerHeight || h;
        const inset = Math.max(0, layoutH - h - offsetTop);

        setVvHeight(h + offsetTop);
        setKeyboardInset(inset);
      } catch (_) {}
    };

    updateViewport();
    window.visualViewport.addEventListener("resize", updateViewport);
    window.visualViewport.addEventListener("scroll", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      try {
        window.visualViewport.removeEventListener("resize", updateViewport);
        window.visualViewport.removeEventListener("scroll", updateViewport);
        window.removeEventListener("orientationchange", updateViewport);
      } catch (_) {}
    };
  }, [open, fullScreen]);

  const fullScreenHeight = fullScreen
    ? vvHeight
      ? `${vvHeight}px`
      : "100svh"
    : undefined;
  const fullScreenOffset = fullScreen ? 28 : 0;

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: fullScreen ? ui.bg : "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: fullScreen ? "stretch" : "flex-start",
        justifyContent: fullScreen ? "stretch" : "center",
        padding: fullScreen ? 0 : "16px",
        paddingTop: fullScreen
          ? `${fullScreenOffset}px`
          : "calc(60px + env(safe-area-inset-top))",
        paddingBottom: fullScreen ? 0 : "calc(16px + env(safe-area-inset-bottom))",
        overflowY: fullScreen ? "hidden" : "auto",
        WebkitOverflowScrolling: "touch",
        zIndex,
        touchAction: "manipulation",
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: fullScreen ? "100%" : `min(${width}px, 100%)`,
          height:
            fullScreen && fullScreenHeight
              ? `calc(${fullScreenHeight} - ${fullScreenOffset}px)`
              : fullScreen
              ? fullScreenHeight
              : undefined,
          maxHeight: fullScreen
            ? fullScreenHeight
              ? `calc(${fullScreenHeight} - ${fullScreenOffset}px)`
              : "100svh"
            : "calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
          borderRadius: fullScreen ? 0 : 22,
          border: fullScreen ? "none" : `1px solid ${ui.border}`,
          background: fullScreen
            ? ui.bg
            : ui.mode === "light"
            ? "rgba(255,255,255,0.98)"
            : "rgba(10,12,18,0.96)",
          boxShadow: fullScreen ? "none" : "0 40px 120px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          padding: fullScreen
            ? "calc(28px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom))"
            : 16,
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
            paddingBottom: fullScreen
              ? `calc(${Math.max(0, keyboardInset)}px + 16px + env(safe-area-inset-bottom))`
              : "calc(8px + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
