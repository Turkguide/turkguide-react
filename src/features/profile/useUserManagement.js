import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { normalizeUsername } from "../../utils/helpers";

/**
 * Hook for user management operations (edit, save, avatar)
 */
export function useUserManagement({
  user,
  setUser,
  users,
  setUsers,
  biz,
  setBiz,
  posts,
  setPosts,
  dms,
  setDms,
  appts,
  setAppts,
  bizApps,
  setBizApps,
  admin,
  profile,
  usernameAliases,
  setUsernameAliases,
}) {
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUserCtx, setEditUserCtx] = useState(null);
  const [pickedAvatarName, setPickedAvatarName] = useState("");
  const [savingEditUser, setSavingEditUser] = useState(false);
  const [editUserError, setEditUserError] = useState("");

  /**
   * Open edit user modal
   */
  function openEditUser(u) {
    if (!u) return;

    const isAdmin = typeof admin.adminMode !== "undefined" ? admin.adminMode : false;
    const me = typeof user !== "undefined" ? user : null;

    // ✅ Admin her kullanıcıyı, normal kullanıcı sadece kendini düzenler
    const can = isAdmin || (me && u.id && me.id && String(u.id) === String(me.id));
    if (!can) return;

    setEditUserCtx({
      ...u,
      _origUsername: String(u.username || "").trim(), // ✅ KRİTİK: eski username sakla
    });

    setShowEditUser(true);
  }

  /**
   * Save edited user
   */
  async function saveEditUser() {
    setEditUserError("");
    setSavingEditUser(true);
    const u = editUserCtx;
    if (!u) {
      setSavingEditUser(false);
      return;
    }

    const isAdmin = admin?.adminMode ?? false;
    const me = typeof user !== "undefined" ? user : null;

    const can = isAdmin || (me && (u.id || u.user_id || u.uid) && me.id && (u.id || u.user_id || u.uid) === me.id);
    if (!can) {
      setEditUserError("Bu profili düzenleme yetkin yok.");
      alert("Bu profili düzenleme yetkin yok.");
      setSavingEditUser(false);
      return;
    }

    // ✅ Username değişince profil popup "Profil bulunamadı" olmasın diye eski username'i yakala
    const oldUsername = String(u._origUsername || u.username || "").trim();

    const username = String(u.username || "").trim();
    if (!username) {
      setEditUserError("Username boş olamaz.");
      alert("Username boş olamaz.");
      setSavingEditUser(false);
      return;
    }

    const currentId = String(u?.id ?? u?.uid ?? u?.user_id ?? "");
    const lower = normalizeUsername(username);
    const origLower = normalizeUsername(u?._origUsername ?? u?.username ?? "");

    // ✅ sadece username değiştiyse çakışma kontrolü
    if (lower !== origLower) {
      const usersList = Array.isArray(users) ? users : [];
      const clash = usersList.find((x) => {
        const xid = String(x?.id ?? x?.uid ?? x?.user_id ?? "");
        if (normalizeUsername(x?.username) !== lower) return false;

        // aynı kayıt ise clash sayma
        if (currentId && xid && xid === currentId) return false;

        return true;
      });

      if (clash) {
        setEditUserError("Bu kullanıcı adı zaten var.");
        alert("Bu kullanıcı adı zaten var.");
        setSavingEditUser(false);
        return;
      }
    }

    // local users[] update (yoksa ekle)
    setUsers((prev) => {
      const idx = prev.findIndex((x) => x.id === u.id);
      if (idx >= 0) {
        const copy = [...prev];
        const old = copy[idx] || {};
        copy[idx] = {
          ...old,
          ...u,
          username,
          avatar: u.avatar ?? old.avatar ?? "",
          Tier: u.Tier ?? old.Tier ?? null,
          XP: Number(u.XP ?? old.XP ?? 0),
          createdAt: u.createdAt ?? old.createdAt ?? new Date().toISOString(),
          email: u.email ?? old.email ?? "",

          // ✅ extra profile fields
          age: u.age ?? old.age ?? "",
          city: u.city ?? old.city ?? "",
          state: u.state ?? old.state ?? "",
          country: u.country ?? old.country ?? "",
          bio: u.bio ?? old.bio ?? "",
        };
        return copy;
      }

      return [
        {
          id: u.id,
          email: u.email || "",
          username,
          Tier: u.Tier ?? null,
          XP: Number(u.XP || 0),
          avatar: u.avatar || "",
          createdAt: u.createdAt || new Date().toISOString(),

          // ✅ extra profile fields
          age: u.age || "",
          city: u.city || "",
          state: u.state || "",
          country: u.country || "",
          bio: u.bio || "",
        },
        ...prev,
      ];
    });

    // kendi profiliyse user state'i de güncelle
    if (me && u.id === me.id) {
      setUser((p) => ({
        ...(p || {}),
        ...(u || {}),
        id: me.id,
        email: me.email,
        username,
        avatar: u.avatar ?? p?.avatar ?? "",
        Tier: u.Tier ?? p?.Tier ?? null,
        XP: Number(u.XP ?? p?.XP ?? 0),
        age: u.age ?? p?.age ?? "",
        city: u.city ?? p?.city ?? "",
        state: u.state ?? p?.state ?? "",
        country: u.country ?? p?.country ?? "",
        bio: u.bio ?? p?.bio ?? "",
      }));
    }

    // ✅ Supabase user_metadata güncelle (kalıcı) — hata olursa kapatma
    if (supabase?.auth) {
      try {
        const { data: sData, error: sErr } = await supabase.auth.getSession();
        const sessUser = sData?.session?.user;

        if (sErr) {
          console.error("❌ getSession error:", sErr);
          const msg = "Supabase session okunamadı: " + (sErr.message || JSON.stringify(sErr));
          setEditUserError(msg);
          alert(msg);
          setSavingEditUser(false);
          return;
        }

        if (!sessUser) {
          console.error("❌ No session user. user state:", user);
          const msg = "Supabase session yok (login düşmüş olabilir). Lütfen çıkış yapıp tekrar giriş yap.";
          setEditUserError(msg);
          alert(msg);
          setSavingEditUser(false);
          return;
        }

        const avatarStr = typeof u.avatar === "string" ? u.avatar : "";
        const avatarLen = avatarStr.length;

        // ⚠️ Base64 çok büyükse Supabase metadata patlayabilir
        if (avatarLen > 120000) {
          alert(
            "Profil fotoğrafı çok büyük görünüyor (base64 length: " +
              avatarLen +
              "). Bu yüzden kaydetme hata veriyor olabilir. Birazdan storage çözümüne geçeceğiz."
          );
          // yine de denemeye devam ediyoruz (istersen burada return yapabiliriz)
        }

        console.log("🧪 saveEditUser debug", {
          currentId,
          username,
          lower,
          origLower,
          u_id: u?.id,
          u_orig: u?._origUsername,
          users_len: users?.length,
          possibleClashes: (users || [])
            .filter((x) => normalizeUsername(x?.username) === lower)
            .map((x) => ({ id: x?.id, username: x?.username })),
        });

        const payload = {
          username,
          // boş string ise null gönder
          avatar: avatarStr ? avatarStr : null,
          xp: Number(u.XP || 0),

          // ✅ extra profile fields (boşsa null)
          age: u.age !== "" && u.age != null ? u.age : null,
          city: String(u.city || "").trim() || null,
          state: String(u.state || "").trim() || null,
          country: String(u.country || "").trim() || null,
          bio: String(u.bio || "").trim() || null,
        };

        console.log("🧪 updateUser payload:", {
          ...payload,
          avatar_len: avatarLen,
          has_session: !!sessUser,
          session_email: sessUser.email,
        });

        const { error } = await supabase.auth.updateUser({ data: payload });

        if (error) {
          console.error("❌ updateUser error FULL:", error);
          const msg =
            "updateUser error: " +
              (error.message || "") +
              "\nstatus: " +
              (error.status || "") +
              "\nname: " +
              (error.name || "") +
              "\nJSON: " +
              JSON.stringify(error);
          setEditUserError(msg);
          alert(msg);
          setSavingEditUser(false);
          return;
        }

        console.log("✅ updateUser OK");

        alert("Profil güncellendi.");

        // ✅ ALSO write to public.profiles so everyone can read avatar/fields
        try {
          const unameLower = normalizeUsername(username);
          const emailValue = String(u?.email || user?.email || "").trim();
          if (!emailValue) {
            console.warn("profiles upsert skipped: email missing");
          } else {
            const row = {
              id: u?.id,
              username: unameLower,
              email: emailValue,
              avatar: avatarStr ? avatarStr : null,
              age: u?.age !== "" && u?.age != null ? Number(u.age) : null,
              city: String(u?.city || "").trim() || null,
              state: String(u?.state || "").trim() || null,
              country: String(u?.country || "").trim() || null,
              bio: String(u?.bio || "").trim() || null,
            };

            const { error: pErr } = await supabase
              .from("profiles")
              .upsert(row, { onConflict: "id" });

            if (pErr) {
              console.warn("⚠️ profiles upsert error:", pErr);
            } else {
              console.log("✅ profiles upsert OK");
            }
          }
        } catch (e) {
          console.warn("⚠️ profiles upsert crash:", e);
        }

        // 🔁 Supabase başarılı → local state'i GARANTİ senkronla
        setUsers((prev) =>
          (prev || []).map((x) =>
            String(x?.id) === String(u?.id)
              ? {
                  ...x,
                  username,
                  avatar: avatarStr ? avatarStr : (x?.avatar || ""),
                  XP: Number(u?.XP ?? x?.XP ?? 0),
                  age: u?.age ?? x?.age ?? "",
                  city: u?.city ?? x?.city ?? "",
                  state: u?.state ?? x?.state ?? "",
                  country: u?.country ?? x?.country ?? "",
                  bio: u?.bio ?? x?.bio ?? "",
                }
              : x
          )
        );

        // 👤 kendi hesabıysa user state'i de güncelle
        if (user && String(user?.id) === String(u?.id)) {
          setUser((p) => ({
            ...(p || {}),
            username,
            avatar: avatarStr ? avatarStr : (p?.avatar || ""),
            XP: Number(u?.XP ?? p?.XP ?? 0),
            age: u?.age ?? p?.age ?? "",
            city: u?.city ?? p?.city ?? "",
            state: u?.state ?? p?.state ?? "",
            country: u?.country ?? p?.country ?? "",
            bio: u?.bio ?? p?.bio ?? "",
          }));
        }
      } catch (e) {
        console.error("💥 updateUser crash FULL:", e);
        const msg = "updateUser crash: " + (e?.message || JSON.stringify(e));
        setEditUserError(msg);
        alert(msg);
        setSavingEditUser(false);
        return;
      }
    } else {
      const msg = "Supabase bağlantısı hazır değil, lütfen tekrar deneyin.";
      setEditUserError(msg);
      alert(msg);
      setSavingEditUser(false);
      return;
    }

    // ✅ Profil popup açıksa, target username'i güncelle (Profil bulunamadı fix)
    profile?.setProfileTarget?.((pt) => {
      if (!pt || pt.type !== "user") return pt;

      const cur = normalizeUsername(pt.username || "");
      const oldN = normalizeUsername(oldUsername || "");
      if (cur !== oldN) return pt;

      return { ...pt, username };
    });

    // ✅ Username değiştiyse: tüm referansları eski->yeni sync et + alias kaydı (kullanıcı bulunamadı fix)
    const newUsername = String(username || "").trim();
    const oldU = String(oldUsername || "").trim();

    if (oldU && newUsername && normalizeUsername(oldU) !== normalizeUsername(newUsername)) {
      const oldKey = normalizeUsername(oldU);
      const replaceUsername = (value) =>
        normalizeUsername(value || "") === oldKey ? newUsername : value;

      const remapComments = (comments) =>
        Array.isArray(comments)
          ? comments.map((c) => {
              const nextC = {
                ...c,
                byUsername: replaceUsername(c?.byUsername),
                by: replaceUsername(c?.by),
              };
              if (Array.isArray(c?.replies)) {
                nextC.replies = c.replies.map((r) => ({
                  ...r,
                  byUsername: replaceUsername(r?.byUsername),
                  by: replaceUsername(r?.by),
                }));
              }
              return nextC;
            })
          : comments;
      // ✅ eski username ile de profile açabilmek için alias map'e ekle
      setUsernameAliases((prev) => ({
        ...(prev || {}),
        [normalizeUsername(oldU)]: newUsername,
      }));

      // 1) İşletmelerde ownerUsername güncelle
      setBiz((prev) =>
        prev.map((b) =>
          normalizeUsername(b.ownerUsername) === normalizeUsername(oldU)
            ? { ...b, ownerUsername: newUsername }
            : b
        )
      );

      // 2) HUB post + yorumlarda byUsername güncelle
      setPosts((prev) =>
        (prev || []).map((p) => {
          // posts: support both `byUsername` (new) and `by` (legacy)
          const pByUsername = p?.byUsername;
          const pByLegacy = p?.by;

          const nextP = {
            ...p,
            byUsername:
              pByUsername != null && normalizeUsername(pByUsername) === normalizeUsername(oldU)
                ? newUsername
                : pByUsername,
            by:
              pByLegacy != null && normalizeUsername(pByLegacy) === normalizeUsername(oldU)
                ? newUsername
                : pByLegacy,
          };

          const nextComments = Array.isArray(p?.comments)
            ? (p.comments || []).map((c) => {
                const cByUsername = c?.byUsername;
                const cByLegacy = c?.by;

                const nextC = {
                  ...c,
                  byUsername:
                    cByUsername != null && normalizeUsername(cByUsername) === normalizeUsername(oldU)
                      ? newUsername
                      : cByUsername,
                  by:
                    cByLegacy != null && normalizeUsername(cByLegacy) === normalizeUsername(oldU)
                      ? newUsername
                      : cByLegacy,
                };

                // replies: also support both fields
                if (Array.isArray(c?.replies)) {
                  nextC.replies = (c.replies || []).map((r) => {
                    const rByUsername = r?.byUsername;
                    const rByLegacy = r?.by;
                    return {
                      ...r,
                      byUsername:
                        rByUsername != null && normalizeUsername(rByUsername) === normalizeUsername(oldU)
                          ? newUsername
                          : rByUsername,
                      by:
                        rByLegacy != null && normalizeUsername(rByLegacy) === normalizeUsername(oldU)
                          ? newUsername
                          : rByLegacy,
                    };
                  });
                }

                return nextC;
              })
            : p?.comments;

          return {
            ...nextP,
            comments: nextComments,
          };
        })
      );

      // 3) DM'lerde from/toUsername güncelle
      setDms((prev) =>
        prev.map((m) => ({
          ...m,
          from: normalizeUsername(m.from) === normalizeUsername(oldU) ? newUsername : m.from,
          toUsername:
            m.toType === "user" && normalizeUsername(m.toUsername) === normalizeUsername(oldU)
              ? newUsername
              : m.toUsername,
          readBy: (m.readBy || []).map((rb) =>
            normalizeUsername(rb) === normalizeUsername(oldU) ? newUsername : rb
          ),
        }))
      );

      // 4) Randevularda fromUsername güncelle
      setAppts((prev) =>
        prev.map((a) =>
          normalizeUsername(a.fromUsername) === normalizeUsername(oldU)
            ? { ...a, fromUsername: newUsername }
            : a
        )
      );

      // 5) Biz başvurularında applicant/ownerUsername güncelle (varsa)
      setBizApps((prev) =>
        prev.map((a) => ({
          ...a,
          applicant:
            normalizeUsername(a.applicant) === normalizeUsername(oldU) ? newUsername : a.applicant,
          ownerUsername:
            normalizeUsername(a.ownerUsername) === normalizeUsername(oldU)
              ? newUsername
              : a.ownerUsername,
        }))
      );

      // 6) Supabase HUB posts + comments güncelle (kalıcı)
      if (supabase?.from) {
        try {
          const { data: hubRows, error: hubErr } = await supabase
            .from("hub_posts")
            .select("id, username, comments")
            .order("created_at", { ascending: false })
            .limit(200);
          if (hubErr) throw hubErr;
          const list = Array.isArray(hubRows) ? hubRows : [];
          await Promise.all(
            list.map(async (row) => {
              const nextUsername =
                normalizeUsername(row?.username || "") === oldKey ? newUsername : row?.username;
              const nextComments = remapComments(row?.comments);
              const changedComments =
                JSON.stringify(nextComments || []) !== JSON.stringify(row?.comments || []);
              if (nextUsername === row?.username && !changedComments) return;
              await supabase
                .from("hub_posts")
                .update({ username: nextUsername, comments: nextComments })
                .eq("id", row.id);
            })
          );
        } catch (e) {
          console.warn("hub_posts username sync error:", e);
        }
      }

      // 7) Supabase DMs güncelle (kalıcı)
      if (supabase?.from) {
        try {
          await supabase.from("dms").update({ from_username: newUsername }).ilike("from_username", oldU);
          await supabase.from("dms").update({ to_username: newUsername }).ilike("to_username", oldU);
          const { data: dmRows, error: dmErr } = await supabase
            .from("dms")
            .select("id, read_by")
            .contains("read_by", [oldU])
            .limit(200);
          if (dmErr) throw dmErr;
          const list = Array.isArray(dmRows) ? dmRows : [];
          await Promise.all(
            list.map(async (row) => {
              const nextReadBy = (row?.read_by || []).map((rb) => replaceUsername(rb));
              if (JSON.stringify(nextReadBy) === JSON.stringify(row?.read_by || [])) return;
              await supabase.from("dms").update({ read_by: nextReadBy }).eq("id", row.id);
            })
          );
        } catch (e) {
          console.warn("dms username sync error:", e);
        }
      }
    } else {
      // username unchanged; no remap
    }

    // ✅ başarıyla buraya geldiyse kapat
    admin?.addLog?.("USER_EDIT", { id: u.id, username });
    setShowEditUser(false);
    setEditUserCtx(null);
    setSavingEditUser(false);
  }

  /**
   * Set my avatar
   */
  async function setMyAvatar(base64) {
    if (!user) return;

    const updated = { ...user, avatar: base64 };
    setUser(updated);

    setUsers((prev) => {
      const idx = prev.findIndex((x) => x.id === user.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          avatar: base64,
          username: updated.username,
        };
        return copy;
      }

      return [
        {
          id: user.id,
          username: updated.username,
          email: user.email,
          avatar: base64,
          createdAt: user.createdAt || new Date().toISOString(),
        },
        ...prev,
      ];
    });

    try {
      await supabase.auth.updateUser({
        data: {
          username: updated.username || null,
          avatar: base64 || null,
          xp: Number(updated.XP || 0),
        },
      });
    } catch (e) {
      console.error("setMyAvatar updateUser error:", e);
    }

    // ✅ ALSO mirror avatar to public.profiles so other users can see it
    try {
      const unameKey = normalizeUsername(updated.username);
      const emailValue = String(updated?.email || "").trim();
      if (!emailValue) {
        console.warn("setMyAvatar profiles upsert skipped: email missing");
        return;
      }
      if (unameKey) {
        await supabase
          .from("profiles")
          .upsert(
            {
              id: updated.id,
              username: unameKey,
              email: emailValue,
              avatar: base64 || null,
            },
            { onConflict: "id" }
          );
      }
    } catch (e) {
      console.warn("setMyAvatar profiles upsert error:", e);
    }
  }

  return {
    showEditUser,
    setShowEditUser,
    editUserCtx,
    setEditUserCtx,
    pickedAvatarName,
    setPickedAvatarName,
    savingEditUser,
    editUserError,
    openEditUser,
    saveEditUser,
    setMyAvatar,
  };
}
