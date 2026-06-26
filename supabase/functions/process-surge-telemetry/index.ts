import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

interface SurgeTelemetryPayload {
  sessionId: string;
  durationInSeconds: number;
  completedFullCycle: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validatePayload(body: unknown): SurgeTelemetryPayload | null {
  if (!body || typeof body !== "object") return null;

  const { sessionId, durationInSeconds, completedFullCycle } = body as Record<
    string,
    unknown
  >;

  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) return null;
  if (
    typeof durationInSeconds !== "number" ||
    !Number.isFinite(durationInSeconds) ||
    durationInSeconds < 0
  ) {
    return null;
  }
  if (typeof completedFullCycle !== "boolean") return null;

  return {
    sessionId,
    durationInSeconds: Math.round(durationInSeconds),
    completedFullCycle,
  };
}

/**
 * Ingests anonymous Surge session telemetry from the web client.
 *
 * POST { sessionId, durationInSeconds, completedFullCycle }
 * 200 → { ok: true, sessionId }
 */
export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const payload = validatePayload(body);
    if (!payload) {
      return jsonResponse({ error: "Invalid telemetry payload" }, 400);
    }

    const { data, error } = await ctx.supabaseAdmin
      .from("surge_telemetry")
      .upsert(
        {
          session_id: payload.sessionId,
          duration_in_seconds: payload.durationInSeconds,
          completed_full_cycle: payload.completedFullCycle,
        },
        { onConflict: "session_id" },
      )
      .select("session_id")
      .single();

    if (error) {
      console.error("[process-surge-telemetry] insert failed:", error.message);
      return jsonResponse({ error: "Failed to store telemetry" }, 500);
    }

    return jsonResponse({ ok: true, sessionId: data.session_id });
  }),
};
