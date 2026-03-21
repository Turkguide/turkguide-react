import { createClient } from "@supabase/supabase-js";
import { supabaseAuthStorage } from "./utils/capacitorStorage";

/** Trim + no trailing slash — Edge Functions / REST base URL must not be `https://xxx.supabase.co/` */
const rawUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_URL = rawUrl.replace(/\/+$/, "");
console.log("SUPABASE URL:", SUPABASE_URL);
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

let supabase = null;
try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY boş. .env / .env.local içinde tanımlayın; sonra `npm run dev` ile yeniden başlatın."
    );
  }
  if (import.meta.env.DEV) {
    console.log("SUPABASE URL:", SUPABASE_URL);
    console.log("SUPABASE ANON KEY:", SUPABASE_ANON_KEY ? "(set)" : "(missing)");
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: supabaseAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      // OAuth (Apple, Google, …) uses PKCE; default client flow was "implicit" and breaks ?code= exchange.
      flowType: "pkce",
      // useAuthCallback handles ?code= / hash; avoids racing double exchangeCodeForSession with GoTrue init.
      detectSessionInUrl: false,
    },
  });
  if (import.meta.env.DEV) {
    console.log("Supabase client created (same URL + anon key for auth & Edge Functions).");
  }
} catch (e) {
  const errorMsg =
    "Supabase env eksik veya hatalı. Uygulama çalışamaz.";
  if (import.meta.env.DEV) {
    console.error(errorMsg, String(e?.message || e || ""));
  }
}

export { supabase };
