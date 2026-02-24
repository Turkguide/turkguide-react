import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { normalizeUsername } from "../../utils/helpers";

/**
 * Hook for managing business editing
 */
export function useBusinessEdit({ user, admin, biz: _biz, setBiz }) {
  const [showEditBiz, setShowEditBiz] = useState(false);
  const [editBizCtx, setEditBizCtx] = useState(null);

  function openEditBiz(b) {
    if (!admin.adminMode) return;
    setEditBizCtx({ ...b });
    setShowEditBiz(true);
  }

  async function saveEditBiz(addLog) {
    if (!admin.adminMode) return;
    const b = editBizCtx;
    if (!b) return;

    const name = String(b.name || "").trim();
    const category = String(b.category || "").trim();
    if (!name || !category) return alert("İşletme adı ve kategori boş olamaz.");

    // Update local state
    const updatedBiz = { ...b, name, category };
    setBiz((prev) => prev.map((x) => (x.id === b.id ? updatedBiz : x)));

    // Persist to Supabase
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ name, category, ...updatedBiz })
        .eq("id", b.id);
      
      if (error) throw error;
    } catch (e) {
      console.error("saveEditBiz Supabase update error:", e);
      // Continue - local state is already updated
    }

    addLog("BUSINESS_EDIT", { id: b.id, name });
    setShowEditBiz(false);
    setEditBizCtx(null);
  }

  function canEditBizAvatar(b) {
    if (!user) return false;
    if (admin.adminMode) return true;
    return normalizeUsername(b.ownerUsername) === normalizeUsername(user.username);
  }

  return {
    showEditBiz,
    setShowEditBiz,
    editBizCtx,
    setEditBizCtx,
    openEditBiz,
    saveEditBiz,
    canEditBizAvatar,
  };
}
