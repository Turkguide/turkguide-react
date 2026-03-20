import { supabase } from "../../supabaseClient";

export function useUserBlocks({ user, requireAuth, setBlockedUsernames }) {
  async function blockUser(targetUser) {
    if (!(await requireAuth())) return;
    if (!user?.id || !targetUser?.id) return;
    try {
      if (!supabase?.from) return;
      const { error } = await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: targetUser.id,
      });
      if (error) throw error;
      setBlockedUsernames((prev) => Array.from(new Set([...(prev || []), targetUser.username])));
      alert("Kullanıcı engellendi.");
    } catch (e) {
      console.warn("blockUser error:", e);
      alert("Engelleme başarısız oldu.");
    }
  }

  async function unblockUser(targetUser) {
    if (!(await requireAuth())) return;
    if (!user?.id || !targetUser?.id) return;
    try {
      if (!supabase?.from) return;
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetUser.id);
      if (error) throw error;
      setBlockedUsernames((prev) => (prev || []).filter((u) => u !== targetUser.username));
      alert("Engel kaldırıldı.");
    } catch (e) {
      console.warn("unblockUser error:", e);
      alert("Engel kaldırma başarısız oldu.");
    }
  }

  return { blockUser, unblockUser };
}
