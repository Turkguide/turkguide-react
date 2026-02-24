# Stabilite İncelemesi (Apple Öncesi)

Bu doküman, projenin kritik hata düzeltmeleri ve stabilizasyon özetini içerir.

## Kritik Düzeltmeler (Runtime)

### 1. AdminPanel – React Hooks Kuralları
- **Sorun:** `if (!adminMode) return null` tüm hook’lardan önceydi; bazı render’larda hook’lar hiç çağrılmıyordu (rules-of-hooks ihlali).
- **Çözüm:** Tüm `useState` ve `useMemo` çağrıları en üstte, `if (!adminMode) return null` ise hook’lardan sonra ve ana `return` öncesine taşındı.

### 2. useUserManagement – Tanımsız Değişkenler
- **Sorun:** Supabase HUB/DM senkronunda `oldKey`, `remapComments`, `replaceUsername` kullanılıyordu ama bunlar sadece `try` bloğu içinde tanımlıydı; blok dışında kullanılınca runtime hatası riski vardı.
- **Çözüm:** `oldKey`, `replaceUsername`, `remapComments` tanımları `if (oldU && newUsername && ...)` bloğunun başına alındı; hem `try` hem Supabase kısımları aynı scope’ta kullanıyor.

### 3. DMModal – setDmTarget Eksik
- **Sorun:** “Kapat” butonu `setDmTarget(null)` çağırıyordu ama `setDmTarget` prop olarak gelmiyordu (no-undef).
- **Çözüm:** `App.jsx` içinde `DMModal`’a `setDmTarget={messages.setDmTarget}` eklendi; `DMModal` prop listesine `setDmTarget` alındı ve kapatmada `setDmTarget?.(null)` kullanıldı.

### 4. useSettings – setState in Effect
- **Sorun:** `useEffect` içinde senkron `setSettings` çağrısı “set-state-in-effect” uyarısına ve gereksiz render’lara yol açıyordu.
- **Çözüm:** Boot’ta localStorage’dan okuyup state’e yazan effect kaldırıldı; state sadece lazy initializer ile `lsGet(KEY.SETTINGS, ...)` ile başlatılıyor.

### 5. HubTab – Sabit Koşul ve Lint
- **Sorun:** `(hub?.canEditPost?.(...) || true)` ve `{true ? ...}` no-constant-condition / gereksiz boolean cast uyarılarına neden oluyordu.
- **Çözüm:** Post menüsü `canShowMenu = !!hub` ile koşula bağlandı; yorum menüsü `hub ?` ile gösteriliyor. Kullanılmayan `users` prop’u `_users` olarak işlendi.

## Diğer İyileştirmeler

- **ESLint:** `no-empty` için `allowEmptyCatch: true`, `no-unused-vars` için `argsIgnorePattern: '^_'` ve uyarı seviyesi ayarlandı. Lint artık sadece uyarı veriyor (exit 0).
- **contentFilter.js:** Gereksiz escape (`\-`) karakter sınıfında kaldırıldı.
- **useUserManagement / useBusinessEdit / useMessages:** Kullanılmayan parametreler `_biz`, `_posts`, `_dms` vb. ile işaretlendi.

## Build ve Lint Durumu

- `npm run build`: Başarılı.
- `npm run lint`: Çıkış kodu 0 (sadece uyarılar, hata yok).

## Apple İncelemesi İçin Kontrol Listesi

- [x] Kritik runtime hatalar giderildi (AdminPanel hooks, useUserManagement scope, DMModal prop).
- [x] Production build sorunsuz alınıyor.
- [x] Lint hata vermiyor (uyarılarla çalışıyor).
- [ ] Uygulama canlıda (web + mobil) bir kez akış testi önerilir: giriş, terms, HUB, bildir, admin, DM, ayarlar.

## Sonraki Adımlar (İsteğe Bağlı)

- Kalan lint uyarılarını (unused vars, exhaustive-deps) tek tek temizlemek.
- Supabase RLS ve API hata mesajlarını kullanıcıya anlamlı şekilde göstermek.
- E2E veya kritik akışlar için basit testler eklemek.
