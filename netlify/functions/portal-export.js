import {
  handleOptions,
  verifyPortalRequest,
  resolveOrgTokenCodes,
  parseSessionFilters,
  applySessionFilters,
} from './lib/portal-auth.js';

const CSV_HEADERS = [
  'synced_at',
  'token',
  'patient_alias',
  'variant_id',
  'duration_seconds',
  'completion_state',
  'client_session_id',
];

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows) {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.synced_at,
        row.token_used,
        row.clinical_tokens?.patient_alias ?? '',
        row.variant_id ?? '',
        row.duration,
        row.completion_state,
        row.client_session_id ?? '',
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n');
}

export default async (request) => {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = await verifyPortalRequest(request);
  if (auth.error) return auth.error;

  const { supabase, provider } = auth;
  const url = new URL(request.url);
  const filters = parseSessionFilters(url);

  if (filters.error) {
    return new Response(JSON.stringify({ error: filters.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let tokenCodes;
  try {
    tokenCodes = await resolveOrgTokenCodes(supabase, provider);
  } catch (err) {
    console.error('[portal-export]', err.message);
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!tokenCodes.length) {
    const empty = toCsv([]);
    return new Response(empty, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="surge-sessions.csv"',
      },
    });
  }

  if (filters.token && !tokenCodes.includes(filters.token)) {
    const empty = toCsv([]);
    return new Response(empty, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="surge-sessions.csv"',
      },
    });
  }

  const exportLimit = Math.min(5000, Math.max(1, filters.limit));

  let query = supabase
    .from('sessions')
    .select('token_used, duration, completion_state, synced_at, variant_id, client_session_id, clinical_tokens(patient_alias)')
    .in('token_used', tokenCodes)
    .order('synced_at', { ascending: false })
    .limit(exportLimit);

  query = applySessionFilters(query, filters);

  const { data: rows, error } = await query;

  if (error) {
    console.error('[portal-export]', error.message);
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const csv = toCsv(rows ?? []);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="surge-sessions-${stamp}.csv"`,
    },
  });
};
