import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

interface SurgeTelemetryPayload {
  sessionId: string;
  durationInSeconds: number;
  completedFullCycle: boolean;
  clinicalToken?: string;
  completionState?: "complete" | "interrupted";
  variantId?: string;
}

interface FetchContextBody {
  action: "fetchContext";
  sessionId: string;
}

interface WriteVectorSnapshotBody {
  action: "writeVectorSnapshot";
  sessionId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

const VALID_VARIANT_IDS = new Set([
  "instant-reset",
  "flash-freeze",
  "orienting-anchor",
  "nova-gate",
  "still-thaw",
  "coherence-ripple",
  "heavy-tide",
  "vagal-downshift",
  "static-field",
]);

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

  const { sessionId, durationInSeconds, completedFullCycle, clinicalToken, completionState, variantId } =
    body as Record<string, unknown>;

  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) return null;
  if (
    typeof durationInSeconds !== "number" ||
    !Number.isFinite(durationInSeconds) ||
    durationInSeconds < 0
  ) {
    return null;
  }
  if (typeof completedFullCycle !== "boolean") return null;

  const result: SurgeTelemetryPayload = {
    sessionId,
    durationInSeconds: Math.round(durationInSeconds),
    completedFullCycle,
  };

  if (typeof clinicalToken === "string" && /^[A-Za-z0-9]{6}$/.test(clinicalToken)) {
    result.clinicalToken = clinicalToken.toUpperCase();
  }
  if (completionState === "complete" || completionState === "interrupted") {
    result.completionState = completionState;
  }
  if (typeof variantId === "string" && VALID_VARIANT_IDS.has(variantId)) {
    result.variantId = variantId;
  }

  return result;
}

function isFetchContextBody(body: unknown): body is FetchContextBody {
  if (!body || typeof body !== "object") return false;
  const { action, sessionId } = body as Record<string, unknown>;
  return action === "fetchContext" && typeof sessionId === "string" &&
    UUID_RE.test(sessionId);
}

function isWriteVectorSnapshotBody(body: unknown): body is WriteVectorSnapshotBody {
  if (!body || typeof body !== "object") return false;
  const { action, sessionId, summary } = body as Record<string, unknown>;
  return (
    action === "writeVectorSnapshot" &&
    typeof sessionId === "string" &&
    UUID_RE.test(sessionId) &&
    typeof summary === "string" &&
    summary.trim().length > 0 &&
    summary.length <= 600
  );
}

async function assembleSupabaseContext(
  sessionId: string,
  ctx: { supabaseAdmin: { from: (table: string) => unknown } },
) {
  const admin = ctx.supabaseAdmin as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          order: (
            col: string,
            opts: { ascending: boolean },
          ) => { limit: (n: number) => Promise<{ data: unknown[]; error: unknown }> };
        };
      };
    };
  };

  const { data: telemetry, error: telemetryError } = await admin
    .from("surge_telemetry")
    .select(
      "session_id, duration_in_seconds, completed_full_cycle, variant_id, created_at",
    )
    .eq("session_id", sessionId)
    .maybeSingle();

  if (telemetryError) {
    throw telemetryError;
  }

  const { data: vectorHistory, error: vectorError } = await admin
    .from("crane_vector_snapshots")
    .select("id, session_id, summary, metadata, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (vectorError) {
    // Table may not exist yet on older deployments — degrade gracefully
    console.warn("[process-surge-telemetry] vector fetch:", vectorError);
  }

  const telemetryRow = telemetry as {
    session_id?: string;
    duration_in_seconds?: number;
    completed_full_cycle?: boolean;
    variant_id?: string | null;
    created_at?: string;
  } | null;

  return {
    sessionId,
    variantId: telemetryRow?.variant_id ?? null,
    telemetry: telemetry ?? null,
    vectorHistory: vectorHistory ?? [],
    compiledAt: new Date().toISOString(),
  };
}

/**
 * Ingests Surge telemetry (POST) or assembles Crane context (POST fetchContext).
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

    // ── Write anonymized somatic vector snapshot ──
    if (isWriteVectorSnapshotBody(body)) {
      const metadata =
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? body.metadata
          : {};

      const { error: insertError } = await ctx.supabaseAdmin
        .from("crane_vector_snapshots")
        .insert({
          session_id: body.sessionId,
          summary: body.summary.trim(),
          metadata,
        });

      if (insertError) {
        console.error("[process-surge-telemetry] vector insert:", insertError.message);
        return jsonResponse({ error: "Failed to store vector snapshot" }, 500);
      }

      return jsonResponse({ ok: true, sessionId: body.sessionId });
    }

    // ── Fetch compiled context for Crane inference ──
    if (isFetchContextBody(body)) {
      try {
        const supabaseContext = await assembleSupabaseContext(
          body.sessionId,
          ctx,
        );
        return jsonResponse({ supabaseContext });
      } catch (err) {
        console.error("[process-surge-telemetry] context assembly failed:", err);
        return jsonResponse({ error: "Failed to assemble context" }, 500);
      }
    }

    // ── Ingest telemetry ──
    const payload = validatePayload(body);
    if (!payload) {
      return jsonResponse({ error: "Invalid telemetry payload" }, 400);
    }

    const upsertRow: Record<string, unknown> = {
      session_id: payload.sessionId,
      duration_in_seconds: payload.durationInSeconds,
      completed_full_cycle: payload.completedFullCycle,
    };
    if (payload.variantId) {
      upsertRow.variant_id = payload.variantId;
    }

    const { data, error } = await ctx.supabaseAdmin
      .from("surge_telemetry")
      .upsert(upsertRow, { onConflict: "session_id" })
      .select("session_id")
      .single();

    if (error) {
      console.error("[process-surge-telemetry] insert failed:", error.message);
      return jsonResponse({ error: "Failed to store telemetry" }, 500);
    }

    const state = payload.completionState ??
      (payload.completedFullCycle ? "complete" : "interrupted");

    if (payload.clinicalToken) {
      const sessionRow: Record<string, unknown> = {
        token_used: payload.clinicalToken,
        duration: payload.durationInSeconds,
        completion_state: state,
      };
      if (payload.variantId) {
        sessionRow.variant_id = payload.variantId;
      }

      const { error: sessionError } = await ctx.supabaseAdmin
        .from("sessions")
        .insert(sessionRow);

      if (sessionError) {
        console.warn("[process-surge-telemetry] session insert:", sessionError.message);
      }
    }

    return jsonResponse({ ok: true, sessionId: data.session_id });
  }),
};
