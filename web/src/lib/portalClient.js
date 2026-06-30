const PORTAL_BASE = import.meta.env.VITE_PORTAL_API_BASE ?? '/api';

function authHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function parseJson(res) {
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error ?? 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function fetchPortalStats(accessToken) {
  const res = await fetch(`${PORTAL_BASE}/portal-stats`, {
    headers: authHeaders(accessToken),
  });
  return parseJson(res);
}

export async function fetchPortalTokens(accessToken) {
  const res = await fetch(`${PORTAL_BASE}/portal-tokens`, {
    headers: authHeaders(accessToken),
  });
  return parseJson(res);
}

export async function fetchPortalSessions(accessToken, { limit = 50 } = {}) {
  const res = await fetch(`${PORTAL_BASE}/portal-sessions?limit=${limit}`, {
    headers: authHeaders(accessToken),
  });
  return parseJson(res);
}

/**
 * @param {string} accessToken
 * @param {{ expiresIn: string, uses: string, patientAlias?: string }} payload
 */
export async function generatePortalToken(accessToken, payload) {
  const res = await fetch(`${PORTAL_BASE}/portal-generate`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function revokePortalToken(accessToken, token) {
  const res = await fetch(`${PORTAL_BASE}/portal-revoke`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ token }),
  });
  return parseJson(res);
}

export function formatPortalDate(iso) {
  if (!iso) return 'No expiry';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function statusLabel(status) {
  if (status === 'expired') return 'Expired';
  if (status === 'revoked') return 'Revoked';
  if (status === 'activated') return 'Activated';
  return 'Active';
}

export const EXPIRY_PRESETS = ['7 days', '30 days', '90 days', 'No expiry'];
export const USES_PRESETS = ['1', '3', 'unlimited'];
