import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    .select('id, name, org_name, tier, active')
    .eq('id', userId)
    .maybeSingle();

  if (providerError || !provider || !provider.active) {
    return { error: corsJson({ error: 'unauthorized' }, 401) };
  }

  return { supabase, userId, provider };
}

export function tokenStatus(row) {
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return 'expired';
  }
  if (row.activated_at) {
    return 'activated';
  }
  return 'active';
}

const TOKEN_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateTokenCode() {
  let code = '';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 6; i++) {
    code += TOKEN_CHARS[bytes[i] % TOKEN_CHARS.length];
  }
  return code;
}
