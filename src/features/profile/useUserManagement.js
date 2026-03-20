import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { normalizeUsername } from "../../utils/helpers";
import { resolveTermsForProfileSave } from "../../utils/profileSaveTerms";
import { termsDebugLog } from "../../utils/termsDebugLog";

/**
 * Hook for user management operations (edit, save, avatar)
 */
export function useUserManagement({
  user,
  setUser,
  users,
  setUsers,
  biz: _biz,
  setBiz,
  posts: _posts,
  setPosts,
  dms: _dms,
  setDms,
  appts: _appts,
  setAppts,
  bizApps: _bizApps,
  setBizApps,
  admin,
  profile,
  usernameAliases: _usernameAliases,
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

    const me = typeof user !== "undefined" ? user : null;
    /** DB tek doğruluk kaynağı; aynı save içinde setUser ile çakışmayı önlemek için taşınır */
    let resolvedAcceptedTermsAt = me?.acceptedTermsAt ?? null;

    let profile = null;
    let profileErr = null;
    if (me?.id && supabase?.from) {
      const { data, error } = await supabase
        .from("profiles")
        .select("accepted_terms_at")
        .eq("id", me.id)
        .maybeSingle();
      profile = data;
      profileErr = error?.message ?? null;
    }
    termsDebugLog({
      path: "profileSave:beforeResolve",
      userId: me?.id,
      userState: me?.acceptedTermsAt ?? null,
      dbValue: profile?.accepted_terms_at ?? null,
      selectError: profileErr,
      blockedReason: !profile?.accepted_terms_at ? "missing_db_terms" : null,
    });

    const termsResolution = await resolveTermsForProfileSave({ me, supabase, setUser });
    resolvedAcceptedTermsAt = termsResolution.resolvedAcceptedTermsAt ?? resolvedAcceptedTermsAt;

    termsDebugLog({
      path: "profileSave:afterResolve",
      userId: me?.id,
      userState: me?.acceptedTermsAt ?? null,
      dbValue: profile?.accepted_terms_at ?? null,
      ok: termsResolution.ok,
      resolveReason: termsResolution.reason,
      blockedReason: !termsResolution.ok ? termsResolution.reason : null,
    });

    if (!termsResolution.ok) {
      if (import.meta.env.DEV) {
        console.warn("[tg:profileSave:blocked]", {
          userId: me?.id,
          reason: termsResolution.reason,
          queryError: termsResolution.queryError,
        });
      }
      alert(
        me
          ? "Profil güncellemek için Kullanım Şartları'nı kabul etmelisin."
          : "Oturum bulunamadı. Lütfen tekrar giriş yapın."
      );
      setSavingEditUser(false);
      return;
    }

    const isAdmin = admin?.adminMode ?? false;
    const can = isAdmin || (me && (u.id || u.user_id || u.uid) && me.id && (u.id || u.user_id || u.uid) === me.id);
    if (!can) {
      setEditUserError("Bu profili düzenleme yetkin yok.");
      alert("Bu profili düzenleme yetkin yok.");
      setSavingEditUser(false);
      return;
    }

    try {
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
      // ✅ Server-side kontrol (RPC)
      if (supabase?.rpc) {
        try {
          const { data: available, error } = await supabase.rpc(
            "is_username_available",
            { p_username: lower }
          );

          if (error) {
            console.warn("username availability check error:", error);
            setEditUserError("Kullanıcı adı kontrol edilemedi.");
            alert("Kullanıcı adı kontrol edilemedi.");
            setSavingEditUser(false);
            return;
          }

          if (available === false) {
            setEditUserError("Bu kullanıcı adı zaten var.");
            alert("Bu kullanıcı adı zaten var.");
            setSavingEditUser(false);
            return;
          }
        } catch (e) {
          console.warn("username availability check crash:", e);
          setEditUserError("Kullanıcı adı kontrol edilemedi.");
          alert("Kullanıcı adı kontrol edilemedi.");
          setSavingEditUser(false);
          return;
        }
      }

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

    // kendi profiliyse user state'i de güncelle (acceptedTermsAt: DB çözümü + stale closure fix)
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
        acceptedTermsAt: resolvedAcceptedTermsAt ?? p?.acceptedTermsAt ?? null,
        bannedAt: p?.bannedAt ?? null,
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

        /** JWT user_metadata çok şişince updateUser yavaşlıyor / zaman aşımı; büyük avatar sadece profiles'ta tutulur. */
        const MAX_AVATAR_IN_JWT_CHARS = 10000;

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

        const unameLower = normalizeUsername(username);
        const emailValue = String(u?.email || user?.email || "").trim();
        if (!emailValue) {
          const msg = "Profil kaydedilemedi: e-posta eksik. Lütfen çıkış yapıp tekrar giriş yapın.";
          setEditUserError(msg);
          alert(msg);
          setSavingEditUser(false);
          return;
        }

        const profileRow = {
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

        const { error: pErr0 } = await supabase.from("profiles").upsert(profileRow, { onConflict: "id" });
        if (pErr0) {
          console.error("❌ profiles upsert error:", pErr0);
          const msg =
            "Profil veritabanına yazılamadı: " + (pErr0.message || JSON.stringify(pErr0));
          setEditUserError(msg);
          alert(msg);
          setSavingEditUser(false);
          return;
        }
        console.log("✅ profiles upsert OK (JWT metadata arka planda)");

        const jwtPayload = {
          ...payload,
          avatar:
            avatarStr && avatarLen > 0 && avatarLen <= MAX_AVATAR_IN_JWT_CHARS ? avatarStr : null,
        };

        console.log("🧪 updateUser (background) payload:", {
          ...jwtPayload,
          avatar_len_stored_in_jwt: jwtPayload.avatar ? String(jwtPayload.avatar).length : 0,
          avatar_len_full: avatarLen,
        });

        // Oturum JWT'si (updateUser) ağda çok sürebilir — UI bunu beklemez; profil zaten profiles'ta.
        void (async () => {
          try {
            const runWithCap = async (ms) => {
              const t = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("timeout")), ms)
              );
              return await Promise.race([
                supabase.auth.updateUser({ data: jwtPayload }).then((r) => r),
                t,
              ]);
            };
            let r;
            try {
              r = await runWithCap(45000);
            } catch (e1) {
              if (e1?.message === "timeout") {
                try {
                  r = await runWithCap(60000);
                } catch (e2) {
                  if (e2?.message === "timeout") {
                    console.warn("⚠️ updateUser arka planda zaman aşımı — refreshSession deneniyor");
                    await supabase.auth.refreshSession().catch(() => {});
                    return;
                  }
                  throw e2;
                }
              } else {
                throw e1;
              }
            }
            if (r?.error) {
              console.warn("⚠️ updateUser (background) hata:", r.error);
              return;
            }
            await supabase.auth.refreshSession().catch(() => {});
          } catch (e) {
            console.warn("⚠️ updateUser background:", e);
          }
        })();

        setSavingEditUser(false);
        setShowEditUser(false);
        setEditUserCtx(null);
        admin?.addLog?.("USER_EDIT", { id: u.id, username });
        alert("Profil güncellendi.");
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

    // ✅ Username remap / profil target — arka planda çalışsın, UI takılmasın
    Promise.resolve().then(async () => {
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

      try {
        // ✅ eski username ile de profile açabilmek için alias map'e ekle
        setUsernameAliases((prev) => ({
          ...(prev || {}),
          [normalizeUsername(oldU)]: newUsername,
        }));

        // 1) İşletmelerde ownerUsername güncelle
        setBiz((prev) =>
          (prev || []).map((b) =>
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
                          rByUsername != null &&
                          normalizeUsername(rByUsername) === normalizeUsername(oldU)
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
          (prev || []).map((m) => ({
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
          (prev || []).map((a) =>
            normalizeUsername(a.fromUsername) === normalizeUsername(oldU)
              ? { ...a, fromUsername: newUsername }
              : a
          )
        );

        // 5) Biz başvurularında applicant/ownerUsername güncelle (varsa)
        setBizApps((prev) =>
          (prev || []).map((a) => ({
            ...a,
            applicant:
              normalizeUsername(a.applicant) === normalizeUsername(oldU) ? newUsername : a.applicant,
            ownerUsername:
              normalizeUsername(a.ownerUsername) === normalizeUsername(oldU)
                ? newUsername
                : a.ownerUsername,
          }))
        );
      } catch (e) {
        console.warn("username remap error:", e);
      }

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
    }).catch(() => {});
    } finally {
      setSavingEditUser(false);
    }
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
