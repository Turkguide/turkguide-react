export function renderNotificationText(n) {
  const from = n?.fromUsername ? `@${n.fromUsername}` : "Bir kullanıcı";
  switch (n?.type) {
    case "like":
      return `${from} paylaşımınızı beğendi.`;
    case "comment":
      return `${from} paylaşımınıza yorum yaptı.`;
    case "comment_reply":
      return `${from} yorumunuza cevap verdi.`;
    case "repost":
      return `${from} paylaşımınızı HUB'da yeniden paylaştı.`;
    case "report":
      return `${from} bir içerik raporladı.`;
    case "biz_approved":
      return `Tebrikler! Isletmeniz onaylandi. ${n?.metadata?.bizName ? `(${n.metadata.bizName})` : ""}`.trim();
    case "biz_rejected":
      return `Uzgunuz, isletmeniz onaylanamadi. ${n?.metadata?.reason ? `Sebep: ${n.metadata.reason}` : ""}`.trim();
    default:
      return `${from} size bir bildirim gönderdi.`;
  }
}
