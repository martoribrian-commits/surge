import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  resolveOrgTokenCodes,
} from './lib/portal-auth.js';

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'GET') {
    return corsJson({ error: 'Method not allowed' }, 405);
  }

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  const { supabase, provider } = auth;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('id')?.trim();

  if (!sessionId) {
    return corsJson({ error: 'Session id required' }, 400);
  }

  let tokenCodes;
  try {
    tokenCodes = await resolveOrgTokenCodes(supabase, provider);
  } catch (err) {
    console.error('[portal-session-detail]', err.message);
    return corsJson({ error: 'Failed to load session' }, 500);
  }

  if (!tokenCodes.length) {
    return corsJson({ error: 'Session not found' }, 404);
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, token_used, duration, completion_state, synced_at, variant_id, client_session_id')
    .eq('id', sessionId)
    .in('token_used', tokenCodes)
    .maybeSingle();

  if (sessionError) {
    console.error('[portal-session-detail]', sessionError.message);
    return corsJson({ error: 'Failed to load session' }, 500);
  }

  if (!session) {
    return corsJson({ error: 'Session not found' }, 404);
  }

  let telemetry = null;
  let vectorSnapshots = [];

  if (session.client_session_id) {
    const clientId = session.client_session_id;

    const { data: telemetryRow, error: telemetryError } = await supabase
      .from('surge_telemetry')
      .select('session_id, duration_in_seconds, completed_full_cycle, variant_id, created_at')
      .eq('session_id', clientId)
      .maybeSingle();

    if (telemetryError) {
      console.warn('[portal-session-detail] telemetry:', telemetryError.message);
    } else if (telemetryRow) {
      telemetry = {
        sessionId: telemetryRow.session_id,
        durationSeconds: telemetryRow.duration_in_seconds,
        completedFullCycle: telemetryRow.completed_full_cycle,
        variantId: telemetryRow.variant_id ?? null,
        recordedAt: telemetryRow.created_at,
      };
    }

    const { data: vectors, error: vectorError } = await supabase
      .from('crane_vector_snapshots')
      .select('id, summary, metadata, created_at')
      .eq('session_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (vectorError) {
      console.warn('[portal-session-detail] vectors:', vectorError.message);
    } else {
      vectorSnapshots = (vectors ?? []).map((row) => ({
        id: row.id,
        summary: row.summary,
        metadata: row.metadata ?? {},
        createdAt: row.created_at,
      }));
    }
  }

  return corsJson({
    session: {
      id: session.id,
      token: session.token_used,
      durationSeconds: session.duration,
      completionState: session.completion_state,
      syncedAt: session.synced_at,
      variantId: session.variant_id ?? null,
      clientSessionId: session.client_session_id ?? null,
    },
    telemetry,
    vectorSnapshots,
  });
};
