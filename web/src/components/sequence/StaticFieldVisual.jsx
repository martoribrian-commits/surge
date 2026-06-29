import { useEffect, useRef, useState } from 'react';
import FieldCanvas from './shared/FieldCanvas';
import { curveAtElapsed } from '../../lib/surgeCurve';

/**
 * Static Field — original full-screen canvas engine + pink-noise sonic field.
 */
export default function StaticFieldVisual({
  elapsedSeconds,
  isEngaged,
  isPaused,
  isComplete = false,
  completeFade = 0,
  onRipple,
}) {
  const [engageBurst, setEngageBurst] = useState(0);
  const [ripples, setRipples] = useState([]);
  const clockStartRef = useRef(performance.now() / 1000);
  const wasEngagedRef = useRef(false);

  useEffect(() => {
    if (isEngaged && !wasEngagedRef.current) {
      setEngageBurst(1);
      const t = window.setTimeout(() => setEngageBurst(0), 700);
      wasEngagedRef.current = true;
      return () => window.clearTimeout(t);
    }
    if (!isEngaged) wasEngagedRef.current = false;
  }, [isEngaged]);

  useEffect(() => {
    if (!onRipple) return undefined;
    const handler = (e) => {
      const t = performance.now() / 1000 - clockStartRef.current;
      setRipples((prev) => [...prev.slice(-7), { x: e.detail.x, y: e.detail.y, born: t }]);
    };
    window.addEventListener('surge:ripple', handler);
    return () => window.removeEventListener('surge:ripple', handler);
  }, [onRipple]);

  const state = curveAtElapsed(elapsedSeconds);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <FieldCanvas
        elapsedSeconds={elapsedSeconds}
        isEngaged={isEngaged}
        isPaused={isPaused}
        isComplete={isComplete}
        completeFade={completeFade}
        engageBurst={engageBurst}
        ripples={ripples}
      />

      {/* Pink-noise era TV static overlay at peak chaos */}
      {isEngaged && !isPaused && state.chaos > 0.15 ? (
        <div
          className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen"
          style={{
            opacity: 0.06 + state.chaos * 0.55,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />
      ) : null}
    </div>
  );
}

export function dispatchRipple(x, y) {
  window.dispatchEvent(new CustomEvent('surge:ripple', { detail: { x, y } }));
}
