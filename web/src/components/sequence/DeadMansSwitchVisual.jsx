import { useEffect, useRef, useState } from 'react';
import FieldCanvas from './shared/FieldCanvas';
import TvStaticCanvas from './shared/TvStaticCanvas';
import { curveAtElapsed } from '../../lib/surgeCurve';

/**
 * Dead-Man's Switch — stark white/amber core, restrained strobe at peak,
 * radial blur pulse at 60 BPM baseline. Shares the classic Surge decay curve.
 */
export default function DeadMansSwitchVisual({
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
      const t = window.setTimeout(() => setEngageBurst(0), 900);
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
  const strobeActive = isEngaged && !isPaused && state.chaos > 0.4;

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

      <TvStaticCanvas elapsedSeconds={elapsedSeconds} isEngaged={isEngaged} isPaused={isPaused} />

      {strobeActive ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-[4] mix-blend-screen opacity-30"
            style={{
              background: `radial-gradient(ellipse 90% 80% at 48% 45%, rgba(255,248,230,0.18) 0%, transparent 55%)`,
              transform: 'translateX(-3px)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[4] mix-blend-screen opacity-30"
            style={{
              background: `radial-gradient(ellipse 90% 80% at 52% 45%, rgba(255,180,80,0.14) 0%, transparent 55%)`,
              transform: 'translateX(3px)',
            }}
          />
        </>
      ) : null}

      {isPaused ? (
        <div className="pointer-events-none absolute inset-0 z-[5] bg-black/40 backdrop-blur-[1px]" />
      ) : null}
    </div>
  );
}

export function dispatchDeadMansRipple(x, y) {
  window.dispatchEvent(new CustomEvent('surge:ripple', { detail: { x, y } }));
}
