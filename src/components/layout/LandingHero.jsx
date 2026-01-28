import { Button } from "../ui/Button";
import { Seg } from "./Seg";

export function LandingHero({ ui, active, setActive, searchText, setSearchText, onSearch }) {
  const segWrap = {
    marginTop: 40,
    background: ui.whitePanel,
    borderRadius: 18,
    padding: 6,
    border: ui.mode === "light" ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    width: "100%",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 6,
  };

  return (
    <div
      style={{
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        padding: "70px 0 28px",
        overflowX: "hidden",
        background:
          ui.mode === "light"
            ? "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 75%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 75%)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div style={{ display: "grid", placeItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 999,
              background: "#fff",
              color: "#0b0c10",
              fontWeight: 950,
              fontSize: 12,
              letterSpacing: 0.2,
              boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
              maxWidth: "100%",
            }}
          >
            <span style={{ opacity: 0.65 }}>●</span> AMERİKA'NIN İLK TÜRK REHBERİ
          </div>

          <h1
            style={{
              marginTop: 26,
              textAlign: "center",
              fontWeight: 950,
              color: ui.blue,
              lineHeight: 1.05,
              fontSize: "clamp(32px, 8.5vw, 64px)",
              padding: "0 12px",
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: "100%",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            Discover
            <br />
            Turkish Businesses
          </h1>

          <div style={{ marginTop: 14, color: ui.muted, fontSize: 18, textAlign: "center" }}>
            Amerika'nın her köşesinden Türk işletmeleri ve profesyonelleri keşfedin
          </div>

          <div
            style={{
              marginTop: 34,
              width: "100%",
              maxWidth: 760,
              background: ui.mode === "light" ? "rgba(255,255,255,0.88)" : ui.field2,
              border: `1px solid ${ui.border}`,
              borderRadius: 999,
              padding: 12,
              display: "flex",
              flexWrap: "nowrap",
              boxSizing: "border-box",
              gap: 10,
              alignItems: "center",
              boxShadow: "0 28px 80px rgba(0,0,0,0.50)",
            }}
          >
            <span style={{ opacity: 0.65, fontSize: 18, paddingLeft: 6 }}>🔍</span>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tüm kategorilerde ara..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: ui.text,
                fontSize: 16,
                padding: 10,
                minWidth: 0,
              }}
            />
            <Button ui={ui} variant="solidBlue" onClick={onSearch} style={{ padding: "12px 18px", flex: "0 0 auto" }}>
              Ara
            </Button>
          </div>

          <div style={{ width: "100%", maxWidth: 1100, boxSizing: "border-box" }}>
            <div style={segWrap}>
              <Seg id="biz" icon="🏢" label="İŞLETMELER" active={active} setActive={setActive} />
              <Seg id="news" icon="📰" label="HABERLER" active={active} setActive={setActive} />
              <Seg id="hub" icon="👥" label="HUB" active={active} setActive={setActive} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
