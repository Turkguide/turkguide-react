import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMsg = "❌ KRİTİK HATA: Supabase environment variables eksik! Uygulama düzgün çalışmayabilir.";
  console.error(errorMsg, { SUPABASE_URL, SUPABASE_ANON_KEY });
  // Production'da kullanıcıya gösterilebilir, şimdilik console'da bırakıyoruz
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  console.log("✅ SUPABASE URL:", SUPABASE_URL);
  console.log("✅ SUPABASE KEY OK:", !!SUPABASE_ANON_KEY);
}