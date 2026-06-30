import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TOKEN_PATTERN = /^[A-Za-z0-9]{6}$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const raw = body?.token;
  const checkOnly = body?.check === true;
  if (typeof raw !== 'string') {
    return json({ valid: false });
  }

  const token = raw.toUpperCase().trim();
  if (!TOKEN_PATTERN.test(token)) {
    return json({ valid: false });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: row, error: fetchError } = await supabase
      .from('clinical_tokens')
      .select('token, uses_remaining, expires_at, activated_at, provider_id, providers(active)')
      .eq('token', token)
      .maybeSingle();

    if (fetchError || !row) {
      return json({ valid: false });
    }

    const provider = row.providers;
    if (provider && provider.active === false) {
      return json({ valid: false });
    }

    if (row.uses_remaining <= 0) {
      return json({ valid: false });
    }

    if (row.expires_at && new Date(row.expires_at) <= new Date()) {
      return json({ valid: false });
    }

    if (checkOnly) {
      return json({ valid: true });
    }

    const updates = { uses_remaining: row.uses_remaining - 1 };
    if (!row.activated_at) {
      updates.activated_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('clinical_tokens')
      .update(updates)
      .eq('token', token)
      .eq('uses_remaining', row.uses_remaining)
      .select('token')
      .maybeSingle();

    if (updateError || !updated) {
      return json({ valid: false });
    }

    return json({ valid: true });
  } catch (err) {
    console.error('[validate-token]', err);
    return json({ valid: false }, 500);
  }
};
