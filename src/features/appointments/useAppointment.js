import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { now, uid } from "../../utils/helpers";

/**
 * Hook for managing appointments
 */
export function useAppointment({ user, appts, setAppts, biz, requireAuth }) {
  const [showAppt, setShowAppt] = useState(false);
  const [apptBizId, setApptBizId] = useState(null);
  const [apptMsg, setApptMsg] = useState("");
  const [apptDateTime, setApptDateTime] = useState("");

  function openAppointment(bizId) {
    if (!requireAuth({ requireTerms: true })) return;
    setApptBizId(bizId);
    setApptMsg("");
    setApptDateTime("");
    setShowAppt(true);
  }

  async function submitAppointment() {
    if (!requireAuth({ requireTerms: true })) return;
    const bizId = apptBizId;
    const msg = String(apptMsg || "").trim();
    const requestedAt = String(apptDateTime || "").trim();
    if (!bizId) {
      alert("İşletme seçilmedi.");
      return;
    }
    if (!requestedAt) return alert("Lütfen randevu tarih ve saatini seçin.");

    const b = biz.find((x) => x.id === bizId);
    let apptId = uid();
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        apptId = crypto.randomUUID();
      }
    } catch (_) {}
    const a = {
      id: apptId,
      createdAt: now(),
      status: "pending",
      bizId,
      bizName: b?.name || "-",
      fromUsername: user.username,
      requestedAt,
      note: msg,
    };

    try {
      const noteForDb = requestedAt
        ? [`Tarih/Saat: ${new Date(requestedAt).toLocaleString()}`, msg].filter(Boolean).join(" — ")
        : msg;
      const insertPayload = {
        id: a.id,
        createdAt: a.createdAt,
        status: a.status,
        bizId: a.bizId,
        bizName: a.bizName,
        fromUsername: a.fromUsername,
        note: noteForDb,
      };
      const { error } = await supabase.from("appointments").insert([insertPayload]);
      if (error) throw error;
    } catch (e) {
      console.error("submitAppointment insert error:", e);
      // Fallback to local state if DB fails
    }

    setAppts((prev) => [a, ...prev]);
    setShowAppt(false);
    setApptBizId(null);
    setApptMsg("");
    setApptDateTime("");
    setTimeout(() => {
      alert("Randevu talebiniz işletmeye iletildi.");
    }, 0);
  }

  return {
    showAppt,
    setShowAppt,
    apptBizId,
    setApptBizId,
    apptMsg,
    setApptMsg,
    apptDateTime,
    setApptDateTime,
    openAppointment,
    submitAppointment,
  };
}
