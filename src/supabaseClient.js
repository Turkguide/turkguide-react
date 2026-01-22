import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Supabase env eksik!", { SUPABASE_URL, SUPABASE_ANON_KEY });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("✅ SUPABASE URL:", SUPABASE_URL);
console.log("✅ SUPABASE KEY OK:", !!SUPABASE_ANON_KEY);