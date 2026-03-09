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
  if (!authHeader?.startsWith("Bearer ")) {
    return errResponse(401, { error: "Missing or invalid Authorization" });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return errResponse(500, { error: "Server configuration error", step: "config" });
  }

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
  if (userError || !user?.id) {
    return errResponse(401, {
      error: userError?.message || "Invalid or expired token",
      step: "auth",
    });
  }

  const userId = user.id;
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
