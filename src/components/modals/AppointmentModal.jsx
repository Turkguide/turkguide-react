import { Modal, Button, inputStyle } from "../ui";

export function AppointmentModal({
  ui,
  showAppt,
  setShowAppt,
  apptMsg,
  setApptMsg,
  submitAppointment,
}) {
  return (
    <Modal ui={ui} open={showAppt} title="Randevu Talebi" onClose={() => setShowAppt(false)}>
      <div style={{ color: ui.muted, marginBottom: 10 }}>
        Tarih/saat isteğini ve kısa notunu yaz (MVP: talep işletmeye iletilmiş sayılır).
      </div>

      <textarea
        value={apptMsg}
        onChange={(e) => setApptMsg(e.target.value)}
        placeholder="Örn: Yarın 2pm uygunsa görüşmek istiyorum..."
        style={inputStyle(ui, { minHeight: 110, resize: "vertical" })}
      />

      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button ui={ui} variant="solidBlue" onClick={submitAppointment}>
          Talep Gönder
        </Button>
        <Button ui={ui} onClick={() => setShowAppt(false)}>
          Vazgeç
        </Button>
      </div>
    </Modal>
  );
}
