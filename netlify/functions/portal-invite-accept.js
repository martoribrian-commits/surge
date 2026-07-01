import {
  handleOptions,
  corsJson,
  adminClient,
} from './lib/portal-auth.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Provisions a provider row when an invited clinician signs in for the first time.
 */
export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'POST') {
    return corsJson({ error: 'Method not allowed' }, 405);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsJson({ error: 'unauthorized' }, 401);
  }

  const jwt = authHeader.slice(7);
  const supabase = adminClient();

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return corsJson({ error: 'unauthorized' }, 401);
  }

  const user = userData.user;
  const userId = user.id;
  const email = user.email?.toLowerCase();

  if (!email) {
    return corsJson({ error: 'Email required on account' }, 400);
  }

  const { data: existingProvider } = await supabase
    .from('providers')
    .select('id, name, org_name, org_id, tier, active, role')
    .eq('id', userId)
    .maybeSingle();

  if (existingProvider?.active) {
    return corsJson({
      ok: true,
      alreadyProvisioned: true,
      provider: existingProvider,
    });
  }

  const now = new Date().toISOString();

  const { data: invite, error: inviteError } = await supabase
    .from('org_invites')
    .select('id, org_id, email, role, expires_at')
    .eq('email', email)
    .eq('status', 'pending')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inviteError) {
    console.error('[portal-invite-accept]', inviteError.message);
    return corsJson({ error: 'Failed to check invite' }, 500);
  }

  if (!invite) {
    return corsJson({ error: 'No pending invite for this email' }, 404);
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, tier')
    .eq('id', invite.org_id)
    .maybeSingle();

  if (orgError || !org) {
    console.error('[portal-invite-accept] org:', orgError?.message);
    return corsJson({ error: 'Organization not found' }, 500);
  }

  const displayName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || email.split('@')[0];

  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .upsert({
      id: userId,
      name: displayName,
      org_name: org.name,
      org_id: org.id,
      tier: org.tier,
      role: invite.role,
      active: true,
    }, { onConflict: 'id' })
    .select('id, name, org_name, org_id, tier, active, role')
    .single();

  if (providerError) {
    console.error('[portal-invite-accept] provider:', providerError.message);
    return corsJson({ error: 'Failed to provision account' }, 500);
  }

  await supabase
    .from('org_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id);

  return corsJson({
    ok: true,
    provider,
  });
};
