# Hesap Silme — Kontrol Listesi ve Test

Hesap silme özelliğinin doğru çalışması için env ve deploy kontrolü.

---

## 1. Proje ve env eşleşmesi

Hesap silme **aynı Supabase projesinde** olmalı: hem frontend hem Edge Function aynı projeyi kullanmalı.

| Adım | Kontrol | Nasıl |
|------|--------|--------|
| 1 | Proje ref | Supabase Dashboard’da URL’deki proje ref: `https://**jxmgvbyhdhhokxzsmvmy**.supabase.co` |
| 2 | Frontend URL | `.env` / `.env.local`: `VITE_SUPABASE_URL=https://jxmgvbyhdhhokxzsmvmy.supabase.co` (sonunda `/` olmasın) |
| 3 | Frontend anon key | `VITE_SUPABASE_ANON_KEY` = Dashboard → **Project Settings** → **API** → **anon public** (aynı proje) |
| 4 | Karşılaştır | Dashboard’dan anon key’i kopyala, `.env`’deki ile **birebir aynı** mı kontrol et (başında/sonunda boşluk yok) |

Farklı proje veya yanlış key → Gateway 401 veya Invalid JWT.

---

## 2. Edge Function deploy

| Adım | Komut / Kontrol |
|------|------------------|
| 1 | `supabase login` (bir kez) |
| 2 | `supabase link --project-ref jxmgvbyhdhhokxzsmvmy` (proje ref kendi projen) |
| 3 | `supabase functions deploy delete-my-account` (hub_posts: `user_id` yoksa kolon hatası yutulur, `username` ile devam; deploy şart) |
| 4 | Dashboard → **Edge Functions** → `delete-my-account` listede ve yeşil mi kontrol et |

---

## 3. Test adımları (manuel)

1. **Giriş:** Uygulamada giriş yap (e-posta veya Apple).
2. **Ayarlar:** Profil/Ayarlar ekranını aç.
3. **Hesabı sil:** "Hesabı Sil" (veya Tehlikeli bölge) butonuna tıkla.
4. **Onay:** Açılan modalda "Evet, hesabımı kalıcı olarak sil"e tıkla.
5. **Bekle:** "Siliniyor…" görünür; en geç ~40 sn içinde bitmeli veya hata çıkmalı.
6. **Başarı:** Ana sayfaya dönmeli, oturum kapalı olmalı; aynı hesapla tekrar giriş yapılamamalı.
7. **Hata:** 401/500 alırsan ekrandaki mesajı not al; Supabase → Edge Functions → delete-my-account → **Logs**’tan ilgili isteğe bak.

---

## 4. Hata durumunda

| Görünen mesaj | Olası neden | Yapılacak |
|---------------|-------------|-----------|
| Oturum bulunamadı / token alınamadı | Giriş yok veya session boş | Çıkış yap, tekrar giriş yap, tekrar dene |
| İstek zaman aşımına uğradı | Ağ yavaş / function yanıt vermiyor | Ağı kontrol et; Logs’ta function’ın çalışıp çalışmadığına bak |
| Invalid JWT / 401 | Token geçersiz veya proje uyumsuz | .env’deki URL + anon key’in bu projeden olduğunu doğrula; çıkış yapıp tekrar giriş yap |
| Sunucu hatası (500) / step adı | Function içinde bir tablo/adım hata veriyor | Logs’ta ilgili step’i aç; hangi tablo/komut hata veriyorsa ona göre düzelt |

---

## 5. Hızlı doğrulama (tarayıcı)

1. Giriş yaptıktan sonra DevTools → **Application** → **Local Storage**.
2. `sb-jxmgvbyhdhhokxzsmvmy-auth-token` (veya proje ref’li benzeri) var mı bak.
3. Varsa oturum kayıtlı; "Hesabı Sil" tıklandığında bu token ile istek gidiyor demektir.

---

## 6. Özet

- **Env:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` aynı projeden.
- **Deploy:** `delete-my-account` bu projede deploy edilmiş olmalı.
- **Test:** Giriş → Ayarlar → Hesabı Sil → Onay → Siliniyor… → Çıkış ve tekrar giriş yapılamaz.

Bu listeyi release öncesi veya hesap silme şikayeti geldiğinde uygulayabilirsin.
