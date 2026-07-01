import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  tokenStatus,
  resolveOrgProviderIds,
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

  const { data: rows, error } = await supabase
    .from('clinical_tokens')
    .select('token, patient_alias, issued_at, expires_at, uses_remaining, activated_at, provider_id')
    .in('provider_id', providerIds)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('[portal-tokens]', error.message);
    return corsJson({ error: 'Failed to load tokens' }, 500);
  }

  const { data: issuers } = await supabase
    .from('providers')
    .select('id, name')
    .in('id', providerIds);

  const issuerById = Object.fromEntries((issuers ?? []).map((p) => [p.id, p.name]));

  const tokens = (rows ?? []).map((row) => ({
    token: row.token,
    patient_alias: row.patient_alias,
    issued_at: row.issued_at,
    expires_at: row.expires_at,
    uses_remaining: row.uses_remaining,
    activated_at: row.activated_at,
    issuerName: issuerById[row.provider_id] ?? 'Clinician',
    isOwn: row.provider_id === provider.id,
    status: tokenStatus(row),
  }));

  return corsJson({ tokens });
};
