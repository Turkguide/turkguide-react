import { useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { now, uid, normalizeUsername } from "../../utils/helpers";
import { normalizeImageToFotograf, validateAndLoadVideo } from "../../services/media";

/**
 * Hook for HUB operations
 */
export function useHub({ user, setPosts, posts, requireAuth, createNotification }) {
  const isDev = import.meta.env.DEV;
  const [composer, setComposer] = useState("");
  const [commentDraft, setCommentDraft] = useState({});
  const [hubMedia, setHubMedia] = useState(null);
  const [showLikedBy, setShowLikedBy] = useState(false);
  const [likedByPost, setLikedByPost] = useState(null);
  const [commentMenuOpenKey, setCommentMenuOpenKey] = useState(null);
  const [editingCommentKey, setEditingCommentKey] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [replyingCommentKey, setReplyingCommentKey] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostDraft, setEditPostDraft] = useState("");
  const [postMenuOpenId, setPostMenuOpenId] = useState(null);

  const commentInputRefs = useRef({});
  const hubMediaPickRef = useRef(null);
  const hubMediaPickBusyRef = useRef(false);

  /**
   * Pick HUB media
   */
  function pickHubMedia() {
    hubMediaPickRef.current?.click();
  }

  /**
   * Handle HUB media file pick
   */
  async function onPickHubMediaFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (hubMediaPickBusyRef.current) return;
    hubMediaPickBusyRef.current = true;

    try {
      const isVideo = (file.type || "").startsWith("video/");
      const isImage = (file.type || "").startsWith("image/");

      if (!isVideo && !isImage) {
        alert("Sadece fotoğraf veya video yükleyebilirsin.");
        return;
      }

      const media = isImage
        ? await normalizeImageToFotograf(file)
        : await validateAndLoadVideo(file);

      setHubMedia(media);
    } catch (err) {
      console.error("HUB media error:", err);
      alert(err?.message || "Medya yüklenemedi");
      setHubMedia(null);
    } finally {
      hubMediaPickBusyRef.current = false;
    }
  }

  /**
   * Fetch HUB posts from Supabase
   */
  async function fetchHubPosts(retryOnAuth = true) {
    try {
      if (!supabase?.from) {
        throw new Error("Supabase client hazır değil.");
      }
      console.log("🟣 fetchHubPosts: start");
      const { data, error } = await supabase
        .from("hub_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      console.log("🟣 fetchHubPosts: ok rows=", (data || []).length, "first=", (data || [])[0]);

      const mapped = (data || []).map((r) => {
        const createdAtRaw = r?.created_at ? new Date(r.created_at).getTime() : now();
        const createdAt = Number.isFinite(createdAtRaw) ? createdAtRaw : now();
        return {
          id: r.id,
          createdAt,
          byType: "user",
          byUsername: r.username || r.by_username || r.bu_username || "",
          content: r.content || "",
          media: r.media || null,
          likes: r.likes || 0,
          likedBy: Array.isArray(r.liked_by) ? r.liked_by : [],
          comments: r.comments || [],
        };
      });

      console.log("🧪 mapped[0] likes/likedBy =", mapped?.[0]?.likes, mapped?.[0]?.likedBy);
      setPosts(mapped);
      console.log("🟣 fetchHubPosts: setPosts mapped len=", mapped.length);
    } catch (e) {
      console.error("fetchHubPosts error:", e);
      console.log("🟣 fetchHubPosts: catch raw=", e);
      const msg = String(e?.message || e || "");
      const looksAuthExpired =
        msg.toLowerCase().includes("jwt expired") ||
        msg.toLowerCase().includes("invalid jwt") ||
        msg.toLowerCase().includes("expired") ||
        e?.status === 401;
      if (retryOnAuth && looksAuthExpired && supabase?.auth?.refreshSession) {
        try {
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshed?.session) {
            await fetchHubPosts(false);
            return;
          }
        } catch (_) {}
      }
      try {
        const alertMsg = e?.message || e?.error_description || JSON.stringify(e);
        alert("HUB postları çekilemedi: " + alertMsg);
      } catch (_) {}
    }
  }

  /**
   * Share a HUB post
   */
  async function hubShare() {
    if (!requireAuth()) {
      alert("Paylaşım için giriş yapmalısın.");
      return;
    }
    if (!user?.id) {
      alert("Oturum bulunamadı. Lütfen çıkış yapıp tekrar giriş yap.");
      return;
    }
    console.log("HUB SHARE ÇALIŞTI");

    const text = String(composer || "").trim();
    if (!text && !hubMedia) {
      alert("Paylaşım boş olamaz.");
      return;
    }

    const stamp = now();

    const post = {
      id: uid(),
      createdAt: stamp,
      byType: "user",
      byUsername: user.username,
      content: text,
      media: hubMedia
        ? {
            kind: hubMedia.kind,
            src: hubMedia.src,
            width: hubMedia.width,
            height: hubMedia.height,
            duration: hubMedia.duration,
            mime: hubMedia.mime,
            originalName: hubMedia.originalName,
          }
        : null,
      likes: 0,
      comments: [],
    };

    try {
      if (!supabase?.from) throw new Error("Supabase client hazır değil.");

      const { data: insertedRow, error } = await supabase
        .from("hub_posts")
        .insert({
          user_id: user?.id || null,
          username: user?.username || "",
          content: text || "",
          media: post.media,
          likes: 0,
          comments: [],
        })
        .select("*")
        .single();

      if (error) {
        console.error("hubShare insert error:", error);
        alert("Paylaşım gönderilemedi: " + (error.message || ""));
        return;
      }

      const postFromDb = {
        ...post,
        id: insertedRow?.id || post.id,
        createdAt: insertedRow?.created_at ? new Date(insertedRow.created_at).getTime() : stamp,
        byUsername: insertedRow?.username || post.byUsername,
        content: insertedRow?.content ?? post.content,
        media: insertedRow?.media ?? post.media,
        likes: insertedRow?.likes ?? post.likes,
        comments: insertedRow?.comments ?? post.comments,
      };

      setPosts((prev) => {
        if ((prev || []).some((p) => p?.id === postFromDb.id)) return prev;
        return [postFromDb, ...(prev || [])];
      });
    } catch (e) {
      console.error("hubShare crash:", e);
      alert("Paylaşım gönderilemedi.");
      return;
    }

    setComposer("");
    setHubMedia(null);
    setPostMenuOpenId(null);

    try {
      await fetchHubPosts();
    } catch (_) {}
  }

  /**
   * Like/unlike a HUB post
   */
  async function hubLike(postId) {
    if (!requireAuth()) return;

    if (!user || !user.username) {
      alert("Oturum bulunamadı, lütfen tekrar giriş yapın.");
      return;
    }

    const me = normalizeUsername(user.username);
    const target = (posts || []).find((p) => p.id === postId);
    if (!target) return;

    const likedBy = Array.isArray(target.likedBy) ? target.likedBy : [];
    const hasLiked = likedBy.some((u) => normalizeUsername(u) === me);

    const nextLikedBy = hasLiked
      ? likedBy.filter((u) => normalizeUsername(u) !== me)
      : [...likedBy, user.username];

    const nextLikes = Math.max(0, Number(target.likes || 0) + (hasLiked ? -1 : 1));

    // Optimistic UI
    setPosts((prev) =>
      (prev || []).map((p) =>
        p.id === postId ? { ...p, likes: nextLikes, likedBy: nextLikedBy } : p
      )
    );

    // Save to Supabase
    try {
      const { error } = await supabase
        .from("hub_posts")
        .update({
          likes: nextLikes,
          liked_by: nextLikedBy,
        })
        .eq("id", postId)
        .select();

      if (error) throw error;

      // Create notification if liked (not unliked)
      if (!hasLiked && createNotification) {
        const postAuthor = hubPostAuthor(target);
        if (postAuthor) {
          createNotification({
            type: "like",
            fromUsername: user.username,
            toUsername: postAuthor,
            postId: postId,
            commentId: null,
            metadata: {},
          });
        }
      }

      try {
        await fetchHubPosts(false);
      } catch (_) {}
    } catch (e) {
      console.error("❌ hubLike DB error:", e);
      setPosts((prev) => (prev || []).map((p) => (p.id === postId ? target : p)));
      alert("Beğeni kaydedilemedi.");
    }
  }

  /**
   * Add comment to a HUB post (or reply to a comment)
   */
  async function hubComment(postId, replyToCommentId = null) {
    if (!requireAuth()) return;

    // Use replyDraft if replying, otherwise use commentDraft
    const text = replyToCommentId
      ? String(replyDraft || "").trim()
      : String(commentDraft[postId] || "").trim();
    if (!text) return;

    const newComment = {
      id: uid(),
      createdAt: now(),
      byUsername: user.username,
      text,
      replyTo: replyToCommentId || null,
    };

    // Optimistic UI
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p
      )
    );

    setCommentDraft((d) => ({ ...d, [postId]: "" }));
    if (replyingCommentKey) {
      setReplyingCommentKey(null);
      setReplyDraft("");
    }

    // Save to DB
    try {
      const target = posts.find((p) => p.id === postId);
      const currentComments = Array.isArray(target?.comments) ? target.comments : [];
      const nextComments = [...currentComments, newComment];

      const { error } = await supabase
        .from("hub_posts")
        .update({ comments: nextComments })
        .eq("id", postId);

      if (error) throw error;

      // Create notification
      if (createNotification) {
        if (replyToCommentId) {
          // Reply to comment - notify comment author
          const replyToComment = currentComments.find((c) => c.id === replyToCommentId);
          if (replyToComment && replyToComment.byUsername) {
            createNotification({
              type: "comment_reply",
              fromUsername: user.username,
              toUsername: replyToComment.byUsername,
              postId: postId,
              commentId: replyToCommentId,
              metadata: { replyCommentId: newComment.id },
            });
          }
        } else {
          // Regular comment - notify post author
          const postAuthor = hubPostAuthor(target);
          if (postAuthor) {
            createNotification({
              type: "comment",
              fromUsername: user.username,
              toUsername: postAuthor,
              postId: postId,
              commentId: newComment.id,
              metadata: {},
            });
          }
        }
      }

      await fetchHubPosts();
    } catch (e) {
      console.error("hubComment DB error:", e);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: (p.comments || []).filter((c) => c.id !== newComment.id),
              }
            : p
        )
      );
      alert("Yorum kaydedilemedi.");
    }
  }

  /**
   * Delete a HUB comment
   */
  async function deleteHubComment(postId, commentId) {
    if (!requireAuth()) return;

    const target = (posts || []).find((p) => p.id === postId);
    if (!target) return;

    const currentComments = Array.isArray(target.comments) ? target.comments : [];
    const nextComments = currentComments.filter((c) => String(c.id) !== String(commentId));

    // Optimistic UI
    setPosts((prev) =>
      (prev || []).map((p) => (p.id === postId ? { ...p, comments: nextComments } : p))
    );

    try {
      setCommentMenuOpenKey(null);
    } catch (_) {}

    // Save to DB
    try {
      const { error } = await supabase
        .from("hub_posts")
        .update({ comments: nextComments })
        .eq("id", postId)
        .select();

      if (error) throw error;

      await fetchHubPosts();
    } catch (e) {
      console.error("deleteHubComment DB error:", e);
      setPosts((prev) => (prev || []).map((p) => (p.id === postId ? target : p)));
      alert("Yorum silinemedi.");
    }
  }

  /**
   * Focus comment input for a post
   */
  function focusHubComment(postId) {
    const el = commentInputRefs.current?.[postId];
    try {
      el?.focus?.();
    } catch (_) {}
  }

  /**
   * Repost a HUB post
   */
  async function hubRepost(postId) {
    if (!requireAuth({ requireVerified: true })) return;

    const target = (posts || []).find((p) => p.id === postId);
    if (!target) return;

    // Create a new post with reference to original
    const repostContent = `🌀 HUB'la: ${target.content || ""}`;
    const newPost = {
      id: uid(),
      createdAt: now(),
      byType: "user",
      byUsername: user.username,
      content: repostContent,
      media: target.media || null,
      likes: 0,
      likedBy: [],
      comments: [],
      repostOf: postId, // Reference to original post
    };

    // Optimistic UI
    setPosts((prev) => [newPost, ...prev]);

    // Save to Supabase
    try {
      const { error } = await supabase.from("hub_posts").insert([
        {
          id: newPost.id,
          username: user.username,
          content: repostContent,
          media: target.media || null,
          likes: 0,
          liked_by: [],
          comments: [],
          repost_of: postId,
        },
      ]);

      if (error) throw error;

      // Create notification for original post author
      if (createNotification) {
        const postAuthor = hubPostAuthor(target);
        if (postAuthor) {
          createNotification({
            type: "repost",
            fromUsername: user.username,
            toUsername: postAuthor,
            postId: postId,
            commentId: null,
            metadata: { repostId: newPost.id },
          });
        }
      }

      await fetchHubPosts();
    } catch (e) {
      console.error("hubRepost DB error:", e);
      setPosts((prev) => prev.filter((p) => p.id !== newPost.id));
      alert("HUB'la işlemi başarısız oldu.");
    }
  }

  /**
   * Get post author (backward compatible)
   */
  function hubPostAuthor(p) {
    return String((p && (p.byUsername || p.by || p.username || p.ownerUsername || p.author)) || "").trim();
  }

  /**
   * Check if user can edit post
   */
  function canEditPost(p, adminMode) {
    if (!user) return false;
    if (adminMode) return true;
    const author = hubPostAuthor(p);
    if (!author) return false;
    return normalizeUsername(author) === normalizeUsername(user.username);
  }

  /**
   * Start editing a post
   */
  function startEditPost(p, adminMode) {
    if (!requireAuth({ requireVerified: true })) return;
    if (!canEditPost(p, adminMode)) return;
    setEditingPostId(p.id);
    setEditPostDraft(String(p.content || ""));
  }

  /**
   * Cancel editing a post
   */
  function cancelEditPost() {
    setEditingPostId(null);
    setEditPostDraft("");
  }

  /**
   * Save edited post
   */
  async function saveEditPost(postId, adminMode) {
    if (!requireAuth({ requireVerified: true })) return;
    const text = String(editPostDraft || "").trim();

    const target = posts.find((x) => x.id === postId);
    if (!target) return;

    if (!text && !target.media) {
      alert("İçerik boş olamaz.");
      return;
    }

    if (!canEditPost(target, adminMode)) return;

    // Optimistic UI
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        if (!canEditPost(p, adminMode)) return p;
        return { ...p, content: text, editedAt: now() };
      })
    );

    // Save to DB
    try {
      const { error } = await supabase
        .from("hub_posts")
        .update({ content: text, edited_at: new Date().toISOString() })
        .eq("id", postId);

      if (error) throw error;

      await fetchHubPosts();
    } catch (e) {
      console.error("saveEditPost DB error:", e);
      setPosts((prev) => (prev || []).map((p) => (p.id === postId ? target : p)));
      alert("Paylaşım güncellenemedi.");
      return;
    }

    setEditingPostId(null);
    setEditPostDraft("");
  }

  /**
   * Delete a post
   */
  async function deletePost(postId, adminMode) {
    if (!requireAuth({ requireVerified: !adminMode })) return;

    const p = posts.find((x) => x.id === postId);
    if (!p || !canEditPost(p, adminMode)) return;

    const ok = confirm("Bu paylaşımı silmek istiyor musun?");
    if (!ok) return;

    // Optimistic UI
    setPosts((prev) => prev.filter((x) => x.id !== postId));

    if (editingPostId === postId) {
      setEditingPostId(null);
      setEditPostDraft("");
    }

    // Delete from DB
    try {
      const { error } = await supabase.from("hub_posts").delete().eq("id", postId);

      if (error) throw error;

      await fetchHubPosts();
    } catch (e) {
      console.error("deletePost DB error:", e);
      setPosts((prev) => [...prev, p]);
      alert("Paylaşım silinemedi.");
    }
  }

  return {
    // State
    composer,
    setComposer,
    commentDraft,
    setCommentDraft,
    hubMedia,
    setHubMedia,
    showLikedBy,
    setShowLikedBy,
    likedByPost,
    setLikedByPost,
    commentMenuOpenKey,
    setCommentMenuOpenKey,
    editingCommentKey,
    setEditingCommentKey,
    editCommentDraft,
    setEditCommentDraft,
    replyingCommentKey,
    setReplyingCommentKey,
    replyDraft,
    setReplyDraft,
    editingPostId,
    setEditingPostId,
    editPostDraft,
    setEditPostDraft,
    postMenuOpenId,
    setPostMenuOpenId,
    commentInputRefs,
    // Functions
    fetchHubPosts,
    hubShare,
    hubLike,
    hubComment,
    deleteHubComment,
    focusHubComment,
    hubRepost,
    hubPostAuthor,
    canEditPost,
    startEditPost,
    cancelEditPost,
    saveEditPost,
    deletePost,
    // Media picker
    hubMediaPickRef,
    pickHubMedia,
    onPickHubMediaFile,
  };
}
