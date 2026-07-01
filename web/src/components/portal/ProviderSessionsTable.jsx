import { BRAND } from '../../brand/tokens';
import { VARIANT_LABELS } from '../../lib/craneCarePlanUtils';

export default function ProviderSessionsTable({ sessions, filtered = false, onSelectSession }) {
  if (!sessions.length) {
    return (
      <p className="py-8 text-center font-sans text-sm" style={{ color: BRAND.boneDim }}>
        {filtered
          ? 'No sessions match these filters.'
          : 'No sessions yet. Sessions appear when patients use tokens during a sequence.'}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
            <th className="px-3 py-3 font-normal">When</th>
            <th className="px-3 py-3 font-normal">Alias</th>
            <th className="px-3 py-3 font-normal">Sequence</th>
            <th className="px-3 py-3 font-normal">Token</th>
            <th className="px-3 py-3 font-normal">Duration</th>
            <th className="px-3 py-3 font-normal">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-white/[0.05] last:border-0 ${onSelectSession ? 'cursor-pointer transition-colors hover:bg-white/[0.03]' : ''}`}
              onClick={onSelectSession ? () => onSelectSession(row.id) : undefined}
              onKeyDown={
                onSelectSession
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSession(row.id);
                      }
                    }
                  : undefined
              }
              tabIndex={onSelectSession ? 0 : undefined}
              role={onSelectSession ? 'button' : undefined}
            >
              <td className="px-3 py-3 text-white/45">
                {new Date(row.syncedAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="px-3 py-3 text-white/45">{row.patientAlias ?? '—'}</td>
              <td className="px-3 py-3 text-white/55">
                {row.variantId
                  ? (VARIANT_LABELS[row.variantId] ?? (row.variantId.startsWith('custom-') ? 'Custom' : row.variantId))
                  : '—'}
              </td>
              <td className="px-3 py-3 font-mono text-[13px] tracking-[0.2em]">{row.token}</td>
              <td className="px-3 py-3 tabular-nums text-white/45">{row.durationSeconds}s</td>
              <td className="px-3 py-3">
                <span
                  className="inline-block rounded-sm px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.14em]"
                  style={{
                    color: row.completionState === 'complete' ? '#8FB596' : BRAND.boneDim,
                    background: row.completionState === 'complete' ? 'rgba(143,181,150,0.12)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {row.completionState}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
