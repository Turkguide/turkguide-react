import { useEffect, useRef, useState } from "react";

export function useAppShellState() {
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.innerWidth < 720;
    } catch (_ignored) {
      return false;
    }
  });

  const [active, setActive] = useState(() => {
    try {
      const saved = sessionStorage.getItem("tg_active_tab_v1");
      if (window.location.pathname === "/admin") return "admin";
      return saved || "biz";
    } catch (_ignored) {
      return window.location.pathname === "/admin" ? "admin" : "biz";
    }
  });

  const lastMainTabRef = useRef("biz");
  useEffect(() => {
    if (["biz", "news", "hub"].includes(active)) {
      lastMainTabRef.current = active;
    }
  }, [active]);

  function goBackToMainTab() {
    setActive(lastMainTabRef.current || "biz");
  }

  useEffect(() => {
    if (active === "admin") {
      if (window.location.pathname !== "/admin") {
        window.history.pushState({}, document.title, "/admin");
      }
    } else if (window.location.pathname === "/admin") {
      window.history.replaceState({}, document.title, "/");
    }
  }, [active]);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 720);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === "/admin") setActive("admin");
      else if (active === "admin") setActive("biz");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [active]);

  useEffect(() => {
    try {
      sessionStorage.setItem("tg_active_tab_v1", active);
    } catch (_ignored) {}
  }, [active]);

  return { isMobile, active, setActive, goBackToMainTab };
}
