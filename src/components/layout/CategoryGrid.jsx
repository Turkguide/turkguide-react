import { useState, useEffect } from "react";
import { TG_DEFAULT_CATEGORIES } from "../../constants/categories";
import { CatIcon } from "../ui/Icons";

export function CategoryGrid({ ui, counts = {}, onPickCategory, biz = [] }) {
  const [cols, setCols] = useState(() => {
    const w = window.innerWidth;
    if (w < 768) return 2;
    if (w < 1200) return 3;
    return 4;
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setCols(w < 768 ? 2 : w < 1200 ? 3 : 4);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const DEFAULT_CATEGORIES = TG_DEFAULT_CATEGORIES;

  const dynamicCategories = Array.from(
    new Set(
      biz
        .filter((b) => b?.status === "approved" && b?.category)
        .map((b) => String(b.category).trim())
    )
  ).map((cat) => ({
    key: cat,
    icon: "default",
  }));

  const categories = [
    ...DEFAULT_CATEGORIES,
    ...dynamicCategories.filter(
      (d) => !DEFAULT_CATEGORIES.some((c) => c.key === d.key)
    ),
  ];

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 18,
        }}
      >
        {categories.map((it) => (
          <div
            key={it.key}
            onClick={() => onPickCategory?.(it.key)}
            style={{
              cursor: "pointer",
              background:
                ui.mode === "light"
                  ? "rgba(0,0,0,0.03)"
                  : "rgba(255,255,255,0.05)",
              border: `1px solid ${ui.border}`,
              borderRadius: 22,
              padding: 22,
              minHeight: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: `0 30px 90px ${ui.glow}`,
            }}
          >
            <div style={{ width: 28, height: 28, display: "grid", placeItems: "center" }}>
              <CatIcon name={it.icon || "default"} size={28} color={ui.text} />
            </div>

            <div>
              <div style={{ fontWeight: 950, fontSize: 16 }}>{it.key}</div>
              <div style={{ color: ui.muted, fontSize: 13, marginTop: 6 }}>
                {(counts[it.key] ?? 0)} listing
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
