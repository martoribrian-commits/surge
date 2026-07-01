import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  resolveOrgProviderIds,
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
  const providerIds = await resolveOrgProviderIds(supabase, provider);

  const { count: issued, error: issuedError } = await supabase
    .from('clinical_tokens')
    .select('*', { count: 'exact', head: true })
    .in('provider_id', providerIds);

  if (issuedError) {
    console.error('[portal-stats]', issuedError.message);
    return corsJson({ error: 'Failed to load stats' }, 500);
  }

  const { count: activated, error: activatedError } = await supabase
    .from('clinical_tokens')
    .select('*', { count: 'exact', head: true })
    .in('provider_id', providerIds)
    .not('activated_at', 'is', null);

  if (activatedError) {
    console.error('[portal-stats]', activatedError.message);
    return corsJson({ error: 'Failed to load stats' }, 500);
  }

  let tokenCodes;
  try {
    tokenCodes = await resolveOrgTokenCodes(supabase, provider);
  } catch (err) {
    console.error('[portal-stats]', err.message);
    return corsJson({ error: 'Failed to load stats' }, 500);
  }

  let sessionsCompleted = 0;
  let sessionsInterrupted = 0;
  let sessionsLast7Days = 0;
  const variantBreakdown = {};

  if (tokenCodes.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: sessionRows, error: sessionsError } = await supabase
      .from('sessions')
      .select('variant_id, completion_state, synced_at')
      .in('token_used', tokenCodes);

    if (sessionsError) {
      console.error('[portal-stats]', sessionsError.message);
      return corsJson({ error: 'Failed to load stats' }, 500);
    }

    for (const row of sessionRows ?? []) {
      if (row.completion_state === 'complete') {
        sessionsCompleted += 1;
        const key = row.variant_id ?? 'unknown';
        variantBreakdown[key] = (variantBreakdown[key] ?? 0) + 1;
      } else if (row.completion_state === 'interrupted') {
        sessionsInterrupted += 1;
      }
      if (row.synced_at && row.synced_at >= sevenDaysAgo) {
        sessionsLast7Days += 1;
      }
    }
  }

  const sessionsTotal = sessionsCompleted + sessionsInterrupted;
  const completionRate = sessionsTotal > 0
    ? Math.round((sessionsCompleted / sessionsTotal) * 100)
    : null;

  return corsJson({
    orgName: provider.org_name,
    providerName: provider.name,
    tier: provider.tier,
    teamSize: providerIds.length,
    isAdmin: provider.role === 'admin',
    stats: {
      tokensIssued: issued ?? 0,
      tokensActivated: activated ?? 0,
      sessionsCompleted,
      sessionsInterrupted,
      sessionsLast7Days,
      completionRate,
      variantBreakdown,
    },
  });
};
