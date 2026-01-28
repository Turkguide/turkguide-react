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

  function openAppointment(bizId) {
    if (!requireAuth()) return;
    setApptBizId(bizId);
    setApptMsg("");
    setShowAppt(true);
  }

  async function submitAppointment() {
    if (!requireAuth()) return;
    const bizId = apptBizId;
    const msg = String(apptMsg || "").trim();
    if (!bizId) {
      alert("İşletme seçilmedi.");
      return;
    }
    if (!msg) return alert("Randevu notu yaz (örn: tarih/saat isteği).");

    const b = biz.find((x) => x.id === bizId);
    const a = {
      id: uid(),
      createdAt: now(),
      status: "pending",
      bizId,
      bizName: b?.name || "-",
      fromUsername: user.username,
      note: msg,
    };

    try {
      const { error } = await supabase.from("appointments").insert([a]);
      if (error) throw error;
    } catch (e) {
      console.error("submitAppointment insert error:", e);
      // Fallback to local state if DB fails
    }

    setAppts((prev) => [a, ...prev]);
    setShowAppt(false);
    setApptBizId(null);
    setApptMsg("");
  }

  return {
    showAppt,
    setShowAppt,
    apptBizId,
    setApptBizId,
    apptMsg,
    setApptMsg,
    openAppointment,
    submitAppointment,
  };
}
