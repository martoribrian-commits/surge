import { useEffect, useState } from 'react';
import { BRAND } from '../../brand/tokens';
import { fetchPortalCaseload, statusLabel } from '../../lib/portalClient';

export default function ProviderCaseloadPanel({ accessToken, onFilterToken }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetchPortalCaseload(accessToken)
      .then((data) => setRows(data.caseload ?? []))
      .catch(() => setError('Could not load caseload.'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <p className="py-12 text-center font-sans text-xs" style={{ color: BRAND.boneDim }}>
        Loading caseload…
      </p>
    );
  }

  if (error) {
    return <p className="py-8 font-sans text-xs" style={{ color: BRAND.clay }}>{error}</p>;
  }

  if (!rows.length) {
    return (
      <p className="py-12 text-center font-sans text-sm" style={{ color: BRAND.boneDim }}>
        No tokens issued yet. Generate tokens with optional patient aliases to build a caseload view.
      </p>
    );
  }

  const withSessions = rows.filter((r) => r.sessionCount > 0).length;

  return (
    <section>
      <p className="mb-6 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
        {rows.length} token{rows.length === 1 ? '' : 's'} · {withSessions} with sessions
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
              <th className="px-3 py-3 font-normal">Patient / label</th>
              <th className="px-3 py-3 font-normal">Token</th>
              <th className="px-3 py-3 font-normal">Sessions</th>
              <th className="px-3 py-3 font-normal">Completed</th>
              <th className="px-3 py-3 font-normal">Last session</th>
              <th className="px-3 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.token} className="border-b border-white/[0.05] last:border-0">
                <td className="px-3 py-3" style={{ color: BRAND.boneMuted }}>
                  {row.displayName}
                  {!row.patientAlias ? (
                    <span className="ml-1 font-sans text-[9px]" style={{ color: BRAND.boneDim }}>
                      (no alias)
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 font-mono text-[13px] tracking-[0.2em]">
                  {onFilterToken ? (
                    <button
                      type="button"
                      onClick={() => onFilterToken(row.token)}
                      className="underline decoration-white/20 underline-offset-4 hover:text-[#B6502E]"
                    >
                      {row.token}
                    </button>
                  ) : (
                    row.token
                  )}
                </td>
                <td className="px-3 py-3 tabular-nums text-white/45">{row.sessionCount}</td>
                <td className="px-3 py-3 tabular-nums text-white/45">
                  {row.completedCount}
                  {row.interruptedCount > 0 ? (
                    <span className="text-[10px]" style={{ color: BRAND.boneDim }}>
                      {' '}
                      · {row.interruptedCount} int.
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-white/45">
                  {row.lastSessionAt
                    ? new Date(row.lastSessionAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-3 py-3 text-white/45">{statusLabel(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
