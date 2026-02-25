# İşletme Ekleme ve Bildir Hataları — Bulunan ve Düzeltilen

## İşletme Ekleme (İşletme Başvurusu)

### Bulunan hatalar
1. **user null/undefined crash**  
   `submitBizApplication` içinde `user.username` ve `user.id` doğrudan kullanılıyordu. Oturum bitmiş veya `user` henüz gelmemişse (örn. OAuth’da username yok) `Cannot read property 'username' of null` hatası oluşuyordu.
2. **Eksik Türkçe karakterler**  
   Supabase insert hata mesajı: "Basvuru gonderilemedi. Lutfen tekrar deneyin." (ş, ı, ü eksikti).
3. **Genel hata yakalama yoktu**  
   Validasyon veya `setBizApps` sırasında oluşan beklenmeyen hatalar yakalanmıyor, kullanıcıya anlamlı mesaj gösterilmiyordu.

### Yapılan düzeltmeler
- `requireAuth` sonrası `if (!user?.id)` kontrolü eklendi; yoksa "Oturum bulunamadı. Lütfen tekrar giriş yapın." mesajı.
- `applicant` / `ownerUsername` için: `user?.username ?? user?.email ?? "user"` kullanıldı (username yoksa email veya "user").
- Tüm submit akışı `try/catch` ile sarıldı; catch’te "Başvuru gönderilirken hata oluştu. Lütfen tekrar deneyin." gösteriliyor.
- Insert hata mesajları Türkçe karakterlerle düzeltildi: "Başvuru gönderilemedi. Lütfen tekrar deneyin."
- Production’da gereksiz log kalmaması için `console.warn`/`console.error` sadece `import.meta.env.DEV` iken çalışıyor.

**Dosya:** `src/features/business/useBusiness.js`

---

## Bildir (Şikayet)

### Bulunan hatalar
1. **RPC yoksa belirsiz hata**  
   Supabase’de `insert_report` RPC’si yoksa veya `supabase.rpc` kullanılamıyorsa hata mesajı net değildi.
2. **RPC “does not exist” durumu**  
   Sunucuda fonksiyon yoksa kullanıcıya "Şikayet sistemi henüz aktif değil" gibi açıklayıcı mesaj verilmiyordu.
3. **openReport catch’te production log**  
   `openReport` hata durumunda production’da da `console.error` çalışıyordu.

### Yapılan düzeltmeler
- `submitReport` içinde `supabase?.rpc` çağrılmadan önce `typeof supabase?.rpc === "function"` kontrolü eklendi; değilse "Şikayet özelliği şu an kullanılamıyor. Lütfen daha sonra deneyin." mesajı.
- Catch’te RPC’nin sunucuda olmadığını düşündüren hata mesajları (örn. "function does not exist") için: "Şikayet sistemi henüz aktif değil. Lütfen daha sonra deneyin veya destek ile iletişime geçin." mesajı.
- Genel hata mesajı: "Lütfen tekrar dene." → "Lütfen tekrar deneyin." olarak güncellendi.
- `openReport` ve `submitReport` içindeki `console.error`/`console.warn` sadece `import.meta.env.DEV` iken çalışıyor.

**Dosyalar:** `src/App.jsx` (submitReport, openReport)

---

## Supabase tarafında kontrol

- **İşletme başvurusu:** `biz_apps` tablosu ve RLS politikaları projede tanımlı mı, insert yetkisi var mı kontrol edin.
- **Bildir:** `supabase/report_policies.sql` içindeki `insert_report` fonksiyonu Supabase SQL Editor’de çalıştırılmış mı, `authenticated` rolüne `execute` verildi mi kontrol edin.
