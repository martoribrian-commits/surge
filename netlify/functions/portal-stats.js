import { handleOptions, corsJson, verifyPortalRequest } from './lib/portal-auth.js';

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'GET') {
    return corsJson({ error: 'Method not allowed' }, 405);
  }

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  const { supabase, userId, provider } = auth;

  const { count: issued, error: issuedError } = await supabase
    .from('clinical_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', userId);

  if (issuedError) {
    console.error('[portal-stats]', issuedError.message);
    return corsJson({ error: 'Failed to load stats' }, 500);
  }

  const { count: activated, error: activatedError } = await supabase
    .from('clinical_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', userId)
    .not('activated_at', 'is', null);

  if (activatedError) {
    console.error('[portal-stats]', activatedError.message);
    return corsJson({ error: 'Failed to load stats' }, 500);
  }

  const { data: tokenRows } = await supabase
    .from('clinical_tokens')
    .select('token')
    .eq('provider_id', userId);

  const tokenCodes = (tokenRows ?? []).map((r) => r.token);

  let sessionsCompleted = 0;
  if (tokenCodes.length > 0) {
    const { count, error: sessionsError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .in('token_used', tokenCodes)
      .eq('completion_state', 'complete');

    if (sessionsError) {
      console.error('[portal-stats]', sessionsError.message);
      return corsJson({ error: 'Failed to load stats' }, 500);
    }
    sessionsCompleted = count ?? 0;
  }

  return corsJson({
    orgName: provider.org_name,
    providerName: provider.name,
    tier: provider.tier,
    stats: {
      tokensIssued: issued ?? 0,
      tokensActivated: activated ?? 0,
      sessionsCompleted,
    },
  });
};
