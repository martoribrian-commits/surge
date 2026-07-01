import { useEffect, useMemo, useState } from 'react';
import { BRAND } from '../../brand/tokens';
import { fetchPortalAnalytics } from '../../lib/portalClient';

export default function ProviderAnalyticsChart({ accessToken, days = 30 }) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetchPortalAnalytics(accessToken, days)
      .then((data) => setSeries(data.series ?? []))
      .catch(() => setSeries([]))
      .finally(() => setLoading(false));
  }, [accessToken, days]);

  const maxValue = useMemo(() => {
    let max = 1;
    for (const row of series) {
      max = Math.max(max, row.completed + row.interrupted);
    }
    return max;
  }, [series]);

  const totals = useMemo(() => {
    return series.reduce(
      (acc, row) => ({
        completed: acc.completed + row.completed,
        interrupted: acc.interrupted + row.interrupted,
      }),
      { completed: 0, interrupted: 0 },
    );
  }, [series]);

  if (loading) {
    return (
      <div className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="font-sans text-xs" style={{ color: BRAND.boneDim }}>
          Loading session trends…
        </p>
      </div>
    );
  }

  const recent = series.slice(-14);

  return (
    <section className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
          Session trends
        </h2>
        <span className="font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
          Last {days} days · {totals.completed} complete · {totals.interrupted} interrupted
        </span>
      </div>

      <div className="flex h-32 items-end gap-1">
        {recent.map((row) => {
          const total = row.completed + row.interrupted;
          const heightPct = total ? (total / maxValue) * 100 : 4;
          const completedPct = total ? (row.completed / total) * 100 : 100;
          return (
            <div key={row.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="relative w-full overflow-hidden rounded-sm bg-white/[0.04]"
                style={{ height: `${Math.max(4, heightPct)}%`, minHeight: total ? '8px' : '2px' }}
                title={`${row.date}: ${row.completed} complete, ${row.interrupted} interrupted`}
              >
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: `${completedPct}%`,
                    background: 'rgba(143,181,150,0.75)',
                  }}
                />
                {row.interrupted > 0 ? (
                  <div
                    className="absolute inset-x-0 top-0"
                    style={{
                      height: `${100 - completedPct}%`,
                      background: 'rgba(255,255,255,0.18)',
                    }}
                  />
                ) : null}
              </div>
              <span className="font-sans text-[8px] tabular-nums" style={{ color: BRAND.boneDim }}>
                {row.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-4 font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'rgba(143,181,150,0.75)' }} />
          Complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-white/20" />
          Interrupted
        </span>
      </div>
    </section>
  );
}
