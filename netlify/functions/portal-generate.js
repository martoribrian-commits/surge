import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  tokenStatus,
  generateTokenCode,
} from './lib/portal-auth.js';

const EXPIRY_MAP = {
  '7 days': 7,
  '30 days': 30,
  '90 days': 90,
  'No expiry': null,
};

const USES_MAP = {
  '1': 1,
  '3': 3,
  unlimited: 9999,
};

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

  const expiresIn = body?.expiresIn;
  const uses = body?.uses;

  if (!(expiresIn in EXPIRY_MAP) || !(uses in USES_MAP)) {
    return corsJson({ error: 'Invalid parameters' }, 400);
  }

  const days = EXPIRY_MAP[expiresIn];
  let expires_at = null;
  if (days !== null) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    expires_at = d.toISOString();
  }

  const { supabase, userId } = auth;
  const uses_remaining = USES_MAP[uses];

  let created = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const token = generateTokenCode();
    const { data, error } = await supabase
      .from('clinical_tokens')
      .insert({
        token,
        provider_id: userId,
        expires_at,
        uses_remaining,
      })
      .select('token, issued_at, expires_at, uses_remaining, activated_at')
      .single();

    if (!error && data) {
      created = data;
      break;
    }
    if (error?.code !== '23505') {
      console.error('[portal-generate]', error?.message);
      return corsJson({ error: 'Failed to generate token' }, 500);
    }
  }

  if (!created) {
    return corsJson({ error: 'Failed to generate unique token' }, 500);
  }

  return corsJson({
    token: {
      ...created,
      status: tokenStatus(created),
    },
  });
};
