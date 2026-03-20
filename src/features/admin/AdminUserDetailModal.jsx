import { useState, useEffect } from "react";
import { Modal, Button, Avatar } from "../../components/ui";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../utils/helpers";

function Field({ ui, label, children }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: ui.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${ui.border}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: ui.muted2,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: ui.text, fontWeight: 650, wordBreak: "break-word", lineHeight: 1.45 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Admin: tam profil satırı (profiles.*) + kayıt/güncelleme zamanları
 */
export function AdminUserDetailModal({ ui, open, onClose, userId, onManage, onOpenPublicProfile }) {
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !userId) {
      setRow(null);
      setErr("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        setRow(data || null);
      } catch (e) {
        if (!cancelled) setErr(String(e?.message || e || "Yüklenemedi"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const uname = row?.username ? String(row.username) : "";
  const av = row?.avatar ? String(row.avatar) : "";

  return (
    <Modal ui={ui} open={open} onClose={onClose} title="Kullanıcı detayı" width={720} zIndex={1300}>
      <div style={{ display: "grid", gap: 14 }}>
        {loading ? (
          <div style={{ color: ui.muted, fontSize: 14, padding: 12 }}>Profil yükleniyor…</div>
        ) : err ? (
          <div style={{ color: ui.red, fontSize: 14 }}>{err}</div>
        ) : !row ? (
          <div style={{ color: ui.muted }}>Kayıt bulunamadı.</div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
                padding: 14,
                borderRadius: 16,
                background: ui.mode === "light" ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.12)",
                border: `1px solid ${ui.border}`,
              }}
            >
              <Avatar ui={ui} src={av} size={72} label={uname} />
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 950 }}>@{uname || "—"}</div>
                <div style={{ color: ui.muted, fontSize: 13, marginTop: 4 }}>{String(row.email || "—")}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {onOpenPublicProfile && uname ? (
                    <Button ui={ui} variant="blue" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => onOpenPublicProfile(uname)}>
                      Halka açık profil
                    </Button>
                  ) : null}
                  {onManage ? (
                    <Button ui={ui} variant="ok" style={{ padding: "8px 14px", fontSize: 13 }} onClick={onManage}>
                      Düzenle (Yönet)
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              <Field ui={ui} label="Kullanıcı ID">
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{String(row.id)}</span>
              </Field>
              <Field ui={ui} label="E-posta">{String(row.email || "—")}</Field>
              <Field ui={ui} label="Rol">{String(row.role || "—")}</Field>
              <Field ui={ui} label="Kayıt (profiles)">{row.created_at ? fmt(new Date(row.created_at).getTime()) : "—"}</Field>
              <Field ui={ui} label="Güncelleme">{row.updated_at ? fmt(new Date(row.updated_at).getTime()) : "—"}</Field>
              <Field ui={ui} label="Şartlar kabul">
                "—"
              </Field>
              <Field ui={ui} label="Askı (ban)">
                {row.banned_at ? fmt(new Date(row.banned_at).getTime()) : "Yok"}
              </Field>
              <Field ui={ui} label="XP / Tier">
                {String(row.xp ?? row.XP ?? "—")} · {String(row.tier || row.Tier || "—")}
              </Field>
              <Field ui={ui} label="Yaş">{row.age != null && row.age !== "" ? String(row.age) : "—"}</Field>
              <Field ui={ui} label="Şehir">{String(row.city || "—")}</Field>
              <Field ui={ui} label="Eyalet">{String(row.state || "—")}</Field>
              <Field ui={ui} label="Ülke">{String(row.country || "—")}</Field>
            </div>

            <Field ui={ui} label="Biyografi">
              {String(row.bio || "—")}
            </Field>

            {av && av.length > 80 ? (
              <div style={{ color: ui.muted2, fontSize: 11 }}>
                Profil fotoğrafı veritabanında (base64) saklanıyor; önizleme yukarıda.
              </div>
            ) : null}
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <Button ui={ui} onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
