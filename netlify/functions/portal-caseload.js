import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  resolveOrgTokenCodes,
  tokenStatus,
  requireOrgAdmin,
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

  let tokenCodes;
  try {
    tokenCodes = await resolveOrgTokenCodes(supabase, provider);
  } catch (err) {
    console.error('[portal-caseload]', err.message);
    return corsJson({ error: 'Failed to load caseload' }, 500);
  }

  if (!tokenCodes.length) {
    return corsJson({ caseload: [] });
  }

  const { data: tokenRows, error: tokenError } = await supabase
    .from('clinical_tokens')
    .select('token, patient_alias, uses_remaining, expires_at, activated_at')
    .in('token', tokenCodes);

  if (tokenError) {
    console.error('[portal-caseload] tokens:', tokenError.message);
    return corsJson({ error: 'Failed to load caseload' }, 500);
  }

  const { data: sessionRows, error: sessionError } = await supabase
    .from('sessions')
    .select('token_used, completion_state, synced_at')
    .in('token_used', tokenCodes)
    .order('synced_at', { ascending: false });

  if (sessionError) {
    console.error('[portal-caseload] sessions:', sessionError.message);
    return corsJson({ error: 'Failed to load caseload' }, 500);
  }

  const sessionsByToken = {};
  for (const row of sessionRows ?? []) {
    const token = row.token_used;
    if (!sessionsByToken[token]) {
      sessionsByToken[token] = { total: 0, completed: 0, interrupted: 0, lastSessionAt: null };
    }
    const bucket = sessionsByToken[token];
    bucket.total += 1;
    if (row.completion_state === 'complete') bucket.completed += 1;
    if (row.completion_state === 'interrupted') bucket.interrupted += 1;
    if (!bucket.lastSessionAt || row.synced_at > bucket.lastSessionAt) {
      bucket.lastSessionAt = row.synced_at;
    }
  }

  const caseload = (tokenRows ?? []).map((row) => {
    const stats = sessionsByToken[row.token] ?? {
      total: 0,
      completed: 0,
      interrupted: 0,
      lastSessionAt: null,
    };
    return {
      token: row.token,
      patientAlias: row.patient_alias?.trim() || null,
      displayName: row.patient_alias?.trim() || `Token ${row.token}`,
      status: tokenStatus(row),
      sessionCount: stats.total,
      completedCount: stats.completed,
      interruptedCount: stats.interrupted,
      lastSessionAt: stats.lastSessionAt,
      activated: Boolean(row.activated_at),
    };
  }).sort((a, b) => {
    const aTime = a.lastSessionAt ? new Date(a.lastSessionAt).getTime() : 0;
    const bTime = b.lastSessionAt ? new Date(b.lastSessionAt).getTime() : 0;
    return bTime - aTime;
  });

  return corsJson({ caseload });
};
