import { useEffect, useState } from 'react';
import { BRAND } from '../../brand/tokens';
import { listRecoveryHistory, recoveryHistoryCount } from '../../lib/recoveryHistoryStore';

function formatWhen(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RecoveryHistoryPanel({ compact = false, refreshKey = 0 }) {
  const [entries, setEntries] = useState([]);
  const [expanded, setExpanded] = useState(!compact);
  const count = recoveryHistoryCount();

  useEffect(() => {
    setEntries(listRecoveryHistory(compact ? 3 : 8));
  }, [compact, refreshKey]);

  if (!count) {
    if (compact) {
      return (
        <section className="rounded-sm border border-dashed border-white/[0.08] bg-white/[0.01] p-4 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
            Recovery history
          </p>
          <p className="mt-2 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneDim }}>
            Completed sequences appear here on this device.
          </p>
        </section>
      );
    }
    return null;
  }

  return (
    <section
      className={`rounded-sm border border-white/[0.08] bg-white/[0.02] ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: BRAND.clay }}
        >
          Recovery history
        </h2>
        {compact ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="font-sans text-[9px] uppercase tracking-[0.16em]"
            style={{ color: BRAND.boneDim }}
          >
            {expanded ? 'Less' : 'More'}
          </button>
        ) : null}
      </div>

      {(expanded || !compact) && (
        <>
          <ul className="space-y-2">
            {entries.map((row) => (
              <li
                key={row.sessionId}
                className="flex items-center justify-between gap-3 rounded-sm border border-white/[0.06] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-xs" style={{ color: BRAND.boneMuted }}>
                    {row.variantLabel}
                  </p>
                  <p className="font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
                    {row.durationSeconds}s · {row.completionState}
                    {row.carePlanSteps > 0
                      ? ` · ${row.carePlanCompleted}/${row.carePlanSteps} plan steps`
                      : ''}
                  </p>
                </div>
                <span className="shrink-0 font-sans text-[10px] tabular-nums" style={{ color: BRAND.boneDim }}>
                  {formatWhen(row.completedAt)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-sans text-[10px] leading-relaxed" style={{ color: BRAND.boneDim }}>
            Stored on this device only. Clears when you clear browser data.
          </p>
        </>
      )}
    </section>
  );
}
