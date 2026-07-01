import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  requireOrgAdmin,
  adminClient,
} from './lib/portal-auth.js';

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  const { supabase, userId, provider } = auth;

  if (request.method === 'GET') {
    const { data: userData } = await adminClient().auth.admin.getUserById(userId);
    const email = userData?.user?.email ?? null;

    return corsJson({
      profile: {
        name: provider.name,
        orgName: provider.org_name,
        tier: provider.tier,
        role: provider.role,
        email,
        isAdmin: provider.role === 'admin',
      },
    });
  }

  if (request.method === 'PATCH') {
    let body;
    try {
      body = await request.json();
    } catch {
      return corsJson({ error: 'Invalid JSON' }, 400);
    }

    const name = body?.name?.trim();
    const orgName = body?.orgName?.trim();

    if (name && name.length > 64) {
      return corsJson({ error: 'Name too long' }, 400);
    }
    if (orgName && orgName.length > 120) {
      return corsJson({ error: 'Organization name too long' }, 400);
    }

    const providerUpdates = {};
    if (name) providerUpdates.name = name;
    if (orgName) {
      const adminCheck = requireOrgAdmin(provider);
      if (adminCheck) return adminCheck.error;
      providerUpdates.org_name = orgName;

      if (provider.org_id) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({ name: orgName })
          .eq('id', provider.org_id);

        if (orgError) {
          console.error('[portal-settings] org update:', orgError.message);
          return corsJson({ error: 'Failed to update organization' }, 500);
        }
      }
    }

    if (!Object.keys(providerUpdates).length) {
      return corsJson({ error: 'No changes provided' }, 400);
    }

    const { data: updated, error } = await supabase
      .from('providers')
      .update(providerUpdates)
      .eq('id', userId)
      .select('id, name, org_name, tier, role')
      .single();

    if (error) {
      console.error('[portal-settings] provider update:', error.message);
      return corsJson({ error: 'Failed to update profile' }, 500);
    }

    return corsJson({
      ok: true,
      profile: {
        name: updated.name,
        orgName: updated.org_name,
        tier: updated.tier,
        role: updated.role,
        isAdmin: updated.role === 'admin',
      },
    });
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return corsJson({ error: 'Invalid JSON' }, 400);
    }

    const action = body?.action;
    if (action !== 'changePassword') {
      return corsJson({ error: 'Unknown action' }, 400);
    }

    const currentPassword = String(body?.currentPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');

    if (!currentPassword || newPassword.length < 8) {
      return corsJson({ error: 'Password must be at least 8 characters' }, 400);
    }

    const { data: userData } = await adminClient().auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) {
      return corsJson({ error: 'Email not found on account' }, 400);
    }

    const { error: signInError } = await adminClient().auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      return corsJson({ error: 'Current password is incorrect' }, 401);
    }

    const { error: updateError } = await adminClient().auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('[portal-settings] password:', updateError.message);
      return corsJson({ error: 'Failed to update password' }, 500);
    }

    return corsJson({ ok: true });
  }

  return corsJson({ error: 'Method not allowed' }, 405);
};
