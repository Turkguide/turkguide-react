# Apple / OAuth giriş (Supabase)

## Kod tarafı

- `src/supabaseClient.js`: `flowType: "pkce"`, `detectSessionInUrl: false` — tarayıcıda OAuth `?code=` akışı için PKCE zorunlu; `implicit` varsayılanı Apple girişini bozabilir. Callback işlemi `useAuthCallback` içinde yapılıyor (çift `exchangeCodeForSession` yarışını önlemek için otomatik URL algılama kapalı).
- `src/utils/authRedirect.js`: `VITE_AUTH_REDIRECT_URL` ile kanonik callback URL’si.

## Ortam değişkeni (önerilir)

```bash
# Üretimde tam URL; Dashboard’daki Redirect URLs ile birebir aynı olmalı
VITE_AUTH_REDIRECT_URL=https://www.turkguide.net/auth/callback
```

**Önemli:** Kullanıcı `turkguide.net` ile siteyi açıp OAuth’u başlatırsa, PKCE verifier o origin’in storage’ında kalır. Redirect `www` ile farklı origin’e giderse kod değişimi başarısız olur. Çözüm: apex → www (veya tersi) yönlendirmesi veya her zaman aynı kanonik URL + `VITE_AUTH_REDIRECT_URL`.

## Supabase Dashboard

1. **Authentication → URL Configuration**  
   - Site URL ve **Redirect URLs** listesinde tam callback: `https://www.turkguide.net/auth/callback`, `http://localhost:5173/auth/callback` (geliştirme), vb.
2. **Authentication → Providers → Apple**  
   - Service ID, Key, Team ID vb. Apple Developer ayarları doğru olmalı.

## Hosting

- `/auth/callback` isteği SPA’ya (`index.html`) düşmeli. Vercel’de `vercel.json` içinde bu rewrite tanımlı.

## Capacitor (native)

OAuth başlangıcı WebView’da (`capacitor://…`) olup callback `https://…` tarayıcıda açılırsa PKCE storage eşleşmez. Native için genelde sabit `VITE_AUTH_REDIRECT_URL`, universal link / deep link veya `Browser` plugin ile uygulamaya dönüş gerekir.
