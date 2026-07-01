import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
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

  const { supabase, userId, provider } = auth;
  const providerIds = await resolveOrgProviderIds(supabase, provider);

  const { data: rows, error } = await supabase
    .from('providers')
    .select('id, name, org_name, tier, active, role')
    .in('id', providerIds)
    .order('name', { ascending: true });

  if (error) {
    console.error('[portal-team]', error.message);
    return corsJson({ error: 'Failed to load team' }, 500);
  }

  const members = (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isSelf: row.id === userId,
    active: row.active,
    role: row.role ?? 'member',
  }));

  return corsJson({
    orgName: provider.org_name,
    members,
    isAdmin: provider.role === 'admin',
  });
};
