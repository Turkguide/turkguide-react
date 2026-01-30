import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { now, uid, normalizeUsername } from "../../utils/helpers";

/**
 * Hook for business operations
 */
export function useBusiness({ user, setBiz, setBizApps, setUsers, addLog, requireAuth, adminMode, users, createNotification }) {
  const [showBizApply, setShowBizApply] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [rejectCtx, setRejectCtx] = useState(null);
  const [showDeleteReason, setShowDeleteReason] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [deleteCtx, setDeleteCtx] = useState(null);

  async function sendBizStatusEmail({ to, subject, text }) {
    if (!to) return;
    if (!supabase?.functions?.invoke) return;
    try {
      await supabase.functions.invoke("send-biz-status", {
        body: { to, subject, text },
      });
    } catch (e) {
      console.warn("sendBizStatusEmail error:", e);
    }
  }

  function notifyBizStatus({ type, toUsername, bizName, reason }) {
    if (!createNotification) return;
    if (!toUsername) return;
    createNotification({
      type,
      fromUsername: user?.username || "admin",
      toUsername,
      postId: null,
      commentId: null,
      metadata: {
        bizName: bizName || "",
        reason: reason || "",
      },
    });
  }

  function resolveApplicantEmail(app) {
    const owner = normalizeUsername(app?.ownerUsername || app?.applicant || "");
    if (!owner) return "";
    const list = Array.isArray(users) ? users : [];
    const found = list.find((u) => normalizeUsername(u?.username) === owner);
    return found?.email || "";
  }

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

    const app = {
      id: uid(),
      createdAt: now(),
      status: "pending",
      applicant: user.username,
      ownerUsername: user.username,
      userId: user.id || null,
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
    };

    setBizApps((prev) => [app, ...prev]);

    // Best-effort persistence
    if (supabase?.from) {
      supabase
        .from("biz_apps")
        .insert({
          id: app.id,
          created_at: new Date(app.createdAt).toISOString(),
          status: app.status,
          applicant: app.applicant,
          owner_username: app.ownerUsername,
          user_id: app.userId,
          name: app.name,
          category: app.category,
          desc: app.desc,
          country: app.country,
          state: app.state,
          zip: app.zip,
          apt: app.apt,
          address1: app.address1,
          address: app.address,
          city: app.city,
          phone_dial: app.phoneDial,
          phone_local: app.phoneLocal,
          phone: app.phone,
          avatar: app.avatar,
        })
        .then(({ error }) => {
          if (error) {
            console.warn("biz_apps insert error:", error);
            alert("Basvuru gonderilemedi. Lutfen tekrar deneyin.");
          }
        })
        .catch((e) => {
          console.warn("biz_apps insert exception:", e);
          alert("Basvuru gonderilemedi. Lutfen tekrar deneyin.");
        });
    }

    alert("✅ Başvurunuz alındı. İncelendikten sonra işletmeler listesinde görünecek.");
    setShowBizApply(false);
  }

  /**
   * Admin approve business application
   */
  function adminApprove(app) {
    if (!adminMode) return;
    const ownerUsername = app.ownerUsername || app.applicant || "";
    const toEmail = resolveApplicantEmail(app);
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

    notifyBizStatus({
      type: "biz_approved",
      toUsername: ownerUsername,
      bizName: app.name,
    });

    sendBizStatusEmail({
      to: toEmail,
      subject: "Tebrikler! Isletmeniz onaylandi",
      text: `Tebrikler! Isletmeniz onaylandi.\n\nIsletme: ${app.name}\n\nTurkGuide ekibi`,
    });

    if (supabase?.from) {
      supabase
        .from("businesses")
        .insert({
          id: b.id,
          created_at: new Date(b.createdAt).toISOString(),
          status: b.status,
          name: b.name,
          city: b.city,
          address: b.address,
          phone: b.phone,
          category: b.category,
          desc: b.desc,
          avatar: b.avatar,
          owner_username: b.ownerUsername,
          applicant: b.applicant,
          approved_at: new Date(b.approvedAt).toISOString(),
          approved_by: b.approvedBy,
        })
        .then(({ error }) => {
          if (error) console.warn("businesses insert error:", error);
        })
        .catch((e) => console.warn("businesses insert exception:", e));

      supabase
        .from("biz_apps")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.username || "",
        })
        .eq("id", app.id)
        .then(({ error }) => {
          if (error) console.warn("biz_apps approve update error:", error);
        })
        .catch((e) => console.warn("biz_apps approve update exception:", e));
    }
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
    const ctx = rejectCtx;
    const ownerUsername = ctx.ownerUsername || ctx.applicant || "";
    const toEmail = resolveApplicantEmail(ctx);

    setBizApps((prev) => prev.filter((x) => x.id !== ctx.id));
    addLog("BUSINESS_REJECT", { appId: ctx.id, name: ctx.name, reason });
    setShowRejectReason(false);
    setRejectCtx(null);
    setRejectText("");

    notifyBizStatus({
      type: "biz_rejected",
      toUsername: ownerUsername,
      bizName: ctx.name,
      reason,
    });

    sendBizStatusEmail({
      to: toEmail,
      subject: "Uzgunuz, isletmenizi onaylayamiyoruz",
      text: `Uzgunuz, isletmenizi onaylayamiyoruz.\n\nIsletme: ${ctx.name}\nSebep: ${reason}\n\nTurkGuide ekibi`,
    });

    if (supabase?.from) {
      supabase
        .from("biz_apps")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejected_by: user?.username || "",
          reject_reason: reason,
        })
        .eq("id", ctx.id)
        .then(({ error }) => {
          if (error) console.warn("biz_apps reject update error:", error);
        })
        .catch((e) => console.warn("biz_apps reject update exception:", e));
    }
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

      if (supabase?.from) {
        supabase
          .from("businesses")
          .update({
            status: "deleted",
            deleted_at: new Date().toISOString(),
            deleted_by: user?.username || "",
            delete_reason: reason,
          })
          .eq("id", b.id)
          .then(({ error }) => {
            if (error) console.warn("businesses delete update error:", error);
          })
          .catch((e) => console.warn("businesses delete update exception:", e));
      }
    }

    if (deleteCtx.type === "user" && setUsers) {
      const u = deleteCtx.item;
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      addLog("USER_DELETE", { id: u.id, username: u.username, reason });

      if (supabase?.from) {
        supabase
          .from("profiles")
          .update({
            status: "suspended",
            suspended_at: new Date().toISOString(),
            suspended_by: user?.username || "",
            suspend_reason: reason,
          })
          .eq("id", u.id)
          .then(({ error }) => {
            if (error) console.warn("profiles suspend update error:", error);
          })
          .catch((e) => console.warn("profiles suspend update exception:", e));
      }
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
