import { useEffect, useState } from 'react';
import { BRAND } from '../../brand/tokens';
import { VARIANT_LABELS } from '../../lib/craneCarePlanUtils';

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.06] py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
        {label}
      </span>
      <div className="font-sans text-sm" style={{ color: BRAND.boneMuted }}>
        {children}
      </div>
    </div>
  );
}

export default function ProviderSessionDetail({ sessionId, accessToken, onClose, fetchDetail }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!sessionId || !accessToken) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchDetail(accessToken, sessionId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load session detail.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, accessToken, fetchDetail]);

  if (!sessionId) return null;

  const session = detail?.session;
  const variantLabel = session?.variantId
    ? (VARIANT_LABELS[session.variantId] ?? (session.variantId.startsWith('custom-') ? 'Custom sequence' : session.variantId))
    : '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-white/[0.12] bg-[#0c0a09] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p
              id="session-detail-title"
              className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: BRAND.clay }}
            >
              Session detail
            </p>
            {session ? (
              <p className="mt-1 font-sans text-xs" style={{ color: BRAND.boneDim }}>
                {new Date(session.syncedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-[10px] uppercase tracking-[0.16em]"
            style={{ color: BRAND.boneDim }}
          >
            Close
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center font-sans text-xs" style={{ color: BRAND.boneDim }}>
            Loading…
          </p>
        ) : null}

        {error ? (
          <p className="py-4 font-sans text-xs" style={{ color: BRAND.clay }}>
            {error}
          </p>
        ) : null}

        {session && !loading ? (
          <>
            <DetailRow label="Sequence">{variantLabel}</DetailRow>
            <DetailRow label="Token">
              <span className="font-mono tracking-[0.2em]">{session.token}</span>
            </DetailRow>
            <DetailRow label="Duration">{session.durationSeconds}s</DetailRow>
            <DetailRow label="Outcome">
              <span
                className="inline-block rounded-sm px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.14em]"
                style={{
                  color: session.completionState === 'complete' ? '#8FB596' : BRAND.boneDim,
                  background: session.completionState === 'complete' ? 'rgba(143,181,150,0.12)' : 'rgba(255,255,255,0.04)',
                }}
              >
                {session.completionState}
              </span>
            </DetailRow>

            {detail.telemetry ? (
              <div className="mt-4 rounded-sm border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="mb-2 font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.clay }}>
                  Telemetry
                </p>
                <p className="font-sans text-xs" style={{ color: BRAND.boneMuted }}>
                  Full cycle: {detail.telemetry.completedFullCycle ? 'Yes' : 'No'}
                </p>
                <p className="mt-1 font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
                  Recorded {new Date(detail.telemetry.recordedAt).toLocaleString()}
                </p>
              </div>
            ) : session.clientSessionId ? (
              <p className="mt-4 font-sans text-[11px]" style={{ color: BRAND.boneDim }}>
                No linked telemetry for this session yet.
              </p>
            ) : null}

            {detail.vectorSnapshots?.length ? (
              <div className="mt-4">
                <p className="mb-2 font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.clay }}>
                  Somatic vectors
                </p>
                <ul className="space-y-2">
                  {detail.vectorSnapshots.map((snap) => (
                    <li
                      key={snap.id}
                      className="rounded-sm border border-white/[0.06] px-3 py-2 font-sans text-xs leading-relaxed"
                      style={{ color: BRAND.boneMuted }}
                    >
                      {snap.summary}
                      <span className="mt-1 block text-[10px]" style={{ color: BRAND.boneDim }}>
                        {new Date(snap.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
