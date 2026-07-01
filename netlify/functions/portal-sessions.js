import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  resolveOrgTokenCodes,
  parseSessionFilters,
  applySessionFilters,
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
  const filters = parseSessionFilters(url);

  if (filters.error) {
    return corsJson({ error: filters.error }, 400);
  }

  let tokenCodes;
  try {
    tokenCodes = await resolveOrgTokenCodes(supabase, provider);
  } catch (err) {
    console.error('[portal-sessions]', err.message);
    return corsJson({ error: 'Failed to load sessions' }, 500);
  }

  if (!tokenCodes.length) {
    return corsJson({ sessions: [], hasMore: false, offset: 0 });
  }

  if (filters.token && !tokenCodes.includes(filters.token)) {
    return corsJson({ sessions: [], hasMore: false, offset: filters.offset });
  }

  let query = supabase
    .from('sessions')
    .select('id, token_used, duration, completion_state, synced_at, variant_id, client_session_id')
    .in('token_used', tokenCodes)
    .order('synced_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  query = applySessionFilters(query, filters);

  const { data: rows, error } = await query;

  if (error) {
    console.error('[portal-sessions]', error.message);
    return corsJson({ error: 'Failed to load sessions' }, 500);
  }

  const sessions = (rows ?? []).map((row) => ({
    id: row.id,
    token: row.token_used,
    durationSeconds: row.duration,
    completionState: row.completion_state,
    syncedAt: row.synced_at,
    variantId: row.variant_id ?? null,
    clientSessionId: row.client_session_id ?? null,
  }));

  return corsJson({
    sessions,
    hasMore: sessions.length === filters.limit,
    offset: filters.offset,
  });
};
