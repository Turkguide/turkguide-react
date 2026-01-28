import { Modal, Avatar, Button, inputStyle } from "../ui";
import { fmt } from "../../utils/helpers";

export function EditBizModal({
  ui,
  open,
  onClose,
  editBizCtx,
  setEditBizCtx,
  onSave,
}) {
  if (!open || !editBizCtx) return null;

  return (
    <Modal ui={ui} open={open} title="İşletme Yönet / Düzenle" onClose={onClose}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar ui={ui} src={editBizCtx.avatar} size={62} label={editBizCtx.name} />
          <div style={{ color: ui.muted }}>
            Oluşturma: {fmt(editBizCtx.createdAt)} • Owner: @{editBizCtx.ownerUsername || "-"}
          </div>
        </div>

        {/* ✅ FOTO / LOGO YÜKLE */}
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12 }}>İşletme Fotoğrafı / Logo</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                const base64 = String(reader.result || "");
                setEditBizCtx((p) => ({ ...p, avatar: base64 }));
              };
              reader.readAsDataURL(file);

              // aynı dosyayı tekrar seçebilmek için:
              e.target.value = "";
            }}
            style={inputStyle(ui)}
          />
          <div style={{ color: ui.muted2, fontSize: 12 }}>
            JPG/PNG seç. Seçince anında önizleme olur; Kaydet deyince kalıcı olur.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>İşletme Adı</div>
            <input
              value={editBizCtx.name || ""}
              onChange={(e) => setEditBizCtx((p) => ({ ...p, name: e.target.value }))}
              style={inputStyle(ui)}
            />
          </div>
          <div>
            <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Kategori</div>
            <input
              value={editBizCtx.category || ""}
              onChange={(e) => setEditBizCtx((p) => ({ ...p, category: e.target.value }))}
              style={inputStyle(ui)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Telefon</div>
            <input
              value={editBizCtx.phone || ""}
              onChange={(e) => setEditBizCtx((p) => ({ ...p, phone: e.target.value }))}
              style={inputStyle(ui)}
            />
          </div>
          <div>
            <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Adres</div>
            <input
              value={editBizCtx.address || ""}
              onChange={(e) => setEditBizCtx((p) => ({ ...p, address: e.target.value }))}
              style={inputStyle(ui)}
            />
          </div>
        </div>

        <div>
          <div style={{ color: ui.muted, fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Açıklama</div>
          <textarea
            value={editBizCtx.desc || ""}
            onChange={(e) => setEditBizCtx((p) => ({ ...p, desc: e.target.value }))}
            style={inputStyle(ui, { minHeight: 90, resize: "vertical" })}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
