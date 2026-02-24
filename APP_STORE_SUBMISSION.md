# Apple App Store & TestFlight Gönderim Rehberi

Bu rehber, TurkGuide uygulamasını TestFlight’a ve Apple App Store onayına hazırlamak için gereken adımları özetler.

---

## 1. Proje Ayarları (Tamamlandı)

- **Info.plist**: `ITSAppUsesNonExemptEncryption = NO` (sadece standart HTTPS kullanılıyor; export compliance sorusu atlanır).
- **Info.plist**: `UIRequiresFullScreen = YES` (iPad’de tek pencere).
- **Info.plist**: `CFBundleDisplayName` düzgün ayarlandı (TurkGuide).
- **PrivacyInfo.xcprivacy**: Apple Gizlilik Manifest dosyası eklendi; toplanan veri türleri (e-posta, kullanıcı kimliği, isim, kullanıcı içeriği) ve takip yapılmadığı bildirildi.
- **Yasal sayfalar**: Gizlilik politikası, kullanım şartları, raporlama ve iletişim sayfaları uygulama içinden (Ayarlar > Legal) erişilebilir.

---

## 2. Her TestFlight / App Store Build’i Öncesi

### 2.1 Web build ve iOS’a kopyalama

```bash
npm run build
npx cap sync ios
```

### 2.2 Build numarasını artırma

- **TestFlight**: Her yeni yüklemede **CURRENT_PROJECT_VERSION** (Build) artırılmalı.
- Xcode: **App** target → **General** → **Build** alanı (örn. 1 → 2 → 3).
- Veya `ios/App/App.xcodeproj/project.pbxproj` içinde `CURRENT_PROJECT_VERSION = 2;` (Debug ve Release için).

### 2.3 Xcode’dan arşiv (Archive)

1. Xcode’da `ios/App/App.xcworkspace` açın (`.xcworkspace`, `.xcodeproj` değil).
2. **Product** → **Destination** → **Any iOS Device (arm64)** seçin.
3. **Product** → **Archive**.
4. Archive tamamlanınca **Organizer** açılır → **Distribute App** → **App Store Connect** → **Upload**.

---

## 3. App Store Connect Ayarları

### 3.1 Uygulama bilgileri

- **Privacy Policy URL**: Canlı sitedeki gizlilik sayfası (örn. `https://www.turkguide.net/privacy.html` veya production URL’iniz).
- **Category**: Uygulamanıza uygun kategori (örn. Lifestyle veya Travel).
- **Age Rating**: Ankette doğru yanıtlayın (ör. 13+).

### 3.2 İnceleme için demo hesap (Önemli)

Apple incelemesinde uygulamanın giriş sonrası özelliklerini test edebilmesi gerekir.

- **App Store Connect** → Uygulama → **App Information** → **App Review Information**.
- **Sign-in required** alanında:
  - **Demo hesap kullanıcı adı ve şifresi** verin.
  - Gerekirse ek not: “After login, you can use Search, HUB, and Messages.”

Demo hesap oluşturmadıysanız, inceleme için özel bir test hesabı oluşturup bu bilgileri girin.

### 3.3 Export compliance

- Info.plist’te `ITSAppUsesNonExemptEncryption = false` olduğu için App Store Connect’te “Does your app use encryption?” sorusuna **No** (veya “Only standard encryption”) cevabı verin.
- Gerekirse **App** → **App Information** → **Export Compliance** bölümünde aynı bilgiyi seçin.

### 3.4 Gizlilik (Privacy “Nutrition” label)

- **App Store Connect** → Uygulama → **App Privacy**.
- Topladığınız veri türlerini (e-posta, kullanıcı adı, kullanıcı içeriği vb.) tanımlayın.
- Veri satılıp satılmadığı ve takip amaçlı kullanılıp kullanılmadığı sorularını doğru işaretleyin (TurkGuide için büyük ihtimalle “Data not used for tracking”, “Data not sold”).

---

## 4. TestFlight

### 4.1 Internal testing

- Build yüklendikten sonra **TestFlight** sekmesinde görünür.
- **Internal Testing** grubuna ekleyin; aynı ekipteki test kullanıcıları e-posta ile davet alır.

### 4.2 External testing (isteğe bağlı)

- **External Testing** grubu oluşturup build ekleyin.
- İlk kez external grup kullanıyorsanız **Beta App Review** gerekir (kısa bir inceleme).
- Onay sonrası davet linki veya e-posta ile testçilere gönderilir.

---

## 5. App Store’a Gönderim (İnceleme)

- **App Store Connect** → Uygulama → **App Store** sekmesi.
- Sürüm bilgisi, ekran görüntüleri, açıklama, anahtar kelimeler, fiyat (Ücretsiz) doldurulmuş olmalı.
- **Build** kısmından TestFlight’a yüklediğiniz build’i seçin.
- **Submit for Review** ile gönderin.

---

## 6. Onay İçin Kontrol Listesi

- [ ] Gizlilik politikası ve kullanım şartları uygulama içinden (Ayarlar) açılabiliyor.
- [ ] App Store Connect’te **Privacy Policy URL** ve **Demo account** (giriş gerekiyorsa) dolduruldu.
- [ ] Export compliance: “No” / “Only standard encryption” ve Info.plist’te `ITSAppUsesNonExemptEncryption = false`.
- [ ] **App Privacy** (nutrition label) güncel.
- [ ] Her yeni build için **Build** numarası artırıldı.
- [ ] TestFlight’ta en az bir kez build başarıyla yüklendi.

---

## 7. Sign in with Apple

Uygulama e-posta ve Apple ile giriş sunuyor. Apple, üçüncü taraf giriş (Google, e-posta vb.) sunan uygulamalarda **Sign in with Apple** seçeneğini zorunlu tutar. TurkGuide’da bu seçenek mevcut; App Store incelemesinde sorun çıkmaması için Apple OAuth’un Supabase’te etkin ve test edilmiş olduğundan emin olun.

---

## 8. Sık Karşılaşılan Red Nedenleri ve Önlemler

| Konu | Önlem |
|------|--------|
| İnceleyici uygulamayı test edemiyor | Demo hesap ve kısa “how to test” notu verin. |
| Gizlilik politikası bulunamıyor | URL’in canlı ve erişilebilir olduğundan emin olun; uygulama içi linki Ayarlar’da mevcut. |
| Eksik izin açıklaması | Sadece gerçekten kullandığınız izinler için Info.plist’te açıklama ekleyin (kamera, konum vb.). TurkGuide şu an sadece ağ kullanıyor; ek izin yok. |
| Çökme veya boş ekran | Release build’i cihazda test edin; `npm run build` ve `npx cap sync ios` sonrası Xcode’dan çalıştırın. |

Bu adımları takip ederek uygulamanızı TestFlight ve App Store incelemesine hazır hale getirebilirsiniz.

---

## Admin paneli – Kötüye kullanım (reports)

Raporların admin panelinde “Kötüye Kullanım” bölümünde görünmesi için:

1. **Supabase:** `public.profiles` tablosunda `role` sütunu olmalı (`supabase/report_policies.sql` içinde `alter table` ile eklenir).
2. **Admin kullanıcı:** Raporları görebilen kullanıcının `profiles` kaydında `role = 'admin'` olmalı. Supabase SQL Editor’da örnek:  
   `update public.profiles set role = 'admin' where id = 'ADMIN_USER_UUID';`
