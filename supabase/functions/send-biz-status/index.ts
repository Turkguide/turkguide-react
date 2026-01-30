import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch (_) {}

  const to = String(payload?.to || "").trim();
  const subject = String(payload?.subject || "").trim();
  const text = String(payload?.text || "").trim();

  if (!to || !subject || !text) {
    return new Response("Missing to/subject/text", { status: 400 });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") || "TurkGuide <info@turkguide.net>";

  if (!apiKey) {
    return new Response("Missing RESEND_API_KEY", { status: 500 });
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    return new Response(body, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
