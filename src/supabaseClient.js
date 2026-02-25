import { createClient } from "@supabase/supabase-js";
import { supabaseAuthStorage } from "./utils/capacitorStorage";

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

let supabase = null;
try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables eksik");
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: supabaseAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  if (import.meta.env.DEV) {
    console.log("Supabase URL configured");
  }
} catch (e) {
  const errorMsg =
    "Supabase env eksik veya hatalı. Uygulama çalışamaz.";
  if (import.meta.env.DEV) {
    console.error(errorMsg, String(e?.message || e || ""));
  }
}

export { supabase };