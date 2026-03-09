/**
 * Edge Function: delete-my-account
 * Lets the authenticated user permanently delete their own account.
 * Verifies JWT, then cleans up all user-related data in order, then deletes auth user.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function norm(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s).trim().toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
  if (userError || !user?.id) {
    return new Response(
      JSON.stringify({ error: userError?.message || "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const userId = user.id;
  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve username for tables keyed by username (before we delete profile)
  let usernameNorm = "";
  try {
    const { data: profile } = await admin.from("profiles").select("username").eq("id", userId).single();
    usernameNorm = norm(profile?.username ?? "");
  } catch (_) {}

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      console.warn("delete-my-account cleanup step:", e);
    }
  };

  // Order: tables that reference the user, then profile, then auth (no FK from auth to public)
  await run(() => admin.from("reports").delete().eq("reporter_id", userId));
  await run(() => admin.from("user_blocks").delete().eq("blocker_id", userId));
  await run(() => admin.from("user_blocks").delete().eq("blocked_id", userId));
  if (usernameNorm) {
    await run(() => admin.from("dms").delete().ilike("from_username", usernameNorm));
    await run(() => admin.from("dms").delete().ilike("to_username", usernameNorm));
    await run(() => admin.from("notifications").delete().ilike("from_username", usernameNorm));
    await run(() => admin.from("notifications").delete().ilike("to_username", usernameNorm));
    await run(() => admin.from("appointments").delete().ilike("from_username", usernameNorm));
  }
  await run(() => admin.from("hub_posts").delete().eq("user_id", userId));
  // biz_apps: applications by this user (user_id or applicant/owner_username)
  await run(() => admin.from("biz_apps").delete().eq("user_id", userId));
  if (usernameNorm) {
    await run(() => admin.from("biz_apps").delete().ilike("owner_username", usernameNorm));
    await run(() => admin.from("biz_apps").delete().ilike("applicant", usernameNorm));
    // businesses: listings owned by this user (owner_username)
    await run(() => admin.from("businesses").delete().ilike("owner_username", usernameNorm));
  }
  // admin_logs references auth.users(id) — must remove before auth delete to avoid FK violation
  await run(() => admin.from("admin_logs").delete().eq("admin_id", userId));
  await run(() => admin.from("profiles").delete().eq("id", userId));

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    return new Response(JSON.stringify({ error: deleteAuthError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
