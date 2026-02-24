import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

let supabase = null;
try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables eksik");
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("✅ SUPABASE URL:", SUPABASE_URL);
  console.log("✅ SUPABASE KEY OK:", !!SUPABASE_ANON_KEY);
} catch (e) {
  const errorMsg =
    "❌ KRİTİK HATA: Supabase environment variables eksik veya hatalı. Uygulama sınırlı çalışabilir.";
  console.error(errorMsg, {
    error: String(e?.message || e || ""),
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  });
}

export { supabase };