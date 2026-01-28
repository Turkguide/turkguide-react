import { KEY, DEFAULT_ADMINS } from "../constants";
import { lsGet, lsSet } from "./localStorage";
import { uid, now } from "./helpers";

export function ensureSeed() {
  const users = lsGet(KEY.USERS, null);
  if (!users || !Array.isArray(users) || users.length === 0) {
    // ✅ Seed users (no duplicates)
    lsSet(KEY.USERS, [
      {
        id: uid(),
        username: "vicdan",
        email: "vicdan@example.com",
        providers: { google: { sub: "google_seed_vicdan" } },
        tier: "Onaylı",
        xp: 9000,
        createdAt: now(),
        avatar: "",
      },
      {
        id: uid(),
        username: "turkguide",
        email: "admin@turkguide.app",
        providers: { email: true },
        tier: "Onaylı",
        xp: 15000,
        createdAt: now(),
        avatar: "",
      },
    ]);
  }

  const cfg = lsGet(KEY.ADMIN_CONFIG, null);
  if (!cfg || !Array.isArray(cfg.admins) || cfg.admins.length === 0) {
    lsSet(KEY.ADMIN_CONFIG, { admins: DEFAULT_ADMINS });
  }

  const biz = lsGet(KEY.BIZ, null);
  if (!biz || !Array.isArray(biz) || biz.length === 0) {
    lsSet(KEY.BIZ, [
      {
        id: uid(),
        name: "Turkish Market LA",
        ownerUsername: "vicdan",
        category: "Türk Marketleri",
        status: "approved",
        address: "Los Angeles, CA",
        phone: "+1 213 555 0199",
        city: "Los Angeles, California",
        desc: "Türk ürünleri • Taze ürün • Haftalık indirimler",
        avatar: "",
        createdAt: now(),
        approvedAt: now(),
        approvedBy: "vicdan",
      },
    ]);
  }

  if (!lsGet(KEY.BIZ_APPS, null)) lsSet(KEY.BIZ_APPS, []);
  if (!lsGet(KEY.POSTS, null)) lsSet(KEY.POSTS, []);
  if (!lsGet(KEY.DMS, null)) lsSet(KEY.DMS, []);
  if (!lsGet(KEY.APPTS, null)) lsSet(KEY.APPTS, []);
  if (!lsGet(KEY.ADMIN_LOG, null)) lsSet(KEY.ADMIN_LOG, []);
  if (!lsGet(KEY.THEME, null)) lsSet(KEY.THEME, "system");

  if (!lsGet(KEY.SETTINGS, null)) {
    lsSet(KEY.SETTINGS, {
      chatEnabled: true,
      readReceipts: true,
      msgNotifications: true,
    });
  }

  // 🔐 Admin secret — sadece yoksa oluşturulur
  if (lsGet(KEY.ADMIN_SECRET, null) == null) {
    lsSet(KEY.ADMIN_SECRET, `${uid()}-${uid()}`);
  }

  // 🔓 Admin panel kilidi — ilk kurulumda AÇIK
  // (mevcut değer varsa dokunulmaz)
  if (lsGet(KEY.ADMIN_UNLOCK, null) == null) {
    lsSet(KEY.ADMIN_UNLOCK, true);
  }
}
