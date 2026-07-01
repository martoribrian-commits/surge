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

function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
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

export async function fetchPortalTeam(accessToken) {
  const res = await fetch(`${PORTAL_BASE}/portal-team`, {
    headers: authHeaders(accessToken),
  });
  return parseJson(res);
}

/**
 * @param {string} accessToken
 * @param {{ limit?: number, variant?: string, completion?: string, from?: string, to?: string, token?: string }} filters
 */
export async function fetchPortalSessions(accessToken, filters = {}) {
  const res = await fetch(
    `${PORTAL_BASE}/portal-sessions${buildQuery({ limit: 50, offset: 0, ...filters })}`,
    { headers: authHeaders(accessToken) },
  );
  return parseJson(res);
}

/**
 * @param {string} accessToken
 * @param {{ limit?: number, variant?: string, completion?: string, from?: string, to?: string, token?: string }} filters
 */
export async function exportPortalSessions(accessToken, filters = {}) {
  const res = await fetch(
    `${PORTAL_BASE}/portal-export${buildQuery({ limit: 5000, ...filters })}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data?.error ?? 'Export failed');
    err.status = res.status;
    throw err;
  }
  return res.blob();
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

export const COMPLETION_FILTERS = [
  { value: '', label: 'All outcomes' },
  { value: 'complete', label: 'Complete' },
  { value: 'interrupted', label: 'Interrupted' },
];

export const VARIANT_FILTER_OPTIONS = [
  { value: '', label: 'All sequences' },
  { value: 'instant-reset', label: 'Instant Reset' },
  { value: 'flash-freeze', label: 'Flash Freeze' },
  { value: 'orienting-anchor', label: 'Orienting Anchor' },
  { value: 'nova-gate', label: 'Nova Gate' },
  { value: 'still-thaw', label: 'Still Thaw' },
  { value: 'coherence-ripple', label: 'Coherence Ripple' },
  { value: 'heavy-tide', label: 'Heavy Tide' },
  { value: 'vagal-downshift', label: 'Vagal Downshift' },
  { value: 'static-field', label: 'Static Field' },
  { value: 'deep-anchor', label: 'Deep Anchor' },
];
