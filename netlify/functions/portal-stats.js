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
  const variantBreakdown = {};

  if (tokenCodes.length > 0) {
    const { data: sessionRows, error: sessionsError } = await supabase
      .from('sessions')
      .select('variant_id, completion_state')
      .in('token_used', tokenCodes)
      .eq('completion_state', 'complete');

    if (sessionsError) {
      console.error('[portal-stats]', sessionsError.message);
      return corsJson({ error: 'Failed to load stats' }, 500);
    }

    sessionsCompleted = sessionRows?.length ?? 0;
    for (const row of sessionRows ?? []) {
      const key = row.variant_id ?? 'unknown';
      variantBreakdown[key] = (variantBreakdown[key] ?? 0) + 1;
    }
  }

  return corsJson({
    orgName: provider.org_name,
    providerName: provider.name,
    tier: provider.tier,
    teamSize: providerIds.length,
    stats: {
      tokensIssued: issued ?? 0,
      tokensActivated: activated ?? 0,
      sessionsCompleted,
      variantBreakdown,
    },
  });
};
