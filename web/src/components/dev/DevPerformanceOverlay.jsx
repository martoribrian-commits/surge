import { useEffect, useState } from 'react';
import {
  getTimeToInteractiveMs,
  markAppMount,
  PERF_EVENT_ANCHOR_READY,
} from '../../lib/performanceMetrics';

/**
 * Development-only overlay — measures time-to-interactive (TTI)
 * from initial app mount to tactile anchor readiness.
 */
export default function DevPerformanceOverlay() {
  const [ttiMs, setTtiMs] = useState(null);
  const [interactionMode, setInteractionMode] = useState(null);

  useEffect(() => {
    markAppMount();

    const onAnchorReady = (event) => {
      const detail = event?.detail ?? {};
      setTtiMs(detail.ttiMs ?? getTimeToInteractiveMs());
      setInteractionMode(detail.interactionMode ?? null);

      if (import.meta.env.DEV) {
        console.info(
          `[Surge Dev] TTI — tactile anchor ready in ${Math.round(detail.ttiMs ?? 0)}ms`,
          detail.interactionMode ? `(${detail.interactionMode})` : '',
        );
      }
    };

    window.addEventListener(PERF_EVENT_ANCHOR_READY, onAnchorReady);
    return () => window.removeEventListener(PERF_EVENT_ANCHOR_READY, onAnchorReady);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-[9999] rounded border border-white/10 bg-black/80 px-3 py-2 font-mono text-[10px] text-white/70 backdrop-blur-sm"
      aria-hidden
    >
      <p className="uppercase tracking-widest text-white/40">Dev perf</p>
      <p className="mt-1">
        TTI:{' '}
        {ttiMs != null ? (
          <span className="text-[#B6502E]">{Math.round(ttiMs)}ms</span>
        ) : (
          <span className="text-white/35">awaiting anchor…</span>
        )}
      </p>
      {interactionMode ? (
        <p className="text-white/45">mode: {interactionMode}</p>
      ) : null}
    </div>
  );
}
