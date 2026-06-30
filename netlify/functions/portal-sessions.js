import { handleOptions, corsJson, verifyPortalRequest } from './lib/portal-auth.js';

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'GET') {
    return corsJson({ error: 'Method not allowed' }, 405);
  }

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  const { supabase, userId } = auth;
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));

  const { data: tokenRows } = await supabase
    .from('clinical_tokens')
    .select('token')
    .eq('provider_id', userId);

  const tokenCodes = (tokenRows ?? []).map((r) => r.token);
  if (!tokenCodes.length) {
    return corsJson({ sessions: [] });
  }

  const { data: rows, error } = await supabase
    .from('sessions')
    .select('id, token_used, duration, completion_state, synced_at')
    .in('token_used', tokenCodes)
    .order('synced_at', { ascending: false })
    .limit(limit);

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
  }));

  return corsJson({ sessions });
};
