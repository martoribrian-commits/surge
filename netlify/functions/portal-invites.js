import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  requireOrgAdmin,
  normalizeEmail,
  isValidInviteEmail,
  adminClient,
} from './lib/portal-auth.js';

const INVITE_TTL_DAYS = 7;

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  const { supabase, userId, provider } = auth;

  if (request.method === 'GET') {
    const adminCheck = requireOrgAdmin(provider);
    if (adminCheck) return adminCheck.error;

    if (!provider.org_id) {
      return corsJson({ invites: [] });
    }

    const { data: rows, error } = await supabase
      .from('org_invites')
      .select('id, email, role, status, created_at, expires_at')
      .eq('org_id', provider.org_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[portal-invites] list:', error.message);
      return corsJson({ error: 'Failed to load invites' }, 500);
    }

    const invites = (rows ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }));

    return corsJson({ invites, isAdmin: true });
  }

  if (request.method === 'POST') {
    const adminCheck = requireOrgAdmin(provider);
    if (adminCheck) return adminCheck.error;

    if (!provider.org_id) {
      return corsJson({ error: 'Organization required for invites' }, 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsJson({ error: 'Invalid JSON' }, 400);
    }

    const email = normalizeEmail(body?.email);
    const role = body?.role === 'admin' ? 'admin' : 'member';

    if (!isValidInviteEmail(email)) {
      return corsJson({ error: 'Valid email required' }, 400);
    }

    // Check if email already belongs to an org member
    const { data: authUsers } = await adminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingMember = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (existingMember) {
      const { data: memberProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('id', existingMember.id)
        .eq('org_id', provider.org_id)
        .maybeSingle();

      if (memberProvider) {
        return corsJson({ error: 'This clinician is already on your team' }, 409);
      }
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400000).toISOString();

    const { data: invite, error: inviteError } = await supabase
      .from('org_invites')
      .insert({
        org_id: provider.org_id,
        email,
        role,
        invited_by: userId,
        expires_at: expiresAt,
      })
      .select('id, email, role, status, created_at, expires_at')
      .single();

    if (inviteError) {
      if (inviteError.code === '23505') {
        return corsJson({ error: 'Invite already pending for this email' }, 409);
      }
      console.error('[portal-invites] insert:', inviteError.message);
      return corsJson({ error: 'Failed to create invite' }, 500);
    }

    const redirectTo = process.env.PORTAL_INVITE_REDIRECT_URL
      || `${process.env.URL || 'https://surge.app'}/portal`;

    const { error: authInviteError } = await adminClient().auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        org_id: provider.org_id,
        invite_role: role,
      },
    });

    if (authInviteError) {
      await supabase.from('org_invites').update({ status: 'revoked' }).eq('id', invite.id);
      console.error('[portal-invites] auth invite:', authInviteError.message);
      return corsJson({ error: 'Failed to send invite email' }, 500);
    }

    return corsJson({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        createdAt: invite.created_at,
        expiresAt: invite.expires_at,
      },
    });
  }

  if (request.method === 'DELETE') {
    const adminCheck = requireOrgAdmin(provider);
    if (adminCheck) return adminCheck.error;

    let body;
    try {
      body = await request.json();
    } catch {
      return corsJson({ error: 'Invalid JSON' }, 400);
    }

    const inviteId = body?.id?.trim();
    if (!inviteId) {
      return corsJson({ error: 'Invite id required' }, 400);
    }

    const { data, error } = await supabase
      .from('org_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .eq('org_id', provider.org_id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[portal-invites] revoke:', error.message);
      return corsJson({ error: 'Failed to revoke invite' }, 500);
    }

    if (!data) {
      return corsJson({ error: 'Invite not found' }, 404);
    }

    return corsJson({ ok: true });
  }

  return corsJson({ error: 'Method not allowed' }, 405);
};
