import { useState } from "react";
import { now, uid } from "../../utils/helpers";

/**
 * Hook for business operations
 */
export function useBusiness({ user, setBiz, setBizApps, setUsers, addLog, requireAuth, adminMode }) {
  const [showBizApply, setShowBizApply] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [rejectCtx, setRejectCtx] = useState(null);
  const [showDeleteReason, setShowDeleteReason] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [deleteCtx, setDeleteCtx] = useState(null);

  /**
   * Submit business application
   */
  function submitBizApplication(data) {
    if (!requireAuth()) return;

    // ✅ Core fields
    const name = String(data?.name || "").trim();
    const category = String(data?.category || "").trim();
    const desc = String(data?.desc || "").trim();

    // ✅ Address fields (more universal)
    const country = String(data?.country || "").trim();
    const state = String(data?.state || "").trim();
    const cityOnly = String(data?.city || "").trim();
    const zip = String(data?.zip || "").trim();
    const address1 = String(data?.address1 || data?.address || "").trim();
    const apt = String(data?.apt || "").trim();

    // Keep backward-compatible `city` string used around the app
    const city = [cityOnly, state].filter(Boolean).join(", ") || String(data?.city || "").trim();

    // ✅ Phone (dial code select + local number)
    const phoneDial = String(data?.phoneDial || "").trim();
    const phoneLocal = String(data?.phoneLocal || "").trim();
    const phone = String(data?.phone || "").trim() || [phoneDial, phoneLocal].filter(Boolean).join(" ").trim();

    // ✅ ZORUNLU ALAN VALIDATION (evrensel)
    if (!name) {
      alert("İşletme adı zorunludur.");
      return;
    }

    if (!address1) {
      alert("Adres bilgisi zorunludur.");
      return;
    }

    if (!zip || !/^\d{4,10}$/.test(zip)) {
      alert("Geçerli bir ZIP / posta kodu girin.");
      return;
    }

    if (!phone || phone.replace(/\D/g, "").length < 7) {
      alert("Geçerli bir telefon numarası girin.");
      return;
    }

    if (!category) {
      alert("Lütfen bir işletme kategorisi seçin.");
      return;
    }

    setBizApps((prev) => [
      {
        id: uid(),
        createdAt: now(),
        status: "pending",
        applicant: user.username,
        ownerUsername: user.username,
        name,
        category,
        desc,
        country,
        state,
        zip,
        apt,
        address1,
        address: [address1, apt ? `Apt ${apt}` : "", cityOnly, state, zip, country].filter(Boolean).join(", "),
        city,
        phoneDial,
        phoneLocal,
        phone,
        avatar: String(data?.avatar || "").trim() || "",
      },
      ...prev,
    ]);

    alert("✅ Başvurunuz alındı. İncelendikten sonra işletmeler listesinde görünecek.");
    setShowBizApply(false);
  }

  /**
   * Admin approve business application
   */
  function adminApprove(app) {
    if (!adminMode) return;
    const b = {
      id: uid(),
      createdAt: now(),
      status: "approved",
      name: app.name,
      city: app.city,
      address: app.address || app.city,
      phone: app.phone || "",
      category: app.category,
      desc: app.desc || "",
      avatar: app.avatar || "",
      ownerUsername: app.ownerUsername || app.applicant || "",
      applicant: app.applicant,
      approvedAt: now(),
      approvedBy: user.username,
    };
    setBiz((prev) => [b, ...prev]);
    setBizApps((prev) => prev.filter((x) => x.id !== app.id));
    addLog("BUSINESS_APPROVE", { appId: app.id, name: app.name });
  }

  /**
   * Open reject modal
   */
  function openReject(app) {
    if (!adminMode) return;
    setRejectCtx(app);
    setRejectText("");
    setShowRejectReason(true);
  }

  /**
   * Admin reject business application
   */
  function adminReject() {
    if (!adminMode) return;
    const reason = String(rejectText || "").trim();
    if (!reason) return alert("Sebep yazmalısın.");
    if (!rejectCtx) return;

    setBizApps((prev) => prev.filter((x) => x.id !== rejectCtx.id));
    addLog("BUSINESS_REJECT", { appId: rejectCtx.id, name: rejectCtx.name, reason });
    setShowRejectReason(false);
    setRejectCtx(null);
    setRejectText("");
  }

  /**
   * Open delete modal
   */
  function openDelete(type, item) {
    if (!adminMode) return;
    setDeleteCtx({ type, item });
    setReasonText("");
    setShowDeleteReason(true);
  }

  /**
   * Confirm delete (business or user)
   */
  function confirmDelete() {
    if (!adminMode) return;
    const reason = String(reasonText || "").trim();
    if (!reason) return alert("Sebep yazmalısın.");
    if (!deleteCtx) return;

    if (deleteCtx.type === "biz") {
      const b = deleteCtx.item;
      setBiz((prev) =>
        prev.map((x) =>
          x.id === b.id
            ? { ...x, status: "deleted", deletedAt: now(), deletedBy: user.username, deleteReason: reason }
            : x
        )
      );
      addLog("BUSINESS_DELETE", { id: b.id, name: b.name, reason });
    }

    if (deleteCtx.type === "user" && setUsers) {
      const u = deleteCtx.item;
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      addLog("USER_DELETE", { id: u.id, username: u.username, reason });
    }

    setShowDeleteReason(false);
    setDeleteCtx(null);
    setReasonText("");
  }

  /**
   * Open business apply modal
   */
  function openBizApply() {
    if (!requireAuth()) return;
    setShowBizApply(true);
  }

  return {
    showBizApply,
    setShowBizApply,
    showRejectReason,
    setShowRejectReason,
    rejectText,
    setRejectText,
    rejectCtx,
    showDeleteReason,
    setShowDeleteReason,
    reasonText,
    setReasonText,
    deleteCtx,
    submitBizApplication,
    adminApprove,
    openReject,
    adminReject,
    openDelete,
    confirmDelete,
    openBizApply,
  };
}
