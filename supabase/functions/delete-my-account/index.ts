/**
 * Edge Function: delete-my-account
 * Lets the authenticated user permanently delete their own account.
 * Verifies JWT, then cleans up all user-related data in order, then deletes auth user.
 * Returns detailed JSON error on first failing step.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function norm(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s).trim().toLowerCase();
}

type StepResult = { step: string; success: true } | { step: string; success: false; code: string; message: string; details?: string };

async function runStep(
  step: string,
  fn: () => Promise<{ error: unknown } | null>
): Promise<StepResult> {
  try {
    const result = await fn();
    if (result?.error) {
      const err = result.error as { code?: string; message?: string; details?: string };
      const code = err?.code != null ? String(err.code) : "UNKNOWN";
      const message = err?.message != null ? String(err.message) : "Unknown error";
      const details = err?.details != null ? String(err.details) : undefined;
      console.error(JSON.stringify({ step, success: false, code, message, details }));
      return { step, success: false, code, message, details };
    }
    console.log(JSON.stringify({ step, success: true }));
    return { step, success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const details = e instanceof Error ? (e.stack ?? undefined) : undefined;
    console.error(JSON.stringify({ step, success: false, code: "EXCEPTION", message, details }));
    return { step, success: false, code: "EXCEPTION", message, details };
  }
}

function errResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const safeRespond = (status: number, payload: Record<string, unknown>) => {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errResponse(405, { error: "Method not allowed" });
  }

  const authHeader = req.headers.get("Authorization");
  const hasAuthHeader = !!authHeader;
  const hasBearerPrefix = authHeader?.startsWith("Bearer ");
  const tokenLength = authHeader?.replace("Bearer ", "").length ?? 0;
  console.log(JSON.stringify({
    step: "auth_input",
    hasAuthHeader,
    hasBearerPrefix,
    tokenLength,
    urlHost: req.url ? new URL(req.url).host : "",
  }));

  if (!authHeader || !hasBearerPrefix) {
    return errResponse(401, {
      error: hasAuthHeader ? "Authorization header missing Bearer prefix" : "Missing Authorization header",
      step: "auth",
      detail: "auth_header_invalid",
    });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const isJwtFormat = token.split(".").length === 3;
  console.log(JSON.stringify({
    step: "token_check",
    tokenLength: token.length,
    isJwtFormat,
    tokenFirst10: token.slice(0, 10),
  }));

  if (!isJwtFormat || token.length < 50) {
    return errResponse(401, {
      error: "Token format invalid (not a JWT or too short)",
      step: "auth",
      detail: "token_format",
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.replace(".supabase.co", "") : "";

  console.log(JSON.stringify({
    step: "config",
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    projectRef,
  }));

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return errResponse(500, { error: "Server configuration error", step: "config" });
  }

  // Client without global auth header — we pass the token only to getUser(token)
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

  // Validate JWT with Auth server (single source of truth; getClaims can fail with new keys)
  const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
  console.log(JSON.stringify({
    step: "getUser_result",
    hasUser: !!userData?.user,
    userId: userData?.user?.id ?? null,
    userError: userError?.message ?? null,
    userErrorName: userError?.name ?? null,
  }));

  if (userError || !userData?.user?.id) {
    const serverMessage = userError?.message ?? "Invalid or expired token";
    return errResponse(401, {
      error: serverMessage,
      step: "auth",
      detail: "getUser_failed",
      authErrorName: userError?.name ?? null,
    });
  }

  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let usernameNorm = "";
  try {
    const { data: profile, error: profileErr } = await admin.from("profiles").select("username").eq("id", userId).single();
    if (profileErr) {
      console.warn(JSON.stringify({ step: "profiles_select", warning: profileErr.message }));
    } else {
      usernameNorm = norm(profile?.username ?? "");
    }
  } catch (_) {}

  const steps: Array<() => Promise<StepResult>> = [
    async () => runStep("reports", async () => {
      const { error } = await admin.from("reports").delete().eq("reporter_id", userId);
      return error ? { error } : null;
    }),
    async () => runStep("user_blocks_blocker", async () => {
      const { error } = await admin.from("user_blocks").delete().eq("blocker_id", userId);
      return error ? { error } : null;
    }),
    async () => runStep("user_blocks_blocked", async () => {
      const { error } = await admin.from("user_blocks").delete().eq("blocked_id", userId);
      return error ? { error } : null;
    }),
    async () => runStep("dms_from", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("dms").delete().ilike("from_username", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("dms_to", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("dms").delete().ilike("to_username", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("notifications_from", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("notifications").delete().ilike("from_username", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("notifications_to", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("notifications").delete().ilike("to_username", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("appointments", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("appointments").delete().ilike("from_username", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("hub_posts", async () => {
      const { error } = await admin.from("hub_posts").delete().eq("user_id", userId);
      return error ? { error } : null;
    }),
    async () => runStep("biz_apps_user_id", async () => {
      const { error } = await admin.from("biz_apps").delete().eq("user_id", userId);
      return error ? { error } : null;
    }),
    async () => runStep("biz_apps_owner", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("biz_apps").delete().ilike("owner_username", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("biz_apps_applicant", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("biz_apps").delete().ilike("applicant", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("businesses", async () => {
      if (!usernameNorm) return null;
      const { error } = await admin.from("businesses").delete().ilike("owner_username", usernameNorm);
      return error ? { error } : null;
    }),
    async () => runStep("admin_logs", async () => {
      const { error } = await admin.from("admin_logs").delete().eq("admin_id", userId);
      return error ? { error } : null;
    }),
    async () => runStep("profiles", async () => {
      const { error } = await admin.from("profiles").delete().eq("id", userId);
      return error ? { error } : null;
    }),
  ];

  for (const run of steps) {
    const result = await run();
    if (!result.success) {
      return errResponse(500, {
        error: result.message,
        step: result.step,
        code: result.code,
        details: result.details,
      });
    }
  }

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    console.error(JSON.stringify({ step: "auth_delete_user", success: false, message: deleteAuthError.message }));
    return errResponse(400, {
      error: deleteAuthError.message,
      step: "auth_delete_user",
      code: deleteAuthError.name || "AUTH_DELETE_ERROR",
    });
  }

  console.log(JSON.stringify({ step: "auth_delete_user", success: true }));
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const details = e instanceof Error ? (e.stack ?? undefined) : undefined;
    console.error(JSON.stringify({ step: "unhandled", code: "EXCEPTION", message, details }));
    return safeRespond(500, {
      error: message,
      step: "unhandled",
      code: "EXCEPTION",
      details,
    });
  }
});
