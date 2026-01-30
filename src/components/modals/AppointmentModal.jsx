import { Modal, Button, inputStyle } from "../ui";

export function AppointmentModal({
  ui,
  showAppt,
  setShowAppt,
  apptMsg,
  setApptMsg,
  apptDateTime,
  setApptDateTime,
  submitAppointment,
}) {
  return (
    <Modal ui={ui} open={showAppt} title="Randevu Talebi" onClose={() => setShowAppt(false)}>
      <div style={{ color: ui.muted, marginBottom: 10 }}>
        Lütfen randevu tarih ve saatini seçin; dilerseniz kısa bir not ekleyebilirsiniz. (MVP: talep işletmeye iletilmiş sayılır.)
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: ui.muted2, marginBottom: 6 }}>Tarih ve Saat</div>
        <input
          type="datetime-local"
          value={apptDateTime}
          onChange={(e) => setApptDateTime(e.target.value)}
          style={inputStyle(ui, { width: "100%" })}
        />
      </div>

      <textarea
        value={apptMsg}
        onChange={(e) => setApptMsg(e.target.value)}
        placeholder="Kısa not (isteğe bağlı)"
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
