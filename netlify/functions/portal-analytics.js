import {
  handleOptions,
  corsJson,
  verifyPortalRequest,
  resolveOrgTokenCodes,
} from './lib/portal-auth.js';

function dateKey(iso) {
  return iso.slice(0, 10);
}

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'GET') {
    return corsJson({ error: 'Method not allowed' }, 405);
  }

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  const { supabase, provider } = auth;
  const url = new URL(request.url);
  const days = Math.min(90, Math.max(7, Number(url.searchParams.get('days')) || 30));

  let tokenCodes;
  try {
    tokenCodes = await resolveOrgTokenCodes(supabase, provider);
  } catch (err) {
    console.error('[portal-analytics]', err.message);
    return corsJson({ error: 'Failed to load analytics' }, 500);
  }

  const buckets = {};
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    buckets[dateKey(d.toISOString())] = { date: dateKey(d.toISOString()), completed: 0, interrupted: 0 };
  }

  if (tokenCodes.length) {
    const fromIso = start.toISOString();
    const { data: rows, error } = await supabase
      .from('sessions')
      .select('completion_state, synced_at')
      .in('token_used', tokenCodes)
      .gte('synced_at', fromIso);

    if (error) {
      console.error('[portal-analytics]', error.message);
      return corsJson({ error: 'Failed to load analytics' }, 500);
    }

    for (const row of rows ?? []) {
      const key = dateKey(row.synced_at);
      if (!buckets[key]) continue;
      if (row.completion_state === 'complete') buckets[key].completed += 1;
      else if (row.completion_state === 'interrupted') buckets[key].interrupted += 1;
    }
  }

  return corsJson({
    days,
    series: Object.values(buckets),
  });
};
