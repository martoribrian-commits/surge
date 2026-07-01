import { handleOptions, corsJson, verifyPortalRequest, resolveOrgProviderIds } from './lib/portal-auth.js';

const TOKEN_PATTERN = /^[A-Z0-9]{6}$/;

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'POST') {
    return corsJson({ error: 'Method not allowed' }, 405);
  }

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return corsJson({ error: 'Invalid JSON' }, 400);
  }

  const token = String(body?.token ?? '')
    .toUpperCase()
    .trim();
  if (!TOKEN_PATTERN.test(token)) {
    return corsJson({ error: 'Invalid token' }, 400);
  }

  const { supabase, provider } = auth;
  const providerIds = await resolveOrgProviderIds(supabase, provider);

  const { data, error } = await supabase
    .from('clinical_tokens')
    .update({ uses_remaining: 0 })
    .eq('token', token)
    .in('provider_id', providerIds)
    .select('token')
    .maybeSingle();

  if (error) {
    console.error('[portal-revoke]', error.message);
    return corsJson({ error: 'Failed to revoke token' }, 500);
  }

  if (!data) {
    return corsJson({ error: 'Token not found' }, 404);
  }

  return corsJson({ ok: true, token });
};
