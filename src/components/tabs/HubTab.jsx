import { Card, Button, Avatar, Divider, inputStyle } from "../ui";
import { normalizeUsername, fmt } from "../../utils/helpers";
import { supabase } from "../../supabaseClient";

export function HubTab({
  ui,
  user,
  hub,
  posts,
  setPosts,
  setShowAuth,
  profile,
  admin,
  users,
  pickHubMedia,
  hubShare,
}) {
  function renderTextWithHashtags(text) {
    const value = String(text || "");
    if (!value) return null;
    const parts = [];
    const regex = /#[\p{L}\p{N}_]+/gu;
    let lastIndex = 0;
    for (const match of value.matchAll(regex)) {
      const idx = match.index ?? 0;
      if (idx > lastIndex) {
        parts.push(value.slice(lastIndex, idx));
      }
      parts.push(
        <span
          key={`tag-${idx}-${match[0]}`}
          style={{ color: ui.blue, fontWeight: 800 }}
        >
          {match[0]}
        </span>
      );
      lastIndex = idx + match[0].length;
    }
    if (lastIndex < value.length) {
      parts.push(value.slice(lastIndex));
    }
    return parts;
  }

  return (
    <div style={{ display: "grid", gap: 14, paddingTop: 26 }}>
      <Card ui={ui}>
              <div style={{ fontSize: 18, fontWeight: 950 }}>HUB</div>
              <div style={{ color: ui.muted, marginTop: 6 }}>
                İçerik paylaşın, yorum yapın, bağlantıda kalın.
              </div>

              <div style={{ marginTop: 12 }}>
                {/* Composer */}
                <div style={{ position: "relative" }}>
                  <textarea
                    placeholder={user ? "Bir şey yaz ve paylaş..." : "Paylaşmak için giriş yap"}
                    value={hub.composer}
                    onChange={(e) => hub.setComposer(e.target.value)}
                    onFocus={() => {
                      if (!user) setShowAuth(true);
                    }}
                    style={inputStyle(ui, {
                      minHeight: 110,
                      borderRadius: 14,
                      resize: "vertical",
                      paddingBottom: 56,
                    })}
                  />

                  {/* ✅ textarea içine medya ikonu */}
                  <button
                    type="button"
                    aria-label="Foto/Video ekle"
                    title="Foto/Video ekle"
                    onClick={() => {
                      if (!user) {
                        setShowAuth(true);
                        return;
                      }
                      pickHubMedia();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      right: 12,
                      bottom: 12,
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      border: `1px solid ${ui.border}`,
                      background:
                        ui.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                      color: ui.text,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                </div>

                {/* Preview */}
                {hub.hubMedia ? (
                  <div
                    style={{
                      marginTop: 10,
                      border: `1px solid ${ui.border}`,
                      borderRadius: 18,
                      overflow: "hidden",
                      background:
                        ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                      maxWidth: 420,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div style={{ width: "100%", aspectRatio: "0.8" }}>
                        {hub.hubMedia.kind === "image" ? (
                          <img
                            src={hub.hubMedia.src}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <video
                            src={hub.hubMedia.src}
                            controls
                            playsInline
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => hub.setHubMedia(null)}
                        aria-label="Medya kaldır"
                        title="Kaldır"
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 34,
                          height: 34,
                          borderRadius: 999,
                          border: `1px solid ${ui.border}`,
                          background:
                            ui.mode === "light"
                              ? "rgba(255,255,255,0.92)"
                              : "rgba(10,12,18,0.82)",
                          color: ui.text,
                          cursor: "pointer",
                          fontWeight: 950,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                  </div>
                ) : null}

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button ui={ui} variant="solidBlue" onClick={hubShare}>
                    Paylaş
                  </Button>
                </div>
              </div>
            </Card>

            {/* ✅ Empty state must also handle NOT_ARRAY */}
            {!Array.isArray(posts) || posts.length === 0 ? (
              <div style={{ color: ui.muted, padding: 10 }}>Henüz paylaşım yok.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {posts.map((p) => (
                  <Card
                    ui={ui}
                    key={p.id}
                    style={{
                      background:
                        ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* outside click closes menu */}
                    <div onMouseDown={() => hub.setPostMenuOpenId(null)}>
                      {/* header row */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div
  onClick={() => profile.openProfileByUsername(hub.hubPostAuthor(p))}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  }}
>
  <Avatar ui={ui} src={profile.avatarByUsername(hub.hubPostAuthor(p))} size={28} label={hub.hubPostAuthor(p)} />

  <span
    style={{
      fontSize: 13,
      fontWeight: 700,
      color: ui.mode === "light" ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.70)",
      letterSpacing: 0.1,
    }}
  >
    @{hub.hubPostAuthor(p)}
  </span>
</div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: ui.muted2, fontSize: 12 }}>{fmt(p.createdAt)}</span>

                          {hub.canEditPost(p, admin.adminMode) ? (
                            <div style={{ position: "relative" }}>
                              <button
                                type="button"
                                aria-label="Post menüsü"
                                title="Seçenekler"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  hub.setPostMenuOpenId((cur) => (cur === p.id ? null : p.id));
                                }}
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 10,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: `1px solid ${ui.border}`,
                                  background:
                                    ui.mode === "light"
                                      ? "rgba(255,255,255,0.8)"
                                      : "rgba(0,0,0,0.25)",
                                  color: ui.text,
                                  cursor: "pointer",
                                  fontWeight: 950,
                                  lineHeight: 1,
                                }}
                              >
                                ⋯
                              </button>

                              {hub.postMenuOpenId === p.id ? (
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  style={{
                                    position: "absolute",
                                    right: 0,
                                    top: 40,
                                    minWidth: 160,
                                    borderRadius: 14,
                                    border: `1px solid ${ui.border}`,
                                    background: ui.panel,
                                    boxShadow: `0 18px 40px ${ui.glow}`,
                                    overflow: "hidden",
                                    zIndex: 20,
                                  }}
                                >
                                  {hub.editingPostId === p.id ? (
                                    <>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          hub.saveEditPost(p.id, admin.adminMode);
                                          hub.setPostMenuOpenId(null);
                                        }}
                                        style={{
                                          width: "100%",
                                          padding: "10px 12px",
                                          textAlign: "left",
                                          border: "none",
                                          background: "transparent",
                                          color: ui.text,
                                          cursor: "pointer",
                                          fontWeight: 900,
                                        }}
                                      >
                                        Kaydet
                                      </button>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          hub.cancelEditPost();
                                          hub.setPostMenuOpenId(null);
                                        }}
                                        style={{
                                          width: "100%",
                                          padding: "10px 12px",
                                          textAlign: "left",
                                          border: "none",
                                          background: "transparent",
                                          color: ui.text,
                                          cursor: "pointer",
                                          fontWeight: 900,
                                        }}
                                      >
                                        İptal
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          hub.startEditPost(p, admin.adminMode);
                                          hub.setPostMenuOpenId(null);
                                        }}
                                        style={{
                                          width: "100%",
                                          padding: "10px 12px",
                                          textAlign: "left",
                                          border: "none",
                                          background: "transparent",
                                          color: ui.text,
                                          cursor: "pointer",
                                          fontWeight: 900,
                                        }}
                                      >
                                        ✏️ Düzenle
                                      </button>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          hub.deletePost(p.id, admin.adminMode);
                                          hub.setPostMenuOpenId(null);
                                        }}
                                        style={{
                                          width: "100%",
                                          padding: "10px 12px",
                                          textAlign: "left",
                                          border: "none",
                                          background: "transparent",
                                          color: ui.text,
                                          cursor: "pointer",
                                          fontWeight: 900,
                                        }}
                                      >
                                        🗑️ Sil
                                      </button>
                                    </>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* body */}
                      {hub.editingPostId === p.id ? (
                        <textarea
                          value={hub.editPostDraft}
                          onChange={(e) => hub.setEditPostDraft(e.target.value)}
                          style={inputStyle(ui, {
                            minHeight: 90,
                            borderRadius: 14,
                            resize: "vertical",
                            marginTop: 10,
                          })}
                        />
                      ) : (
                        <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900 }}>
                          {renderTextWithHashtags(p.content)}
                        </div>
                      )}

                      {p.editedAt ? (
                        <div style={{ marginTop: 6, color: ui.muted2, fontSize: 12 }}>Düzenlendi</div>
                      ) : null}

                      {p.media ? (
                        <div style={{ marginTop: 12 }}>
                          <div
                            style={{
                              width: "min(520px, 100%)",
                              aspectRatio: "0.8",
                              borderRadius: 16,
                              overflow: "hidden",
                              border: `1px solid ${ui.border}`,
                              background:
                                ui.mode === "light"
                                  ? "rgba(0,0,0,0.03)"
                                  : "rgba(255,255,255,0.04)",
                            }}
                          >
                            {p.media.kind === "image" ? (
                              <img
                                src={p.media.src}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <video
                                src={p.media.src}
                                controls
                                playsInline
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ) : null}

                      <div
                        style={{
                          display: "flex",
                          gap: 18,
                          alignItems: "center",
                          marginTop: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        {/* ♡ Beğen */}
                        <button
                          type="button"
                          onClick={() => hub.hubLike(p.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            cursor: "pointer",
                            color: ui.mode === "light" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          title="Beğen"
                        >
                          {(() => {
                            const me = normalizeUsername(user?.username);
                            const hasLiked = (p.likedBy || []).some((u) => normalizeUsername(u) === me);

                            return (
                              <>
                                <span style={{ fontSize: 16 }}>{hasLiked ? "❤️" : "♡"}</span>
                                <span style={{ fontSize: 13 }}>Beğen</span>

                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    hub.setLikedByPost(p);
                                    hub.setShowLikedBy(true);
                                  }}
                                  style={{
                                    fontSize: 13,
                                    opacity: 0.6,
                                    cursor: "pointer",
                                  }}
                                  title="Kimler beğendi"
                                >
                                  {p.likes || 0}
                                </span>
                              </>
                            );
                          })()}
                        </button>

                        {/* 💬 Yorum */}
                        <button
                          type="button"
                          onClick={() => hub.focusHubComment(p.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            cursor: "pointer",
                            color: ui.mode === "light" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          title="Yorum"
                        >
                          <span style={{ fontSize: 16 }}>💬</span>
                          <span style={{ fontSize: 13 }}>Yorum</span>
                          <span style={{ fontSize: 13, opacity: 0.6 }}>{(p.comments || []).length}</span>
                        </button>

                        {/* 🌀 HUB'la */}
                        <button
                          type="button"
                          onClick={() => hub.hubRepost(p.id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            cursor: "pointer",
                            color: ui.mode === "light" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          title="HUB'la"
                        >
                          <span style={{ fontSize: 16 }}>🌀</span>
                          <span style={{ fontSize: 13 }}>HUB'la</span>
                        </button>
                      </div>

                      <Divider ui={ui} />

                      {/* comments */}
                      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                        {(p.comments || [])
                          .slice()
                          .sort((a, b) => {
                            const ta = new Date(a?.createdAt || 0).getTime();
                            const tb = new Date(b?.createdAt || 0).getTime();
                            return tb - ta;
                          })
                          .map((c) => {
                            const key = `${p.id}:${c.id}`;
                            const isOwner =
                              !!user &&
                              normalizeUsername(user.username) === normalizeUsername(c.byUsername);
                            const menuOpen = hub.commentMenuOpenKey === key;
                            const isEditing = hub.editingCommentKey === key;
                            const isReplying = hub.replyingCommentKey === key;

                            return (
                              <div
                                key={c.id}
                                style={{
                                  padding: 10,
                                  borderRadius: 14,
                                  border: `1px solid ${ui.border}`,
                                  background:
                                    ui.mode === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {(() => {
                                    const avatarSrc = profile.avatarByUsername(c.byUsername);

                                    return (
                                      <div
                                        onClick={() => profile.openProfileByUsername(c.byUsername)}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 8,
                                          cursor: "pointer",
                                          userSelect: "none",
                                        }}
                                        title="Profile git"
                                      >
                                        <Avatar ui={ui} src={avatarSrc} size={28} label={c.byUsername} />
                                        <span
                                          style={{
                                            fontWeight: 700,
                                            fontSize: 13,
                                            color: ui.mode === "light" ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.70)",
                                            letterSpacing: 0.1,
                                          }}
                                        >
                                          @{c.byUsername}
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  <span style={{ color: ui.muted2, fontSize: 12 }}>{fmt(c.createdAt)}</span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      hub.setReplyingCommentKey(hub.replyingCommentKey === key ? null : key);
                                      hub.setReplyDraft("");
                                    }}
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                      fontWeight: 900,
                                      fontSize: 12,
                                      padding: "2px 6px",
                                      borderRadius: 10,
                                      color: ui.mode === "light" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
                                    }}
                                    title="Cevapla"
                                  >
                                    Cevapla
                                  </button>

                                  {isOwner ? (
                                    <div
                                      style={{
                                        marginLeft: "auto",
                                        position: "relative",
                                        display: "inline-flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          hub.setCommentMenuOpenKey(menuOpen ? null : key);
                                        }}
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          cursor: "pointer",
                                          fontWeight: 900,
                                          fontSize: 18,
                                          lineHeight: 1,
                                          padding: "2px 6px",
                                          borderRadius: 10,
                                          color:
                                            ui.mode === "light"
                                              ? "rgba(0,0,0,0.55)"
                                              : "rgba(255,255,255,0.65)",
                                        }}
                                        title="Yorum seçenekleri"
                                        aria-label="Yorum seçenekleri"
                                      >
                                        ⋯
                                      </button>

                                      {menuOpen ? (
                                        <div
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                          }}
                                          style={{
                                            position: "absolute",
                                            right: 0,
                                            top: "100%",
                                            marginTop: 8,
                                            minWidth: 160,
                                            borderRadius: 14,
                                            border: `1px solid ${ui.border}`,
                                            background:
                                              ui.mode === "light"
                                                ? "rgba(255,255,255,0.98)"
                                                : "rgba(10,12,18,0.98)",
                                            boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
                                            padding: 6,
                                            zIndex: 50,
                                          }}
                                        >
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              hub.setEditingCommentKey(key);
                                              hub.setEditCommentDraft(String(c.text || ""));
                                              hub.setCommentMenuOpenKey(null);
                                            }}
                                            style={{
                                              width: "100%",
                                              textAlign: "left",
                                              border: "none",
                                              background: "transparent",
                                              cursor: "pointer",
                                              padding: "10px 10px",
                                              borderRadius: 12,
                                              fontWeight: 900,
                                              color: ui.text,
                                            }}
                                            title="Yorumu düzenle"
                                          >
                                            ✏️ Düzenle
                                          </button>

                                          <div
                                            style={{
                                              height: 1,
                                              background:
                                                ui.mode === "light"
                                                  ? "rgba(0,0,0,0.08)"
                                                  : "rgba(255,255,255,0.10)",
                                              margin: "4px 6px",
                                            }}
                                          />

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              hub.setCommentMenuOpenKey(null);
                                              hub.deleteHubComment(p.id, c.id);
                                            }}
                                            style={{
                                              width: "100%",
                                              textAlign: "left",
                                              border: "none",
                                              background: "transparent",
                                              cursor: "pointer",
                                              padding: "10px 10px",
                                              borderRadius: 12,
                                              fontWeight: 900,
                                              color: "#ff4d4f",
                                            }}
                                            title="Yorumu sil"
                                          >
                                            🗑️ Sil
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>

                                <div style={{ marginTop: 8 }}>
                                  {isEditing ? (
                                    <div style={{ display: "grid", gap: 8 }}>
                                      <textarea
                                        value={hub.editCommentDraft}
                                        onChange={(e) => hub.setEditCommentDraft(e.target.value)}
                                        style={inputStyle(ui, {
                                          minHeight: 70,
                                          borderRadius: 14,
                                          resize: "vertical",
                                          padding: "10px 12px",
                                        })}
                                      />

                                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                        <Button
                                          ui={ui}
                                          onClick={() => {
                                            hub.setEditingCommentKey(null);
                                            hub.setEditCommentDraft("");
                                          }}
                                          style={{ padding: "8px 14px" }}
                                        >
                                          İptal
                                        </Button>

                                        <Button
                                          ui={ui}
                                          variant="solidBlue"
                                          onClick={async () => {
                                            const text = String(hub.editCommentDraft || "").trim();
                                            if (!text) return;

                                            setPosts((prev) =>
                                              (prev || []).map((pp) =>
                                                pp.id === p.id
                                                  ? {
                                                      ...pp,
                                                      comments: (pp.comments || []).map((cc) =>
                                                        cc.id === c.id
                                                          ? { ...cc, text, editedAt: new Date().toISOString() }
                                                          : cc
                                                      ),
                                                    }
                                                  : pp
                                              )
                                            );

                                            hub.setEditingCommentKey(null);
                                            hub.setEditCommentDraft("");

                                            try {
                                              const nextComments = (p.comments || []).map((cc) =>
                                                cc.id === c.id
                                                  ? { ...cc, text, editedAt: new Date().toISOString() }
                                                  : cc
                                              );

                                              const { error } = await supabase
                                                .from("hub_posts")
                                                .update({ comments: nextComments })
                                                .eq("id", p.id);

                                              if (error) throw error;

                                              await hub.fetchHubPosts();
                                            } catch (err) {
                                              console.error("editHubComment error:", err);
                                              alert("Yorum güncellenemedi.");
                                              try {
                                                await hub.fetchHubPosts();
                                              } catch (_) {}
                                            }
                                          }}
                                          style={{ padding: "8px 14px" }}
                                        >
                                          Kaydet
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    (() => {
                                      const replyToUsername = c?.replyTo
                                        ? (p.comments || []).find((cc) => String(cc.id) === String(c.replyTo))
                                            ?.byUsername
                                        : null;
                                      return (
                                        <>
                                          {replyToUsername ? (
                                            <span
                                              onClick={() => profile.openProfileByUsername(replyToUsername)}
                                              style={{
                                                color: ui.blue,
                                                fontWeight: 800,
                                                cursor: "pointer",
                                              }}
                                            >
                                              @{replyToUsername}{" "}
                                            </span>
                                          ) : null}
                                          {renderTextWithHashtags(c.text)}
                                        </>
                                      );
                                    })()
                                  )}
                                </div>

                                {/* Reply input */}
                                {isReplying ? (
                                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                    <input
                                      placeholder="Cevap yaz..."
                                      value={hub.replyDraft || ""}
                                      onChange={(e) => hub.setReplyDraft(e.target.value)}
                                      style={inputStyle(ui, { padding: "8px 10px", flex: 1 })}
                                    />
                                    <Button
                                      ui={ui}
                                      variant="solidBlue"
                                      onClick={() => {
                                        const text = String(hub.replyDraft || "").trim();
                                        if (!text) return;
                                        hub.hubComment(p.id, c.id);
                                      }}
                                      style={{ padding: "8px 14px" }}
                                    >
                                      Gönder
                                    </Button>
                                    <Button
                                      ui={ui}
                                      onClick={() => {
                                        hub.setReplyingCommentKey(null);
                                        hub.setReplyDraft("");
                                      }}
                                      style={{ padding: "8px 14px" }}
                                    >
                                      İptal
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                      </div>

                      {/* comment input (HER ZAMAN EN ALTA) */}
                      {!hub.replyingCommentKey ? (
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <input
                            placeholder={user ? "Yorum yaz..." : "Yorum için giriş yap"}
                            value={hub.commentDraft[p.id] || ""}
                            onChange={(e) => hub.setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                            onFocus={() => {
                              if (!user) setShowAuth(true);
                            }}
                            style={inputStyle(ui, { padding: "10px 12px" })}
                          />
                          <Button ui={ui} variant="solidBlue" onClick={() => hub.hubComment(p.id)}>
                            Gönder
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            )}
    </div>
  );
}
