import { Modal, Avatar, Button, inputStyle } from "../ui";

export function EditUserModal({
  ui,
  open,
  onClose,
  editUserCtx,
  setEditUserCtx,
  pickedAvatarName,
  setPickedAvatarName,
  onSave,
}) {
  if (!open || !editUserCtx) return null;

  return (
    <Modal ui={ui} open={open} title="Kullanıcı Yönet / Düzenle" onClose={onClose} zIndex={1200}>
      <div style={{ display: "grid", gap: 16 }}>
        {/* ÜST BİLGİ */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar ui={ui} src={editUserCtx.avatar} size={72} label={editUserCtx.username} />

          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 950 }}>@{editUserCtx.username}</div>

            <div style={{ color: ui.muted, fontSize: 13 }}>
              Kayıt: {new Date(editUserCtx.createdAt).toLocaleDateString()}
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, color: ui.blue }}>XP: {editUserCtx.xp ?? 0}</div>
          </div>
        </div>

        {/* PROFİL FOTO */}
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Profil Fotoğrafı</div>

          {/* ✅ 1) input'u gizle */}
          <input
            id="avatarPickInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              // ✅ dosya adını sakla
              setPickedAvatarName(file.name || "");

              const img = new Image();
              const url = URL.createObjectURL(file);

              img.onload = () => {
                try {
                  const MAX = 320;
                  const scale = Math.min(1, MAX / Math.max(img.width, img.height));

                  const canvas = document.createElement("canvas");
                  canvas.width = Math.max(1, Math.round(img.width * scale));
                  canvas.height = Math.max(1, Math.round(img.height * scale));

                  const ctx = canvas.getContext("2d");
                  if (!ctx) throw new Error("Canvas context yok");
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                  const compressed = canvas.toDataURL("image/jpeg", 0.75);
                  setEditUserCtx((p) => ({ ...p, avatar: compressed }));
                } catch (err) {
                  console.error("avatar compress error:", err);
                  alert("Foto işlenirken hata oluştu.");
                } finally {
                  URL.revokeObjectURL(url);
                  e.target.value = ""; // aynı dosyayı tekrar seçebilsin
                }
              };

              img.onerror = () => {
                URL.revokeObjectURL(url);
                e.target.value = "";
                alert("Foto okunamadı.");
              };

              img.src = url;
            }}
          />

          {/* ✅ 2) tarayıcının "seçili dosya yok" satırı yerine kendi satırımız */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${ui.border}`,
              background: ui.panel,
            }}
          >
            <button
              type="button"
              onClick={() => document.getElementById("avatarPickInput")?.click()}
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                border: `1px solid ${ui.border}`,
                background: ui.bg,
                color: ui.text,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Dosyayı Seçin
            </button>

            <div style={{ color: ui.muted2, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
              {pickedAvatarName ? pickedAvatarName : "seçili dosya yok"}
            </div>
          </div>

          <div style={{ color: ui.muted2, fontSize: 12 }}>
            Foto seçince önizleme değişir. Kaydet deyince kalıcı olur.
          </div>
        </div>

        {/* USERNAME */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Username</div>
          <input
            value={editUserCtx.username || ""}
            onChange={(e) => setEditUserCtx((p) => ({ ...p, username: e.target.value }))}
            style={inputStyle(ui)}
          />
        </div>

        {/* EMAIL */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Email</div>
          <input
            value={editUserCtx.email || ""}
            onChange={(e) => setEditUserCtx((p) => ({ ...p, email: e.target.value }))}
            placeholder="ornek@mail.com"
            style={inputStyle(ui)}
          />
          <div style={{ color: ui.muted2, fontSize: 12, marginTop: 6 }}>
            Email değişirse doğrulama maili gönderilir.
          </div>
        </div>

        {/* AGE */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Yaş</div>
          <input
            value={String(editUserCtx.age || "")}
            onChange={(e) => setEditUserCtx((p) => ({ ...p, age: e.target.value }))}
            placeholder="Örn: 28"
            style={inputStyle(ui)}
          />
        </div>

        {/* CITY */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Şehir</div>
          <input
            value={String(editUserCtx.city || "")}
            onChange={(e) => setEditUserCtx((p) => ({ ...p, city: e.target.value }))}
            placeholder="Örn: Los Angeles"
            style={inputStyle(ui)}
          />
        </div>

        {/* STATE */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Eyalet</div>
          <input
            value={String(editUserCtx.state || "")}
            onChange={(e) => setEditUserCtx((p) => ({ ...p, state: e.target.value }))}
            placeholder="Örn: CA"
            style={inputStyle(ui)}
          />
        </div>

        {/* COUNTRY */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Ülke</div>
          <input
            value={String(editUserCtx.country || "")}
            onChange={(e) => setEditUserCtx((p) => ({ ...p, country: e.target.value }))}
            placeholder="Örn: United States"
            style={inputStyle(ui)}
          />
        </div>

        {/* BIO */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Bio</div>
          <textarea
            value={String(editUserCtx.bio || "")}
            onChange={(e) => setEditUserCtx((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Kendini kısaca tanıt…"
            style={inputStyle(ui, { minHeight: 110, resize: "vertical" })}
          />
        </div>

        {/* AKSİYONLAR */}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Button ui={ui} variant="solidBlue" onClick={onSave}>
            Kaydet
          </Button>
          <Button ui={ui} onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Modal>
  );
}
