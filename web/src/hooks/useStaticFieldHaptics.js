import { useEffect, useRef } from 'react';
import { StaticFieldHaptics } from '../lib/staticFieldHaptics';
import { curveAtElapsed } from '../lib/surgeCurve';

/**
 * Static Field haptics only — audio is driven by unified useSequenceAudio.
 */
export function useStaticFieldHaptics({ elapsedMs, isEngaged, isComplete, enabled = true }) {
  const hapticsRef = useRef(null);
  const elapsedRef = useRef(elapsedMs);
  const wasEngagedRef = useRef(false);
  const completedRef = useRef(false);

  elapsedRef.current = elapsedMs;

  useEffect(() => {
    hapticsRef.current = new StaticFieldHaptics();
    return () => hapticsRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const haptics = hapticsRef.current;
    if (!haptics) return;

    const getState = () => curveAtElapsed(elapsedRef.current / 1000);

    if (isComplete && !completedRef.current) {
      completedRef.current = true;
      haptics.complete();
      return;
    }

    if (!isEngaged) {
      if (wasEngagedRef.current) haptics.pause();
      wasEngagedRef.current = false;
      return;
    }

    if (!wasEngagedRef.current) {
      haptics.ack();
      haptics.start(getState);
    } else {
      haptics.resume();
    }

    wasEngagedRef.current = true;
  }, [elapsedMs, isEngaged, isComplete, enabled]);

  useEffect(() => {
    if (!isComplete) completedRef.current = false;
  }, [isComplete]);
}
