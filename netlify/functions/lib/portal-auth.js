import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function corsJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export function handleOptions(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  return null;
}

export function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Verify JWT and return provider row where providers.id = auth user id. */
export async function verifyPortalRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: corsJson({ error: 'unauthorized' }, 401) };
  }

  const jwt = authHeader.slice(7);
  const supabase = adminClient();

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return { error: corsJson({ error: 'unauthorized' }, 401) };
  }

  const userId = userData.user.id;

  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('id, name, org_name, org_id, tier, active, role')
    .eq('id', userId)
    .maybeSingle();

  if (providerError || !provider || !provider.active) {
    return { error: corsJson({ error: 'unauthorized' }, 401) };
  }

  return { supabase, userId, provider };
}

/** All provider ids in the same organization (falls back to solo provider). */
export async function resolveOrgProviderIds(supabase, provider) {
  if (!provider.org_id) {
    return [provider.id];
  }

  const { data: rows, error } = await supabase
    .from('providers')
    .select('id')
    .eq('org_id', provider.org_id)
    .eq('active', true);

  if (error || !rows?.length) {
    return [provider.id];
  }

  return rows.map((r) => r.id);
}

/** Token codes issued by any clinician in the org. */
export async function resolveOrgTokenCodes(supabase, provider) {
  const providerIds = await resolveOrgProviderIds(supabase, provider);

  const { data: rows, error } = await supabase
    .from('clinical_tokens')
    .select('token')
    .in('provider_id', providerIds);

  if (error) {
    throw error;
  }

  return (rows ?? []).map((r) => r.token);
}

export function parseSessionFilters(url) {
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const variant = url.searchParams.get('variant')?.trim() || null;
  const completion = url.searchParams.get('completion')?.trim() || null;
  const token = url.searchParams.get('token')?.trim()?.toUpperCase() || null;
  const from = url.searchParams.get('from')?.trim() || null;
  const to = url.searchParams.get('to')?.trim() || null;

  if (completion && !['complete', 'interrupted'].includes(completion)) {
    return { error: 'Invalid completion filter' };
  }

  return { limit, offset, variant, completion, token, from, to };
}

export function applySessionFilters(query, filters) {
  let q = query;

  if (filters.variant) {
    q = q.eq('variant_id', filters.variant);
  }
  if (filters.completion) {
    q = q.eq('completion_state', filters.completion);
  }
  if (filters.token) {
    q = q.eq('token_used', filters.token);
  }
  if (filters.from) {
    q = q.gte('synced_at', `${filters.from}T00:00:00.000Z`);
  }
  if (filters.to) {
    q = q.lte('synced_at', `${filters.to}T23:59:59.999Z`);
  }

  return q;
}

export function tokenStatus(row) {
  if (row.uses_remaining <= 0) {
    return 'revoked';
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return 'expired';
  }
  if (row.activated_at) {
    return 'activated';
  }
  return 'active';
}

const TOKEN_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function requireOrgAdmin(provider) {
  if (provider.role !== 'admin') {
    return { error: corsJson({ error: 'Admin access required' }, 403) };
  }
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function isValidInviteEmail(email) {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function generateTokenCode() {
  let code = '';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 6; i++) {
    code += TOKEN_CHARS[bytes[i] % TOKEN_CHARS.length];
  }
  return code;
}
