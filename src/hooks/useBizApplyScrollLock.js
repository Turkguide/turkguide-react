import { useEffect, useRef } from "react";

export function useBizApplyScrollLock({ isMobile, showBizApply }) {
  const scrollLockRef = useRef(0);

  useEffect(() => {
    if (!isMobile || !showBizApply) return;

    try {
      scrollLockRef.current = window.scrollY || 0;
      const body = document.body;
      body.style.position = "fixed";
      body.style.top = `-${scrollLockRef.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    } catch (_ignored) {}

    return () => {
      try {
        const body = document.body;
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        body.style.overflow = "";
        window.scrollTo(0, scrollLockRef.current || 0);
      } catch (_ignored) {}
    };
  }, [isMobile, showBizApply]);
}
