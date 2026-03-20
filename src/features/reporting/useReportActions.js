import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { uuid } from "../../utils/helpers";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Taciz / Zorbalik" },
  { value: "inappropriate_content", label: "Uygunsuz icerik" },
  { value: "hate_speech", label: "Nefret soylemi" },
  { value: "violence", label: "Siddet veya tehdit" },
  { value: "other", label: "Diger" },
];

export function useReportActions({ user, requireAuth, setReports, setPosts }) {
  const [reportCtx, setReportCtx] = useState(null);
  const [reportReasonCode, setReportReasonCode] = useState("");
  const [reportReasonDetail, setReportReasonDetail] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  async function openReport(ctx) {
    if (!ctx) return;
    try {
      if (!(await requireAuth())) return;
      setReportCtx(ctx);
      setReportReasonCode("");
      setReportReasonDetail("");
    } catch (e) {
      if (import.meta.env.DEV) console.error("openReport error:", e);
      alert("Sikayet ekrani acilamadi. Lutfen tekrar deneyin.");
    }
  }

  async function submitReport() {
    if (!reportCtx || !user?.id) return;
    const reasonCode = String(reportReasonCode || "").trim();
    if (!reasonCode) {
      alert("Lutfen bir sikayet sebebi secin.");
      return;
    }
    if (submittingReport) return;
    setSubmittingReport(true);

    const reporterUsername = user?.username ?? user?.email ?? "user";
    const detail = String(reportReasonDetail || "").trim();
    const reasonText = REPORT_REASONS.find((r) => r.value === reasonCode)?.label || reasonCode;
    const reason = detail ? `${reasonText}: ${detail}` : reasonText;

    const callRpc = () =>
      supabase.rpc("insert_report", {
        p_reporter_username: reporterUsername,
        p_target_type: reportCtx.type || "",
        p_target_id: String(reportCtx.targetId || ""),
        p_target_owner: reportCtx.targetOwner || "",
        p_target_label: reportCtx.targetLabel || "",
        p_reason: reason,
      });

    const REPORT_TIMEOUT_MS = 25000;
    const run = async () => {
      if (!supabase?.rpc) throw new Error("Sikayet ozelligi su an kullanilamiyor.");
      let result = await callRpc();
      if (
        result?.error &&
        /jwt|session|unauthorized|PGRST301|row-level security/i.test(String(result.error?.message || ""))
      ) {
        try {
          await Promise.race([
            supabase.auth.refreshSession(),
            new Promise((_, rej) => setTimeout(() => rej(new Error("refresh_timeout")), 18000)),
          ]);
        } catch (_) {}
        result = await callRpc();
      }
      return result;
    };

    try {
      const result = await Promise.race([
        run(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("report_timeout")), REPORT_TIMEOUT_MS)),
      ]);
      const err = result?.error;
      if (err) throw err;
      const insertedId = result?.data ?? uuid();
      setReports((prev) => [
        {
          id: insertedId,
          createdAt: Date.now(),
          reporterId: user.id,
          reporterUsername,
          targetType: reportCtx.type,
          targetId: String(reportCtx.targetId || ""),
          targetLabel: reportCtx.targetLabel || "",
          reason,
          status: "open",
        },
        ...(prev || []),
      ]);
      if (reportCtx.type === "hub_post") {
        setPosts((prev) => (prev || []).filter((p) => String(p.id) !== String(reportCtx.targetId)));
      }
      if (reportCtx.type === "hub_comment") {
        setPosts((prev) =>
          (prev || []).map((p) => ({
            ...p,
            comments:
              String(p.id) === String(reportCtx.targetParentId)
                ? (p.comments || []).filter((c) => String(c.id) !== String(reportCtx.targetId))
                : p.comments,
          }))
        );
      }
      alert("Sikayetiniz alindi. Inceleme icin yonlendirildi.");
      setReportCtx(null);
      setReportReasonCode("");
      setReportReasonDetail("");
    } catch (e) {
      if (import.meta.env.DEV) console.warn("submitReport error:", e);
      const msg = String(e?.message || "").toLowerCase();
      if (/report_timeout|refresh_timeout|timeout|timed out|fetch|network|baglanti/i.test(msg)) {
        alert("Islem uzadi veya baglanti kurulamadi. Lutfen ag baglantinizi kontrol edip tekrar deneyin.");
      } else if (/row-level security|violates.*policy/i.test(msg)) {
        alert("Sikayet gonderilemedi. Oturum sunucuda taninmiyor olabilir. Lutfen cikis yapip tekrar giris yapin.");
      } else {
        alert("Sikayet gonderilemedi. " + (e?.message ? String(e.message) : "Lutfen tekrar deneyin."));
      }
    } finally {
      setSubmittingReport(false);
    }
  }

  return {
    REPORT_REASONS,
    reportCtx,
    setReportCtx,
    reportReasonCode,
    setReportReasonCode,
    reportReasonDetail,
    setReportReasonDetail,
    submittingReport,
    openReport,
    submitReport,
  };
}
